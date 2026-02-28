import { openai } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import z from "zod";
import { buildAppWorkflow } from "@/workflow/chat/workflow";
import { start } from "workflow/api";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { prompt } = (await req.json()) as { prompt?: string };

    if (!prompt || !prompt.trim()) {
        return new Response("Missing prompt", { status: 400 });
    }

    const { elementStream } = streamText({
        model: openai("gpt-5.3-codex"),
        output: Output.array({
            element: z.object({
                title: z.string().describe("A short, memorable app name."),
                description: z
                    .string()
                    .describe("One sentence describing what the app does. 10-15 words."),
            }),
        }),
        prompt: `given this prompt: "${prompt}" extract out the apps that can be built`,
    });

    for await (const element of elementStream) {
        console.log(element);
        await start(buildAppWorkflow, [element]);
    }

    return new Response(JSON.stringify(elementStream), { status: 200 });
}