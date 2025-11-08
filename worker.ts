import { detectPersonalInformation } from './huggingface-worker';

interface Env {
  HF_TOKEN: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface NERMappings {
  persons: Record<string, string>;
  emails: Record<string, string>;
  phones: Record<string, string>;
  organizations: Record<string, string>;
  locations: Record<string, string>;
  dates: Record<string, string>;
  ssn: Record<string, string>;
  creditCards: Record<string, string>;
  accountNumbers: Record<string, string>;
  buildingNumbers: Record<string, string>;
  cities: Record<string, string>;
  datesOfBirth: Record<string, string>;
  driverLicenses: Record<string, string>;
  givenNames: Record<string, string>;
  surnames: Record<string, string>;
  idCards: Record<string, string>;
  passwords: Record<string, string>;
  socialNumbers: Record<string, string>;
  streets: Record<string, string>;
  taxNumbers: Record<string, string>;
  telephoneNumbers: Record<string, string>;
  usernames: Record<string, string>;
  zipCodes: Record<string, string>;
}

interface RequestBody {
  text: string;
}

interface ResponseBody {
  originalText: string;
  detectedEntities: any[];
  nerMappings: NERMappings;
  redactedText: string;
}

/**
 * Generate anonymized labels for detected entities
 */
function generateAnonymizedLabel(entityType: string, index: number, value: string): string {
  const labelMap: Record<string, (idx: number) => string> = {
    'PER': (idx) => `Person ${String.fromCharCode(65 + idx)}`, // Person A, B, C...
    'EMAIL': (idx) => `user${idx + 1}@anonymous.com`,
    'PHONE_NUM': (idx) => {
      if (value.startsWith('+')) {
        return `+1-XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
      } else if (value.startsWith('(')) {
        return `(XXX) XXX-${String(idx + 1).padStart(4, '0')}`;
      }
      return `XXX-XXX-${String(idx + 1).padStart(4, '0')}`;
    },
    'ORG': (idx) => `Company ${String.fromCharCode(65 + idx)}`, // Company A, B, C...
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

  // Default fallback
  return `[${entityType} Redacted]`;
}

/**
 * Process detection results and create NER mappings
 */
function createNERMappings(detectedEntities: any[]): { mappings: NERMappings; redactedText: string; originalText: string } {
  const mappings: NERMappings = {
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

  // Count entities by type for generating unique labels
  const entityCounts: Record<string, number> = {};
  
  // Sort entities by start position (reverse order for replacement)
  const sortedEntities = [...detectedEntities].sort((a, b) => b.start - a.start);
  
  let originalText = sortedEntities.length > 0 ? sortedEntities[0].originalText || '' : '';
  let redactedText = originalText;

  // Process each entity
  detectedEntities.forEach((entity) => {
    const entityType = entity.entity_group;
    const entityValue = entity.word.trim();
    
    // Initialize count for this entity type
    if (!entityCounts[entityType]) {
      entityCounts[entityType] = 0;
    }

    // Check if we already have a mapping for this value
    let anonymizedValue: string;
    const existingMapping = Object.values(mappings).find(map => map[entityValue]);
    
    if (existingMapping && existingMapping[entityValue]) {
      anonymizedValue = existingMapping[entityValue];
    } else {
      anonymizedValue = generateAnonymizedLabel(entityType, entityCounts[entityType], entityValue);
      entityCounts[entityType]++;
    }

    // Map to the appropriate category
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

  // Create redacted text by replacing entities
  sortedEntities.forEach((entity) => {
    const entityValue = entity.word.trim();
    let anonymizedValue = '';

    // Find the anonymized value from mappings
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
 * Create JSON response helper
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Main Cloudflare Worker handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
    }

    // Parse URL
    const url = new URL(request.url);
    
    // Only accept /detect endpoint (or root)
    if (url.pathname !== '/detect' && url.pathname !== '/') {
      return jsonResponse({ error: 'Endpoint not found. Use /detect' }, 404);
    }

    try {
      // Parse request body
      const requestData = await request.json() as RequestBody;

      if (!requestData.text || typeof requestData.text !== 'string') {
        return jsonResponse({ error: 'Invalid request. Please provide a "text" field.' }, 400);
      }

      console.log(`[${new Date().toISOString()}] Processing text: "${requestData.text.substring(0, 100)}..."`);

      // Detect personal information (pass the HF_TOKEN from environment)
      const detectedEntities = await detectPersonalInformation(requestData.text, env.HF_TOKEN);

      // Add original text to each entity for processing
      const entitiesWithText = detectedEntities.map(entity => ({
        ...entity,
        originalText: requestData.text
      }));

      // Create NER mappings and redacted text
      const { mappings, redactedText } = createNERMappings(entitiesWithText);

      // Prepare response
      const response: ResponseBody = {
        originalText: requestData.text,
        detectedEntities: detectedEntities,
        nerMappings: mappings,
        redactedText: redactedText
      };

      console.log(`[${new Date().toISOString()}] Detected ${detectedEntities.length} entities`);

      return jsonResponse(response);

    } catch (error) {
      console.error('Error processing request:', error);
      return jsonResponse({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  },
};
