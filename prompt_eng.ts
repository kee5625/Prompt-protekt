// A simple, single-function example for a prompt engineering tool using the Gemini API.

/**
 * Refines a given prompt string using the Gemini API.
 *
 * @param {string} promptToEngineer The user's original prompt string to be refined.
 * @returns {Promise<string>} A promise that resolves to the new, AI-engineered prompt string.
 */
async function engineerPrompt(promptToEngineer: string): Promise<string> {
    // --- Configuration ---
    // !! IMPORTANT: Replace with your actual API key.
    // For production, this should be handled securely (e.g., environment variables)
    // and not hardcoded or shared.
    const apiKey = "AIzaSyC-MXCTadk3zm4sO2kgttQgrymiI4lfpzA"; // Per your request, set as a variable. Leave empty string.
    
    const model = 'gemini-2.5-flash-preview-09-2025';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // --- System Instruction ---
    // This is the core "meta-prompt." It tells the AI *how* to modify the user's prompt.
    // You can get very creative and specific here.
    const systemPrompt = `You are an expert prompt engineer. Your task is to take the user's input prompt and refine it to be clearer, more concise, and more effective for a large language model.
    
    Follow these rules:
    1.  Analyze the user's original intent.
    2.  Add specificity, context, and constraints where appropriate.
    3.  Define the desired format or persona for the output if implied.
    4.  Ensure the prompt is unambiguous.
    5.  Return *only* the new, refined prompt string and nothing else. Do not add any conversational text like "Here is the refined prompt:".`;

    // --- API Payload ---
    const payload = {
        contents: [{
            parts: [{ text: promptToEngineer }] // The user's prompt
        }],
        systemInstruction: {
            parts: [{ text: systemPrompt }] // The "meta-prompt"
        },
        // Optional: Add generationConfig settings if needed, e.g., temperature
        // generationConfig: {
        //   temperature: 0.7,
        // }
    };

    // --- Define an interface for the expected API response ---
    interface GeminiApiResponse {
        candidates?: Array<{
            content?: {
                parts?: Array<{
                    text?: string;
                }>;
            };
        }>;
    }

    // --- API Call & Error Handling ---
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        // Explicitly type the result from response.json() using our interface
        const result: GeminiApiResponse = await response.json();

        // --- Response Parsing ---
        const engineeredPrompt = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (engineeredPrompt) {
            // Clean up any potential markdown or extra quotes
            return engineeredPrompt.trim().replace(/^"(.*)"$/, '$1');
        } else {
            console.error('Invalid response structure from API:', JSON.stringify(result, null, 2));
            throw new Error('Could not parse the engineered prompt from the API response.');
        }

    } catch (error) {
        let errorMessage = "An unknown error occurred";
        // Check if the error is an actual Error object
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error('Error during prompt engineering:', error);
        // Fallback: return original prompt or throw error
        throw new Error(`Failed to engineer prompt: ${errorMessage}`);
    }
}

// --- Example Usage (uncomment to run in a Node.js environment) ---

(async () => {
    const originalPrompt = "tell me about dogs";
    
    try {
        console.log(`Original prompt: "${originalPrompt}"`);
        const newPrompt = await engineerPrompt(originalPrompt);
        console.log('---');
        console.log(`Engineered prompt: "${newPrompt}"`);

        // Example 2
        const originalPrompt2 = "how to write js function";
        console.log(`\nOriginal prompt: "${originalPrompt2}"`);
        const newPrompt2 = await engineerPrompt(originalPrompt2);
        console.log('---');
        console.log(`Engineered prompt: "${newPrompt2}"`);

    } catch (error) {
        console.error('Failed to run example:');
    }
})();
