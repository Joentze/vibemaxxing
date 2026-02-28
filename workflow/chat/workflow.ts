import { getWritable } from "workflow";
import type { UIMessageChunk } from "ai";
import { createSandbox, terminateSandbox } from "./steps/sandbox";
import { createProjectWithSandbox } from "./steps/convex";


export async function buildAppWorkflow({ title, description }: { title: string, description: string }) {
  "use workflow";
  globalThis.fetch = fetch;
  getWritable<UIMessageChunk>();
  // start the sandbox environment
  const { sandboxId, url } = await createSandbox();
  // create project and sandbox rows in Convex
  await createProjectWithSandbox({
    title,
    description,
    sandboxExternalId: sandboxId,
    sandboxUrl: url,
  });
  // run the agent

  // update the statuses accordingly
  await terminateSandbox(sandboxId);
}