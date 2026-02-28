import { getWritable } from "workflow";
import type { UIMessage, UIMessageChunk } from "ai";
import { createSandbox, terminateSandbox } from "./steps/sandbox";
import {
  createChat,
  createChatMessage,
  createProjectWithSandbox,
  updateSandboxStatus,
} from "./steps/convex";
import { createAgent } from "../agent/coding-agent";
import { createProjectImage } from "./steps/generate-image";

function getLatestMessageByRole(
  messages: UIMessage[],
  role: UIMessage["role"],
): UIMessage | undefined {
  return [...messages].reverse().find((message) => message.role === role);
}


export async function buildAppWorkflow({ title, description }: { title: string, description: string }) {
  "use workflow";
  globalThis.fetch = fetch;
  const writable = getWritable<UIMessageChunk>();
  // start the sandbox environment
  const { sandboxId, url, expiryDate } = await createSandbox();
  // create project and sandbox rows in Convex
  const { sandboxId: sandboxDocId, projectId } = await createProjectWithSandbox({
    title,
    description,
    sandboxExternalId: sandboxId,
    sandboxUrl: url,
    sandboxExpiryDate: expiryDate,
  }) as { sandboxId: string; projectId: string };

  const image = await createProjectImage({ title, description });
  console.log(image);
  // run the agent
  await updateSandboxStatus({ sandboxId: sandboxDocId, agentCoding: "coding" });

  const agent = createAgent(sandboxId);


  const prompt = `
  Create an app with the following title and description:
  ${title}
  ${description}
  `
  console.log(prompt);

  const chatId = await createChat({
    name: title,
    sandboxId: sandboxDocId,
  }) as string;
  const initialUiMessages: UIMessage[] = [
    {
      id: `user-${projectId}-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", text: prompt }],
    },
  ];
  const latestUserMessage = getLatestMessageByRole(initialUiMessages, "user");
  if (latestUserMessage) {
    await createChatMessage({ chatId, uiMessage: latestUserMessage });
  }

  const { messages, uiMessages } = await agent.stream({
    collectUIMessages: true,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      }
    ],
    writable,
    onStepFinish: ({ toolCalls }) => {
      console.log(toolCalls);
    },
  })
  const assistantMessage = getLatestMessageByRole(
    uiMessages ?? [],
    "assistant",
  );
  if (assistantMessage) {
    await createChatMessage({ chatId, uiMessage: assistantMessage });
  }
  await updateSandboxStatus({ sandboxId: sandboxDocId, agentCoding: "finished" });
  console.log(JSON.stringify(messages, null, 2));

  // update the statuses accordingly
  // await terminateSandbox(sandboxId);
}

