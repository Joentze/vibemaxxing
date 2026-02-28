import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";
import { createSandbox, terminateSandbox } from "./steps/sandbox";
import { createProjectWithSandbox, updateSandboxStatus } from "./steps/convex";
import { createAgent } from "../agent/coding-agent";
import { createProjectImage } from "./steps/generate-image";


export async function buildAppWorkflow({ title, description }: { title: string, description: string }) {
  "use workflow";
  globalThis.fetch = fetch;
  const writable = getWritable<UIMessageChunk>();
  // start the sandbox environment
  const { sandboxId, url, expiryDate } = await createSandbox();
  // create project and sandbox rows in Convex
  const { sandboxId: sandboxDocId } = await createProjectWithSandbox({
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
    onFinish: async () => {
      await updateSandboxStatus({ sandboxId: sandboxDocId, agentCoding: "finished" });
    }
  })
  console.log(JSON.stringify(messages, null, 2));

  // update the statuses accordingly
  // await terminateSandbox(sandboxId);
}

