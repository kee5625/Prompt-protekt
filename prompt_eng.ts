/**
 * Simple prompt engineering function using Gemini AI
 * Takes a user prompt and converts it into an optimized template for LLMs
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function promptGemini(
  apiKey: string,
  userPrompt: string
): Promise<string> {
  // Meta-prompt: Convert user's simple prompt into a structured LLM template
  const metaPrompt = `You are a prompt engineering expert. Convert the following user request into a clear, structured prompt template that can be used with any LLM.

User request: "${userPrompt}"

Create an optimized prompt template that:
1. Clarifies the task and desired output
2. Provides clear instructions
3. Specifies format if needed
4. Can be reused with different LLMs

Return ONLY the optimized prompt template, nothing else.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: metaPrompt }] }]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No text generated in response');
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to call Gemini API: ${error.message}`);
    }
    throw error;
  }
}

// ============================================
// TEST SECTION
// ============================================

async function runTest() {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  
  console.log('🚀 Testing Prompt Engineering Function...\n');

  try {
    // Test 1: Simple request
    console.log('Test 1: Convert simple request to template');
    console.log('User Input: "write a blog post about AI"');
    const template1 = await promptGemini(API_KEY, 'write a blog post about AI');
    console.log('✅ Generated Template:\n', template1);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: Code request
    console.log('Test 2: Convert coding request to template');
    console.log('User Input: "create a python function to sort a list"');
    const template2 = await promptGemini(API_KEY, 'create a python function to sort a list');
    console.log('✅ Generated Template:\n', template2);
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
runTest();