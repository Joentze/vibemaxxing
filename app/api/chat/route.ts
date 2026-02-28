import { createUIMessageStreamResponse, type UIMessage } from 'ai';
import { start } from 'workflow/api';
import { remixAppWorkflow } from '@/workflow/remix/workflow';

export async function POST(req: Request) {
    const body = await req.json();
    const { messages, sandboxId } = body as {
        messages: UIMessage[];
        sandboxId?: string;
    };

    if (!sandboxId) {
        return new Response('Missing sandboxId', { status: 400 });
    }

    const run = await start(remixAppWorkflow, [{ sandboxId, messages }]);

    return createUIMessageStreamResponse({
        stream: run.readable,
        headers: {
            'x-workflow-run-id': run.runId,
        },
    });
}