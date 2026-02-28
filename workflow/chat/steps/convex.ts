import { ConvexHttpClient } from "convex/browser";

type CreateProjectWithSandboxArgs = {
  title: string;
  description: string;
  sandboxExternalId: string;
  sandboxUrl: string;
};

type UntypedConvexHttpClient = {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

async function createProjectWithSandbox(args: CreateProjectWithSandboxArgs) {
  "use step";

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  const convex = new ConvexHttpClient(convexUrl) as unknown as UntypedConvexHttpClient;
  return await convex.mutation("projects:createWithSandbox", args);
}

export { createProjectWithSandbox };
