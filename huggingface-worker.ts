import { InferenceClient } from '@huggingface/inference';

const MODEL_ID = "iiiorg/piiranha-v1-detect-personal-information";

interface TokenClassificationOutput {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

/**
 * Detect personal information in text using the piiranha model
 * @param text - The input text to analyze
 * @param token - Optional Hugging Face API token (for Cloudflare Workers compatibility)
 * @returns Array of detected entities with their types and positions
 */
async function detectPersonalInformation(text: string, token?: string): Promise<TokenClassificationOutput[]> {
  try {
    // Use provided token or fall back to environment variable (for Node.js compatibility)
    const apiToken = token || (typeof process !== 'undefined' && process.env?.HF_TOKEN) || '';
    const client = new InferenceClient(apiToken);
    
    const result = await client.tokenClassification({
      model: MODEL_ID,
      inputs: text,
    });
    
    return result as TokenClassificationOutput[];
  } catch (error) {
    console.error('Error detecting personal information:', error);
    throw error;
  }
}

/**
 * Format and display the detected personal information
 */
function displayResults(results: TokenClassificationOutput[], originalText: string) {
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


// Export functions for use in other modules
export { detectPersonalInformation, displayResults };
