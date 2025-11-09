/**
 * Simple prompt engineering function using Gemini AI
 * Takes a user prompt and converts it into an optimized template for LLMs
 */

import { GoogleGenAI } from "@google/genai";

export default {
  async fetch(request, env, ctx) {
    // const data = request.json();
    let userPrompt = "write a blog post about AI";
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}