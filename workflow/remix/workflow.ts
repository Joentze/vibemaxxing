import { getWritable } from "workflow";
import { convertToModelMessages, type UIMessage, type UIMessageChunk } from "ai";
import { createAgent } from "../agent/coding-agent";
import { createChat, createChatMessage } from "../chat/steps/convex";

function getLatestMessageByRole(
    messages: UIMessage[],
    role: UIMessage["role"],
): UIMessage | undefined {
    return [...messages].reverse().find((message) => message.role === role);
}


export async function remixAppWorkflow({ sandboxId, messages }: { sandboxId: string, messages: UIMessage[] }) {
    "use workflow";
    const writable = getWritable<UIMessageChunk>();
    globalThis.fetch = fetch;
    const chatId = await createChat({
        name: `Remix ${sandboxId}`,
        sandboxId,
    }) as string;
    const latestUserMessage = getLatestMessageByRole(messages, "user");
    if (latestUserMessage) {
        await createChatMessage({ chatId, uiMessage: latestUserMessage });
    }
    const modelMessages = await convertToModelMessages(messages);
    const agent = createAgent(sandboxId);
    const { uiMessages } = await agent.stream({
        messages: modelMessages,
        writable,
        collectUIMessages: true
    });
    const assistantMessage = getLatestMessageByRole(uiMessages ?? [], "assistant");
    if (assistantMessage) {
        await createChatMessage({ chatId, uiMessage: assistantMessage });
    }
}

