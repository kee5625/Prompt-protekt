import { InferenceClient } from '@huggingface/inference';
import 'dotenv/config';

// Initialize the Hugging Face Inference client
// You can set your HF_TOKEN as an environment variable or pass it directly
const client = new InferenceClient(process.env.HF_TOKEN || '');

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
 * @returns Array of detected entities with their types and positions
 */
async function detectPersonalInformation(text: string): Promise<TokenClassificationOutput[]> {
  try {
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

/**
 * Main function to run the personal information detection
 */
async function main() {
  // Example texts with personal information
  const testTexts = [
    "My name is John Doe and my email is john.doe@example.com. You can reach me at +1-555-123-4567.",
    "Please send the invoice to Sarah Johnson at 123 Main Street, New York, NY 10001. Her SSN is 123-45-6789.",
    "Contact information: Alice Smith, phone: (555) 987-6543, born on 03/15/1990."
  ];
  
  for (const text of testTexts) {
    console.log('\n' + '='.repeat(60));
    const results = await detectPersonalInformation(text);
    displayResults(results, text);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other modules
export { detectPersonalInformation, displayResults };
