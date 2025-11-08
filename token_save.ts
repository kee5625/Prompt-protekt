import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * REST API endpoint handler for Groq model inference
 * @param req - Request object containing the prompt and optional parameters
 * @param res - Response object
 */
export async function handleGroqRequest(req: any, res: any) {
    try {
        const {
            prompt,
            model = "llama-3.1-70b-versatile",
            temperature = 0.7,
            max_tokens = 1024
        } = req.body;

        // Validate prompt
        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required"
            });
        }

        // Call Groq API
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: model,
            temperature: temperature,
            max_tokens: max_tokens,
        });

        // Extract response
        const response = chatCompletion.choices[0]?.message?.content || "";

        // Return successful response
        return res.status(200).json({
            success: true,
            data: {
                response: response,
                model: model,
                usage: chatCompletion.usage,
            },
        });

    } catch (error: any) {
        console.error("Error calling Groq API:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
}

/**
 * Alternative function for Express-style REST API
 */
export async function groqChatEndpoint(req: any, res: any) {
    const { messages, model = "llama-3.1-70b-versatile", temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
            error: "Messages array is required"
        });
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: temperature,
        });

        res.status(200).json({
            success: true,
            completion: completion,
        });
    } catch (error: any) {
        console.error("Groq API Error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Streaming response endpoint
 */
export async function groqStreamEndpoint(req: any, res: any) {
    const { prompt, model = "llama-3.1-70b-versatile" } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        // Set headers for streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const stream = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error: any) {
        console.error("Streaming error:", error);
        res.status(500).json({ error: error.message });
    }
}
