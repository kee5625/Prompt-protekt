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
    persons: {},
    emails: {},
    phones: {},
  };

  const counters = {
    GIVENNAME: 0,
    SURNAME: 0,
    PER: 0,
    EMAIL: 0,
    EMAILADDRESS: 0,
    PHONE_NUM: 0,
    TELEPHONENUM: 0,
    PHONENUMBER: 0
  };

  entities.forEach((entity, idx) => {
    console.log(`Processing entity ${idx}:`, entity);
    const type = entity.entity_group;
    const value = entity.word.trim();

    // Skip if already mapped
    if (result.persons[value] || result.emails[value] || result.phones[value]) {
      console.log(`Skipping duplicate value: ${value}`);
      return;
    }

    // Map entity types to categories
    if (type === 'GIVENNAME' || type === 'SURNAME' || type === 'PER') {
      const label = generateLabel('PER', counters.GIVENNAME + counters.SURNAME + counters.PER, value);
      result.persons[value] = label;
      counters[type]++;
      console.log('Added person:', value, '->', label);
    } else if (type === 'EMAIL' || type === 'EMAILADDRESS') {
      const label = generateLabel('EMAIL', counters.EMAIL + counters.EMAILADDRESS, value);
      result.emails[value] = label;
      counters[type]++;
      console.log('Added email:', value, '->', label);
    } else if (type === 'PHONE_NUM' || type === 'TELEPHONENUM' || type === 'PHONENUMBER') {
      const label = generateLabel('PHONE_NUM', counters.PHONE_NUM + counters.TELEPHONENUM + counters.PHONENUMBER, value);
      result.phones[value] = label;
      counters[type]++;
      console.log('Added phone:', value, '->', label);
    } else {
      console.log('Unknown entity type:', type, '- skipping');
    }
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
