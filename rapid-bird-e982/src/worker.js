/**
 * Simple prompt engineering function using Gemini AI
 * Takes a user prompt and converts it into an optimized template for LLMs
 */

import { GoogleGenAI } from "@google/genai";

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://chatgpt.com',
  'https://chat.openai.com'
];

function getCorsHeaders(origin) {
  // Check if the origin is allowed
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  return null;
}


export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);

    // Block if origin is not allowed
    if (!corsHeaders) {
      return new Response('Forbidden', { status: 403 });
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    const data = await request.json();

    let userPrompt = data.prompt || "return an empty string";
    const metaPrompt = `Analyze the user's request and enhance it using the 5C Prompt Contract framework. Infer intent and fill each component completely.

**User's Request:** "${userPrompt}"

---
**[5C PROMPT CONTRACT]**

**Character:** [Infer the ideal persona/role for the AI, e.g., "Expert Python developer", "Professional copywriter", "Patient tutor"]

**Cause:** [Infer the primary objective and motivation, e.g., "To create persuasive marketing content", "To debug complex code", "To simplify technical concepts for beginners"]

**Constraint:** [Infer output requirements including:
- Tone: [e.g., Formal, Casual, Technical, Friendly]
- Length: [e.g., "Brief paragraph", "5 bullet points", "Complete code with comments"]
- Format: [e.g., Markdown, JSON, Python script, Email]
- Must Include: [Key topics, keywords, or data points from user's prompt]
- Must Exclude: [Any implied exclusions, or "None"]]

**Contingency:** [Define fallback behavior, e.g., "If topic is unclear, ask clarifying question", "If data is missing, use reasonable defaults", "If multiple interpretations exist, provide the most common one"]

**Calibration:** [Specify output tuning:
- Complexity Level: [e.g., Beginner, Intermediate, Expert]
- Style: [e.g., Direct, Explanatory, Step-by-step]
- Additional Context: [Any audience or background details inferred from the request]]

---

Return ONLY the filled 5C contract. Do not add preamble or explanations.`;

    const apiKey = env.GEMINI_API_KEY;
    // const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: metaPrompt,
    });

    console.log(response);

    // Extract the text from the response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text generated in response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      result: text.trim(),
      benchmark: {
        prompt: userPrompt,
        generatedPrompt: text.trim(),
        timestamp: new Date().toISOString(),
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  }
}