/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import Groq from "groq-sdk";
import { z } from "zod";

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

const ResourceSaverSchema = z.object({
  use_resource_saver: z.boolean().describe("Whether to use the resource-save model (smaller, faster) or the full model"),
  answer: z.string().describe("The answer to the query. Filled if resource_saver is true, empty if false"),
  reasoning: z.string().describe("Explanation for why the resource-saver model was chosen or not chosen"),
});

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders();

    // Block if origin is not allowed
    if (!corsHeaders) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    const data = await request.json();

    const models = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"];
    let rval = Math.random() < 0.5 ? 0 : 1;

    let prompt = data.prompt;

    console.log("GROQ_API_KEY:", env.GROQ_API_KEY);

    const groq = new Groq({
      apiKey: env.GROQ_API_KEY,
    });

    const response = await groq.chat.completions.create({
      model: models[rval],
      messages: [
        {
          role: "system",
          content: `You are a resource optimization AI. Analyze the user's query and determine if it requires a larger, more capable model or if a smaller, faster resource-saver model can handle it adequately.
                
                Use the resource-saver model (use_resource_saver: true) for:
                - Simple questions with straightforward answers
                - Basic factual queries
                - Simple calculations or definitions
                - General knowledge questions
                
                Use the full model (use_resource_saver: false) for:
                - Complex reasoning or analysis
                - Creative tasks like writing stories or poems
                - Multi-step problem solving
                - Nuanced or ambiguous questions
                
                Provide your decision as JSON using the ResourceSaverSchema with reasoning for your choice.`,
        },
        {
          role: "user",
          content: prompt
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "outcome",
          schema: z.toJSONSchema(ResourceSaverSchema)
        }
      }
    });

    // console.log("Response:", response.choices[0].message.content);
    // You can view your logs in the Observability dashboard
    // console.info({ message: 'Hello World Worker received a request!' });
    return new Response(response.choices[0].message.content, {
      status: 200,
      headers: {
        ...corsHeaders,
      }
    });
  }
};