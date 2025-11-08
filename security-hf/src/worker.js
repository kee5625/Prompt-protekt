// Combined Cloudflare Worker for Personal Information Detection
// Converted from TypeScript to JavaScript

import { InferenceClient } from '@huggingface/inference';

const MODEL_ID = "iiiorg/piiranha-v1-detect-personal-information";

/**
 * Detect personal information in text using the piiranha model
 * @param {string} text - The input text to analyze
 * @param {string} [token] - Optional Hugging Face API token
 * @returns {Promise<Array>} Array of detected entities with their types and positions
 */
async function detectPersonalInformation(text, token) {
  try {
    const apiToken = token || (typeof process !== 'undefined' && process.env?.HF_TOKEN) || '';
    const client = new InferenceClient(apiToken);

    const result = await client.tokenClassification({
      model: MODEL_ID,
      inputs: text,
    });

    return result;
  } catch (error) {
    console.error('Error detecting personal information:', error);
    throw error;
  }
}

/**
 * Format and display the detected personal information
 */
function displayResults(results, originalText) {
  console.log('\n=== Personal Information Detection Results ===\n');
  console.log('Original text:', originalText);
  console.log('\nDetected entities:');

  if (results.length === 0) {
    console.log('No personal information detected.');
    return;
  }

  results.forEach((entity, index) => {
    console.log(`\n${index + 1}. ${entity.entity_group}`);
    console.log(`   Text: "${entity.word}"`);
    console.log(`   Confidence: ${(entity.score * 100).toFixed(2)}%`);
    console.log(`   Position: ${entity.start}-${entity.end}`);
  });
}

/**
 * Generate anonymized labels for detected entities
 */
function generateAnonymizedLabel(entityType, index, value) {
  const labelMap = {
    'PER': (idx) => `Person ${String.fromCharCode(65 + idx)}`,
    'EMAIL': (idx) => `user${idx + 1}@anonymous.com`,
    'PHONE_NUM': (idx) => {
      if (value.startsWith('+')) {
        return `+1-XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
      } else if (value.startsWith('(')) {
        return `(XXX) XXX-${String(idx + 1).padStart(4, '0')}`;
      }
      return `XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
    },
    'ORG': (idx) => `Company ${String.fromCharCode(65 + idx)}`,
    'LOC': (idx) => '[Location Redacted]',
    'STREET_ADDRESS': (idx) => '[Address Redacted]',
    'CITY': (idx) => '[City Redacted]',
    'STATE': (idx) => '[State Redacted]',
    'COUNTRY': (idx) => '[Country Redacted]',
    'DATE': (idx) => '[Date Redacted]',
    'US_SSN': (idx) => 'XXX-XX-XXXX',
    'CREDIT_CARD': (idx) => 'XXXX-XXXX-XXXX-XXXX',
    'ACCOUNTNUM': (idx) => `ACCT-${String(idx + 1).padStart(8, 'X')}`,
    'BUILDINGNUM': (idx) => `[Building ${String.fromCharCode(65 + idx)}]`,
    'CREDITCARDNUMBER': (idx) => 'XXXX-XXXX-XXXX-XXXX',
    'DATEOFBIRTH': (idx) => '[DOB Redacted]',
    'DRIVERLICENSENUM': (idx) => `DL-XXXXXXXX`,
    'GIVENNAME': (idx) => `FirstName${String.fromCharCode(65 + idx)}`,
    'SURNAME': (idx) => `LastName${String.fromCharCode(65 + idx)}`,
    'IDCARDNUM': (idx) => `ID-XXXXXXXX`,
    'PASSWORD': (idx) => '[PASSWORD REDACTED]',
    'SOCIALNUM': (idx) => 'XXX-XX-XXXX',
    'STREET': (idx) => '[Street Redacted]',
    'TAXNUM': (idx) => `TAX-XXXXXXXX`,
    'TELEPHONENUM': (idx) => {
      if (value.startsWith('+')) {
        return `+X-XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
      } else if (value.startsWith('(')) {
        return `(XXX) XXX-${String(idx + 1).padStart(4, '0')}`;
      }
      return `XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
    },
    'USERNAME': (idx) => `user${String(idx + 1).padStart(4, '0')}`,
    'ZIPCODE': (idx) => 'XXXXX',
  };

  const generator = labelMap[entityType];
  if (generator) {
    return generator(index);
  }

  return `[${entityType} Redacted]`;
}

/**
 * Process detection results and create NER mappings
 */
function createNERMappings(detectedEntities) {
  const mappings = {
    persons: {},
    emails: {},
    phones: {},
    organizations: {},
    locations: {},
    dates: {},
    ssn: {},
    creditCards: {},
    accountNumbers: {},
    buildingNumbers: {},
    cities: {},
    datesOfBirth: {},
    driverLicenses: {},
    givenNames: {},
    surnames: {},
    idCards: {},
    passwords: {},
    socialNumbers: {},
    streets: {},
    taxNumbers: {},
    telephoneNumbers: {},
    usernames: {},
    zipCodes: {}
  };

  const entityCounts = {};

  const sortedEntities = [...detectedEntities].sort((a, b) => b.start - a.start);

  let originalText = sortedEntities.length > 0 ? sortedEntities[0].originalText || '' : '';
  let redactedText = originalText;

  detectedEntities.forEach((entity) => {
    const entityType = entity.entity_group;
    const entityValue = entity.word.trim();

    if (!entityCounts[entityType]) {
      entityCounts[entityType] = 0;
    }

    let anonymizedValue;
    const existingMapping = Object.values(mappings).find(map => map[entityValue]);

    if (existingMapping && existingMapping[entityValue]) {
      anonymizedValue = existingMapping[entityValue];
    } else {
      anonymizedValue = generateAnonymizedLabel(entityType, entityCounts[entityType], entityValue);
      entityCounts[entityType]++;
    }

    switch (entityType) {
      case 'PER':
        mappings.persons[entityValue] = anonymizedValue;
        break;
      case 'EMAIL':
        mappings.emails[entityValue] = anonymizedValue;
        break;
      case 'PHONE_NUM':
        mappings.phones[entityValue] = anonymizedValue;
        break;
      case 'ORG':
        mappings.organizations[entityValue] = anonymizedValue;
        break;
      case 'LOC':
      case 'STREET_ADDRESS':
      case 'STATE':
      case 'COUNTRY':
        mappings.locations[entityValue] = anonymizedValue;
        break;
      case 'CITY':
        mappings.cities[entityValue] = anonymizedValue;
        break;
      case 'DATE':
        mappings.dates[entityValue] = anonymizedValue;
        break;
      case 'US_SSN':
        mappings.ssn[entityValue] = anonymizedValue;
        break;
      case 'CREDIT_CARD':
      case 'CREDITCARDNUMBER':
        mappings.creditCards[entityValue] = anonymizedValue;
        break;
      case 'ACCOUNTNUM':
        mappings.accountNumbers[entityValue] = anonymizedValue;
        break;
      case 'BUILDINGNUM':
        mappings.buildingNumbers[entityValue] = anonymizedValue;
        break;
      case 'DATEOFBIRTH':
        mappings.datesOfBirth[entityValue] = anonymizedValue;
        break;
      case 'DRIVERLICENSENUM':
        mappings.driverLicenses[entityValue] = anonymizedValue;
        break;
      case 'GIVENNAME':
        mappings.givenNames[entityValue] = anonymizedValue;
        break;
      case 'SURNAME':
        mappings.surnames[entityValue] = anonymizedValue;
        break;
      case 'IDCARDNUM':
        mappings.idCards[entityValue] = anonymizedValue;
        break;
      case 'PASSWORD':
        mappings.passwords[entityValue] = anonymizedValue;
        break;
      case 'SOCIALNUM':
        mappings.socialNumbers[entityValue] = anonymizedValue;
        break;
      case 'STREET':
        mappings.streets[entityValue] = anonymizedValue;
        break;
      case 'TAXNUM':
        mappings.taxNumbers[entityValue] = anonymizedValue;
        break;
      case 'TELEPHONENUM':
        mappings.telephoneNumbers[entityValue] = anonymizedValue;
        break;
      case 'USERNAME':
        mappings.usernames[entityValue] = anonymizedValue;
        break;
      case 'ZIPCODE':
        mappings.zipCodes[entityValue] = anonymizedValue;
        break;
    }
  });

  sortedEntities.forEach((entity) => {
    const entityValue = entity.word.trim();
    let anonymizedValue = '';

    for (const category of Object.values(mappings)) {
      if (category[entityValue]) {
        anonymizedValue = category[entityValue];
        break;
      }
    }

    if (anonymizedValue) {
      redactedText = redactedText.substring(0, entity.start) +
                     anonymizedValue +
                     redactedText.substring(entity.end);
    }
  });

  return { mappings, redactedText, originalText };
}

/**
 * Main request handler for Cloudflare Worker
 */
async function handleRequest(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const url = new URL(request.url);
  if (url.pathname !== '/detect' && url.pathname !== '/') {
    return new Response(
      JSON.stringify({ error: 'Endpoint not found. Use /detect' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const requestData = await request.json();

    if (!requestData.text || typeof requestData.text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Please provide a "text" field.' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`[${new Date().toISOString()}] Processing text: "${requestData.text.substring(0, 100)}..."`);

    const hfToken = env.HF_TOKEN || '';
    const detectedEntities = await detectPersonalInformation(requestData.text, hfToken);

    const entitiesWithText = detectedEntities.map(entity => ({
      ...entity,
      originalText: requestData.text
    }));

    const { mappings, redactedText } = createNERMappings(entitiesWithText);

    const response = {
      originalText: requestData.text,
      detectedEntities: detectedEntities,
      nerMappings: mappings,
      redactedText: redactedText
    };

    console.log(`[${new Date().toISOString()}] Detected ${detectedEntities.length} entities`);

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Export the worker handler
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};
