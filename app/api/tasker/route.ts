import { openai } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import z from "zod";


export const maxDuration = 30;

export async function POST(req: Request) {
    const { prompt } = (await req.json()) as { prompt?: string };

    if (!prompt || !prompt.trim()) {
        return new Response("Missing prompt", { status: 400 });
    }

    const result = streamText({
        model: openai("gpt-5.2"),
        output: Output.array({
            element: z.object({
                title: z.string().describe("A short, memorable app name."),
                description: z
                    .string()
                    .describe("One sentence describing what the app does."),
            }),
        }),
        prompt: `Given this idea context: "${prompt}", generate a broad list of realistic app ideas a developer could build.

Return only practical ideas that can be implemented by a small team or solo builder. Vary industries and use cases.
Keep each idea concise and distinct.`,
    });

    return result.toTextStreamResponse();
}