/**
 * Simple prompt engineering function using Gemini AI
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function promptGemini(
  apiKey: string,
  prompt: string
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }]
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
  // REPLACE THIS WITH YOUR ACTUAL API KEY
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  
  console.log('🚀 Testing Gemini Prompt Function...\n');

  try {
    // Test 1: Simple prompt
    console.log('Test 1: Simple prompt');
    const response1 = await promptGemini(API_KEY, 'Say "Hello from Gemini!" and nothing else');
    console.log('✅ Response:', response1);
    console.log('');

    // Test 2: Another prompt
    console.log('Test 2: Haiku test');
    const response2 = await promptGemini(API_KEY, 'Write a haiku about coding');
    console.log('✅ Response:', response2);
    console.log('');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
runTest();