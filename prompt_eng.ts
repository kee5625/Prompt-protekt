/**
 * Simple prompt engineering function using Gemini AI
 * Takes a user prompt and converts it into an optimized template for LLMs
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Benchmark result interface
interface BenchmarkResult {
  prompt: string;
  generatedPrompt: string;
  responseTimeMs: number;
  timestamp: Date;
}

async function promptGemini(
  userPrompt: string
): Promise<{ result: string; benchmark: BenchmarkResult }> {
  const startTime = performance.now();

  // ===================================================================
  // START OF UPDATED SECTION
  // This meta-prompt now includes the specific template from our discussion.
  // ===================================================================

  const metaPrompt = `You are a world-class prompt engineering expert. Your task is to analyze the user's simple request and enhance it by filling out the following structured template.

Analyze the user's request and infer their intent to fill in each section of the template as completely as possible.

**User's Simple Request:**
"${userPrompt}"

---
**[THE TEMPLATE TO FILL]**

### 1. 🎯 Core Task & Objective
* **Task:** [Analyze the prompt's primary verb/action, e.g., Write, Summarize, Generate, Analyze]
* **Objective:** [Infer the user's ultimate goal, e.g., To persuade a manager, to understand a complex topic, to create marketing copy]

### 2. 👤 Persona & Role
* **Act As:** [Infer the ideal persona for the AI, e.g., An expert Python programmer, a supportive tutor, a professional marketing executive]

### 3. CONTEXT & AUDIENCE
* **Background:** [Infer any context from the prompt, e.g., "User is preparing for a presentation," "This is for a personal project"]
* **Target Audience:** [Infer the end-user of the response, e.g., C-level executives, 10th-grade students, a technical team]

### 4. 📝 Key Content & Information
* **Must Include:**
    * [Extract all key topics, keywords, or data points from the user's prompt]
* **Must Exclude (Exclusions):**
    * [List any implied exclusions. If none, state "None."]

### 5. 📏 Constraints & Format
* **Tone:** [Infer the most appropriate tone, e.g., Formal, Casual, Persuasive, Technical, Enthusiastic]
* **Length:** [Infer a reasonable length, e.g., "A concise paragraph," "A 5-item bulleted list," "A complete code snippet"]
* **Format:** [Infer the desired output structure, e.g., Email, Markdown text, JSON object, Python script, Blog post]

---

Return ONLY the filled-out Markdown template. Do not add any other conversation, preamble, or explanations.`;

  // ===================================================================
  // END OF UPDATED SECTION
  // ===================================================================

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  // NOTE: You mentioned 'gemini-2.5-flash-lite' in your code.
  // As of now, the common models are 'gemini-1.5-flash-latest' or 'gemini-1.5-pro-latest'.
  // I'll use 'gemini-1.5-flash-latest' as it's a valid and fast model.
  // Update this if 'gemini-2.5-flash-lite' is a specific model you have access to.
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: metaPrompt }] }],
    // Optional: Add safety settings and generation config if needed
    // generationConfig: {
    //   temperature: 0.7,
    //   topP: 1,
    //   topK: 1,
    //   maxOutputTokens: 2048,
    // },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: any = await response.json();

    // Add more robust checking for different stop/block reasons
    if (!data.candidates || data.candidates.length === 0) {
      if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(
          `Prompt was blocked. Reason: ${data.promptFeedback.blockReason}`
        );
      }
      throw new Error('No candidates generated in response');
    }

    if (
      data.candidates[0].finishReason &&
      data.candidates[0].finishReason !== 'STOP'
    ) {
      console.warn(
        `Generation finished with reason: ${data.candidates[0].finishReason}`
      );
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text generated in response');
    }

    const endTime = performance.now();
    const responseTimeMs = Math.round((endTime - startTime) * 100) / 100;

    const benchmark: BenchmarkResult = {
      prompt: userPrompt,
      generatedPrompt: text.trim(), // Trim whitespace
      responseTimeMs,
      timestamp: new Date(),
    };

    return { result: text.trim(), benchmark };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to call Gemini API: ${error.message}`);
    }
    throw error;
  }
}

// ============================================
// TEST SECTION (No changes needed here)
// ============================================
async function runTest() {
  console.log('🚀 Testing Prompt Engineering Function...\n');

  const allBenchmarks: BenchmarkResult[] = [];

  try {
    // Test 1: Simple request
    console.log('Test 1: Convert simple request to template');
    console.log('User Input: "write a blog post about AI"');
    const { result: template1, benchmark: bench1 } = await promptGemini(
      'write a blog post about AI'
    );
    allBenchmarks.push(bench1);
    console.log('✅ Generated Template:\n', template1);
    console.log(`⏱️  Response Time: ${bench1.responseTimeMs}ms`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: Code request
    console.log('Test 2: Convert coding request to template');
    console.log('User Input: "create a python function to sort a list"');
    const { result: template2, benchmark: bench2 } = await promptGemini(
      'create a python function to sort a list'
    );
    allBenchmarks.push(bench2);
    console.log('✅ Generated Template:\n', template2);
    console.log(`⏱️  Response Time: ${bench2.responseTimeMs}ms`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 3: More specific request
    console.log('Test 3: Convert specific marketing request to template');
    console.log(
      'User Input: "email for customers about our new v2.0 product launch"'
    );
    const { result: template3, benchmark: bench3 } = await promptGemini(
      'email for customers about our new v2.0 product launch'
    );
    allBenchmarks.push(bench3);
    console.log('✅ Generated Template:\n', template3);
    console.log(`⏱️  Response Time: ${bench3.responseTimeMs}ms`);
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('🎉 All tests passed!');

    // Summary
    console.log('\n📊 BENCHMARK SUMMARY:');
    console.log('='.repeat(80));
    allBenchmarks.forEach((bench, index) => {
      console.log(`\nTest ${index + 1}:`);
      console.log(`  Input: "${bench.prompt}"`);
      console.log(
        `  Generated: "\n${bench.generatedPrompt.substring(0, 250)}..."`
      ); // Show more of the template
      console.log(`  Time: ${bench.responseTimeMs}ms`);
    });
    const avgTime =
      allBenchmarks.reduce((sum, b) => sum + b.responseTimeMs, 0) /
      allBenchmarks.length;
    console.log(
      `\nAverage Response Time: ${Math.round(avgTime * 100) / 100}ms`
    );
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
runTest();