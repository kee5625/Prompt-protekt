// Combined Cloudflare Worker for Personal Information Detection
// Using direct fetch API (CURL-style) instead of InferenceClient

const MODEL_ID = "iiiorg/piiranha-v1-detect-personal-information";
const HF_API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

/**
 * Detect personal information in text using the piiranha model
 * @param {string} text - The input text to analyze
 * @param {string} [token] - Hugging Face API token (required for Cloudflare Workers)
 * @returns {Promise<Array>} Array of detected entities with their types and positions
 */
async function detectPersonalInformation(text, token) {
  try {
    const apiToken = token || '';

    if (!apiToken) {
      throw new Error('HuggingFace API token is required');
    }

    console.log(`[${new Date().toISOString()}] Calling HuggingFace API for model: ${MODEL_ID}`);

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    const responseText = await response.text();
    console.log(`[${new Date().toISOString()}] HuggingFace API response status: ${response.status}`);

    if (!response.ok) {
      console.error('HuggingFace API error response:', responseText);
      throw new Error(`HuggingFace API error: ${response.status} - ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse HuggingFace API response:', responseText);
      throw new Error(`Invalid JSON response from HuggingFace API: ${responseText.substring(0, 200)}`);
    }

    // Handle model loading status
    if (result.error && result.error.includes('loading')) {
      console.log('Model is loading, returning empty results for now');
      return [];
    }

    return result;
  } catch (error) {
    console.error('Error detecting personal information:', error);
    throw error;
  }
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);

  // Handle GET requests with helpful information
  if (request.method === 'GET') {
    // Status endpoint at root "/"
    if (url.pathname === '/' || url.pathname === '') {
      const statusMessage = {
        service: 'Personal Information Detection API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          '/': {
            method: 'GET',
            description: 'Status and API information'
          },
          '/detect': {
            method: 'POST',
            description: 'Detect and redact personal information',
            example: {
              text: 'Your text with personal information here'
            }
          }
        },
        usage: {
          description: 'Send POST request to /detect with JSON body',
          curlExample: `curl -X POST ${url.origin}/detect -H "Content-Type: application/json" -d '{"text":"My name is John Doe and my email is john@example.com"}'`
        }
      };

      return new Response(JSON.stringify(statusMessage, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // For other GET paths, return 404
    return new Response(
      JSON.stringify({
        error: 'Not found',
        message: 'Use GET / for status or POST /detect for detection'
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed. Use POST.',
        receivedMethod: request.method,
        allowedMethods: ['GET', 'POST', 'OPTIONS']
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

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

    const hfToken = env?.HF_TOKEN || '';

    if (!hfToken) {
      console.error('HF_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'HuggingFace API token not configured. Please set HF_TOKEN in Cloudflare dashboard secrets.'
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

    console.log(`[${new Date().toISOString()}] Calling HuggingFace API...`);
    const detectedEntities = await detectPersonalInformation(requestData.text, hfToken);
    console.log(`[${new Date().toISOString()}] HuggingFace API responded with ${detectedEntities?.length || 0} entities`);

    if (!Array.isArray(detectedEntities)) {
      console.error('Unexpected response from HuggingFace API:', detectedEntities);
      return new Response(
        JSON.stringify({
          error: 'API error',
          message: 'Unexpected response from HuggingFace API',
          details: detectedEntities
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

    console.log(`[${new Date().toISOString()}] Successfully processed request`);

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
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
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
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Unhandled error in fetch handler:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }),
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
};
