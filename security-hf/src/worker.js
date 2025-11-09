// Cloudflare Worker for PII Detection using Piiranha Model
const MODEL_ID = "iiiorg/piiranha-v1-detect-personal-information";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

console.log('Worker initialized with MODEL_ID:', MODEL_ID);
console.log('HF_API_URL:', HF_API_URL);

/**
 * Detect personal information using Piiranha model
 */
async function detectPII(text, token) {
  console.log('=== detectPII called ===');
  console.log('Input text length:', text?.length);
  console.log('Input text preview:', text?.substring(0, 100));
  console.log('Token present:', !!token);
  console.log('Token prefix:', token?.substring(0, 10) + '...');
  console.log('Fetching URL:', HF_API_URL);

  const requestBody = { inputs: text };
  console.log('Request body:', JSON.stringify(requestBody));

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('Response status:', response.status);
  console.log('Response statusText:', response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HuggingFace API error response:', errorText);
    throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('API response result:', JSON.stringify(result));

  // Handle model loading
  if (result.error && result.error.includes('loading')) {
    console.log('Model is loading, returning empty array');
    return [];
  }

  const finalResult = Array.isArray(result) ? result : [];
  console.log('Final result (entities count):', finalResult.length);
  console.log('Final result:', JSON.stringify(finalResult));

  return finalResult;
}

/**
 * Generate anonymized labels
 */
function generateLabel(entityType, index, value) {
  console.log('Generating label for:', { entityType, index, value });

  const generators = {
    'PER': (idx) => `Person ${String.fromCharCode(65 + idx)}`,
    'EMAIL': (idx) => `user${idx + 1}@anonymous.com`,
    'PHONE_NUM': (idx) => {
      if (value.startsWith('+')) return `+1-XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
      if (value.startsWith('(')) return `(XXX) XXX-${String(idx + 1).padStart(4, '0')}`;
      return `XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
    },
  };

  const label = generators[entityType] ? generators[entityType](index) : `[${entityType}]`;
  console.log('Generated label:', label);

  return label;
}

/**
 * Process detected entities and create mappings
 */
function createMappings(entities) {
  console.log('=== createMappings called ===');
  console.log('Input entities:', JSON.stringify(entities));

  const result = {
    names: {},
    emails: {},
    phones: {},
    addresses: {},
    ids: {},
    credentials: {},
    financialInfo: {},
  };

  const counters = {
    // Names
    GIVENNAME: 0,
    SURNAME: 0,
    // Contact
    EMAIL: 0,
    TELEPHONENUM: 0,
    // Location
    STREET: 0,
    BUILDINGNUM: 0,
    CITY: 0,
    ZIPCODE: 0,
    // IDs
    SOCIALNUM: 0,
    DRIVERLICENSENUM: 0,
    IDCARDNUM: 0,
    TAXNUM: 0,
    // Credentials
    USERNAME: 0,
    PASSWORD: 0,
    // Financial
    ACCOUNTNUM: 0,
    CREDITCARDNUMBER: 0,
    // Other
    DATEOFBIRTH: 0,
  };

  entities.forEach((entity, idx) => {
    console.log(`Processing entity ${idx}:`, entity);
    const type = entity.entity_group;
    const value = entity.word.trim();

    // Skip if already mapped
    if (Object.values(result).some(category => category[value])) {
      console.log(`Skipping duplicate value: ${value}`);
      return;
    }

    let label;
    let category;

    // Map entity types to categories
    switch (type) {
      // Names
      case 'GIVENNAME':
      case 'SURNAME':
        label = `Person ${String.fromCharCode(65 + counters.GIVENNAME + counters.SURNAME)}`;
        category = 'names';
        break;

      // Email
      case 'EMAIL':
        label = `user${counters.EMAIL + 1}@anonymous.com`;
        category = 'emails';
        break;

      // Phone
      case 'TELEPHONENUM':
        label = value.startsWith('+')
          ? `+1-XXX-XXX-${String(counters.TELEPHONENUM + 1).padStart(4, '0')}`
          : `XXX-XXX-${String(counters.TELEPHONENUM + 1).padStart(4, '0')}`;
        category = 'phones';
        break;

      // Sometimes SOCIALNUM is misclassified for phone numbers
      case 'SOCIALNUM':
        // Check if it looks like a phone number (contains dashes in phone format or starts with area code)
        if (value.match(/^\d{3}-\d{3}-\d{4}$/) || value.match(/^\(\d{3}\)\s*\d{3}-\d{4}$/) || value.match(/^\+\d/)) {
          label = value.startsWith('+')
            ? `+1-XXX-XXX-${String(counters.SOCIALNUM + 1).padStart(4, '0')}`
            : `XXX-XXX-${String(counters.SOCIALNUM + 1).padStart(4, '0')}`;
          category = 'phones';
        } else {
          // Otherwise treat as SSN
          label = `XXX-XX-${String(counters.SOCIALNUM + 1).padStart(4, '0')}`;
          category = 'ids';
        }
        break;

      // Address components
      case 'STREET':
        label = `[STREET_${counters.STREET + 1}]`;
        category = 'addresses';
        break;

      case 'BUILDINGNUM':
        label = `[BUILDING_${counters.BUILDINGNUM + 1}]`;
        category = 'addresses';
        break;

      case 'CITY':
        label = `[CITY_${counters.CITY + 1}]`;
        category = 'addresses';
        break;

      case 'ZIPCODE':
        label = `[ZIPCODE_${counters.ZIPCODE + 1}]`;
        category = 'addresses';
        break;

      // Government IDs
      case 'DRIVERLICENSENUM':
        label = `[DL_${counters.DRIVERLICENSENUM + 1}]`;
        category = 'ids';
        break;

      case 'IDCARDNUM':
        label = `[ID_${counters.IDCARDNUM + 1}]`;
        category = 'ids';
        break;

      case 'TAXNUM':
        label = `[TAX_${counters.TAXNUM + 1}]`;
        category = 'ids';
        break;

      // Credentials
      case 'USERNAME':
        label = `user${counters.USERNAME + 1}`;
        category = 'credentials';
        break;

      case 'PASSWORD':
        label = `[PASSWORD_${counters.PASSWORD + 1}]`;
        category = 'credentials';
        break;

      // Financial
      case 'ACCOUNTNUM':
        label = `[ACCT_XXXX${String(counters.ACCOUNTNUM + 1).padStart(4, '0')}]`;
        category = 'financialInfo';
        break;

      case 'CREDITCARDNUMBER':
        label = `XXXX-XXXX-XXXX-${String(counters.CREDITCARDNUMBER + 1).padStart(4, '0')}`;
        category = 'financialInfo';
        break;

      // Date of Birth
      case 'DATEOFBIRTH':
        label = `[DOB_${counters.DATEOFBIRTH + 1}]`;
        category = 'ids';
        break;

      default:
        console.log('Unknown entity type:', type, '- skipping');
        return;
    }

    // Add to result
    result[category][value] = label;
    counters[type]++;
    console.log(`Added ${type}:`, value, '->', label, `(category: ${category})`);
  });

  // Remove empty categories
  Object.keys(result).forEach(key => {
    if (Object.keys(result[key]).length === 0) {
      console.log(`Removing empty category: ${key}`);
      delete result[key];
    }
  });

  console.log('Final mappings:', JSON.stringify(result));
  return result;
}

/**
 * Main handler
 */
export default {
  async fetch(request, env) {
    console.log('=== Worker fetch handler called ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      console.log('Rejecting non-POST request');
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('Parsing request body...');
      const { text } = await request.json();
      console.log('Received text:', text);

      if (!text || typeof text !== 'string') {
        console.log('Invalid text field');
        return new Response(
          JSON.stringify({ error: 'Missing or invalid "text" field' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Checking for HF_TOKEN...');
      const hfToken = env?.HF_TOKEN;
      console.log('HF_TOKEN present:', !!hfToken);
      console.log('HF_TOKEN value:', hfToken ? hfToken.substring(0, 10) + '...' : 'MISSING');

      if (!hfToken) {
        console.error('HF_TOKEN not configured in environment');
        return new Response(
          JSON.stringify({ error: 'API token not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Detect PII
      console.log('Calling detectPII...');
      const entities = await detectPII(text, hfToken);
      console.log('detectPII returned entities:', entities);

      // Create mappings
      console.log('Creating mappings...');
      const mappings = createMappings(entities);
      console.log('Mappings created:', mappings);

      // Return only non-empty mappings
      console.log('Returning response with mappings');
      return new Response(
        JSON.stringify(mappings),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('=== ERROR CAUGHT ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};
