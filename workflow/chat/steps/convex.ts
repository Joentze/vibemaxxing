import { ConvexHttpClient } from "convex/browser";
import type { UIMessage } from "ai";

type CreateProjectWithSandboxArgs = {
    title: string;
    description: string;
    sandboxExternalId: string;
    sandboxUrl: string;
    sandboxExpiryDate: number;
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
    try {
        const convex = new ConvexHttpClient(convexUrl) as unknown as UntypedConvexHttpClient;
        return await convex.mutation("projects:createProjectWithSandbox", args);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createChat(args: { name: string; sandboxId: string }) {
    "use step";

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }
    try {
        const convex = new ConvexHttpClient(convexUrl) as unknown as UntypedConvexHttpClient;
        return await convex.mutation("chats:create", args);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createChatMessage(args: { chatId: string; uiMessage: UIMessage }) {
    "use step";

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }
    try {
        const convex = new ConvexHttpClient(convexUrl) as unknown as UntypedConvexHttpClient;
        return await convex.mutation("messages:create", {
            attachments: [],
            chatId: args.chatId,
            metadata: args.uiMessage.metadata ?? null,
            parts: args.uiMessage.parts,
            role: args.uiMessage.role,
            uiMessageId: args.uiMessage.id,
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function updateSandboxStatus(args: { sandboxId: string; agentCoding: "started" | "coding" | "finished" }) {
    "use step";

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }
    try {
        const convex = new ConvexHttpClient(convexUrl) as unknown as UntypedConvexHttpClient;
        return await convex.mutation("sandboxes:update", { id: args.sandboxId, agentCoding: args.agentCoding });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export { createProjectWithSandbox, createChat, createChatMessage, updateSandboxStatus };
