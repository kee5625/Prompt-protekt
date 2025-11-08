import 'dotenv/config';
import { detectPersonalInformation, displayResults } from './huggingface';

/**
 * Test suite for personal information detection
 */

// Test texts with various types of personal information
const testTexts = [
  {
    id: 1,
    description: "Email, phone number, and name",
    text: "My name is John Doe and my email is john.doe@example.com. You can reach me at +1-555-123-4567."
  },
  {
    id: 2,
    description: "Address, name, and SSN",
    text: "Please send the invoice to Sarah Johnson at 123 Main Street, New York, NY 10001. Her SSN is 123-45-6789."
  },
  {
    id: 3,
    description: "Contact information with phone and date of birth",
    text: "Contact information: Alice Smith, phone: (555) 987-6543, born on 03/15/1990."
  },
  {
    id: 4,
    description: "Credit card and banking information",
    text: "My credit card number is 4532-1234-5678-9010. Please wire the funds to account number 987654321 at routing 021000021."
  },
  {
    id: 5,
    description: "Multiple identifiers in a professional context",
    text: "Dr. Michael Chen (ID: EMP-2024-1234) can be reached at m.chen@hospital.org or +44 20 7946 0958. His office is located at 456 Medical Plaza, Suite 300, London, UK."
  }
];

/**
 * Run a single test case
 */
async function runTestCase(testCase: typeof testTexts[0]): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST CASE ${testCase.id}: ${testCase.description}`);
  console.log('='.repeat(80));
  
  try {
    const startTime = Date.now();
    const results = await detectPersonalInformation(testCase.text);
    const endTime = Date.now();
    
    displayResults(results, testCase.text);
    
    console.log(`\nProcessing time: ${endTime - startTime}ms`);
    console.log(`Total entities detected: ${results.length}`);
    
    // Group results by entity type
    const entityTypes = new Map<string, number>();
    results.forEach(entity => {
      entityTypes.set(entity.entity_group, (entityTypes.get(entity.entity_group) || 0) + 1);
    });
    
    if (entityTypes.size > 0) {
      console.log('\nEntity type summary:');
      entityTypes.forEach((count, type) => {
        console.log(`  - ${type}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error(`\n❌ Error in test case ${testCase.id}:`, error);
    throw error;
  }
}

/**
 * Run all test cases sequentially
 */
async function runAllTests(): Promise<void> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         PERSONAL INFORMATION DETECTION - TEST SUITE                           ║');
  console.log('║         Model: iiiorg/piiranha-v1-detect-personal-information                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  
  const overallStartTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  
  for (const testCase of testTexts) {
    try {
      await runTestCase(testCase);
      successCount++;
    } catch (error) {
      failureCount++;
      console.error(`Test case ${testCase.id} failed.`);
    }
  }
  
  const overallEndTime = Date.now();
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUITE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total test cases: ${testTexts.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`Total execution time: ${overallEndTime - overallStartTime}ms`);
  console.log(`Average time per test: ${Math.round((overallEndTime - overallStartTime) / testTexts.length)}ms`);
  console.log('='.repeat(80));
}

/**
 * Run a specific test by ID
 */
async function runSpecificTest(testId: number): Promise<void> {
  const testCase = testTexts.find(t => t.id === testId);
  
  if (!testCase) {
    console.error(`Test case with ID ${testId} not found.`);
    console.log(`Available test IDs: ${testTexts.map(t => t.id).join(', ')}`);
    return;
  }
  
  await runTestCase(testCase);
}

/**
 * Custom test with user-provided text
 */
async function runCustomTest(customText: string): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('CUSTOM TEST');
  console.log('='.repeat(80));
  
  const results = await detectPersonalInformation(customText);
  displayResults(results, customText);
}

// Main execution
async function main() {
  // Check if HF_TOKEN is set
  if (!process.env.HF_TOKEN) {
    console.error('❌ ERROR: HF_TOKEN environment variable is not set.');
    console.log('\nPlease set your Hugging Face API token:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your token from https://huggingface.co/settings/tokens');
    console.log('3. Run the test again\n');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all tests by default
    await runAllTests();
  } else if (args[0] === '--test' && args[1]) {
    // Run specific test by ID
    const testId = parseInt(args[1], 10);
    await runSpecificTest(testId);
  } else if (args[0] === '--custom' && args[1]) {
    // Run custom text test
    await runCustomTest(args.slice(1).join(' '));
  } else {
    console.log('Usage:');
    console.log('  npm run test              # Run all tests');
    console.log('  npm run test -- --test 1  # Run specific test by ID');
    console.log('  npm run test -- --custom "Your text here"  # Test custom text');
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests, runSpecificTest, runCustomTest };
