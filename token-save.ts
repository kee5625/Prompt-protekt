import Groq from "groq-sdk";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const ResourceSaverSchema = z.object({
    use_resource_saver: z.boolean().describe("Whether to use the resource-save model (smaller, faster) or the full model"),
    answer: z.string().describe("The answer to the query. Empty if resource_saver is true, filled if false"),
    reasoning: z.string().describe("Explanation for why the resource-saver model was chosen or not chosen"),
});

export async function callGroqModel(prompt: string) {
    const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
                content: `What is the capital of France?`
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

    const rawResult = JSON.parse(response.choices[0].message.content || "{}");
    const result = ResourceSaverSchema.parse(rawResult);
    console.log(result);

    // const chatCompletion = await groq.chat.completions.create({
    //     messages: [
    //         {
    //             role: "user",
    //             content: prompt,
    //         },
    //     ],
    //     model: "llama-3.1-8b-instant",
    // });

    // return chatCompletion.choices[0]?.message?.content || "";
}


const response = await callGroqModel("Explain quantum computing");
// console.log(response);