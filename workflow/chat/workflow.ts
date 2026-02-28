import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { openai } from "@workflow/ai/openai";
import type { ModelMessage, UIMessageChunk } from "ai";


export async function chatWorkflow(messages: ModelMessage[]) {
  "use workflow";
  const writable = getWritable<UIMessageChunk>();
  const agent = new DurableAgent({
    model: openai("gpt-5.1"),
    system: "You are a helpful assistant.",
  });
  await agent.stream({
    messages,
    writable,
  });

}