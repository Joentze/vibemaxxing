import { openai } from "@ai-sdk/openai";
import { generateText, Output, streamText, tool } from "ai";
import z from "zod";

const apiBaseUrl =
    process.env.INTERNAL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

type SandboxExecResponse = {
    stdout: string;
    stderr: string;
    exitCode: number;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sandbox API ${path} failed (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`;
}

function truncate(value: unknown, maxLen = 200): string {
    const s = JSON.stringify(value);
    return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

async function runCommand({
    sandboxId,
    command,
    args,
    workdir,
    timeoutMs,
}: {
    sandboxId: string;
    command: string;
    args?: string[];
    workdir?: string;
    timeoutMs?: number;
}) {
    "use step";
    console.log(`[tool:runCommand] args=${truncate({ sandboxId, command, args, workdir })}`);
    const result = await postJson<SandboxExecResponse>("/api/sandbox/exec", {
        sandboxId,
        command: [command, ...(args ?? [])],
        workdir,
        timeoutMs,
    });
    console.log(`[tool:runCommand] result=${truncate(result)}`);
    return result;
}

async function createFile({
    sandboxId,
    path,
    prompt,
    messages,
    timeoutMs,
}: {
    sandboxId: string;
    path: string;
    prompt: string;
    workdir?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: Record<string, any>;
    timeoutMs?: number;
}) {
    "use step";

    const { output: { content } } = await generateText({
        model: openai("gpt-5.3-codex"),
        prompt: `
        create file at path 
        file path:
        ${path}

        based on the following messages, create a file for the given prompt:
        ${JSON.stringify(messages)}
        prompt:
        ${prompt}
        `,
        output: Output.object({
            schema: z.object({
                content: z.string().describe("The code created for the given prompt"),
            }),
        })
    })
    console.log(`[tool:createFile] args=${truncate({ sandboxId, path, content: content.slice(0, 80) })}`);
    const quotedPath = shellQuote(path);
    const delimiter = `__SANDBOX_FILE_${Math.random().toString(36).slice(2)}__`;
    const script = `mkdir -p "$(dirname -- ${quotedPath})" && cat <<'${delimiter}' > ${quotedPath}
${content}
${delimiter}`;

    const result = await postJson<SandboxExecResponse>("/api/sandbox/exec", {
        sandboxId,
        command: ["bash", "-lc", script],
        timeoutMs,
    });

    const out = { path, ...result };
    console.log(`[tool:createFile] result=${truncate(out)}`);
    return out;
}

async function updateFile({
    sandboxId,
    path,
    prompt,
    messages,
    createIfMissing,
    timeoutMs,
}: {
    sandboxId: string;
    path: string;
    prompt: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: Record<string, any>;
    createIfMissing?: boolean;
    workdir?: string;
    timeoutMs?: number;
}) {
    "use step";

    const readResult = await postJson<SandboxExecResponse>("/api/sandbox/exec", {
        sandboxId,
        command: ["cat", path],
        timeoutMs,
    });
    const currentContent = readResult.exitCode === 0 ? readResult.stdout : "";

    const { output: { content } } = await generateText({
        model: openai("gpt-5.3-codex"),
        prompt: `
        Update the file at path: ${path}

        Here is the current content of the file:
        \`\`\`
        ${currentContent}
        \`\`\`

        Conversation context:
        ${JSON.stringify(messages)}

        Requested change:
        ${prompt}

        IMPORTANT: Only add the requested features. Do NOT remove, rename, refactor, or otherwise modify any existing code. Return the full updated file content with only the new additions integrated.
        `,
        output: Output.object({
            schema: z.object({
                content: z.string().describe("The full file content with only the requested features added, preserving all existing code as-is"),
            }),
        })
    })
    console.log(`[tool:updateFile] args=${truncate({ sandboxId, path, content: content.slice(0, 80), createIfMissing })}`);
    const quotedPath = shellQuote(path);
    const delimiter = `__SANDBOX_FILE_${Math.random().toString(36).slice(2)}__`;
    const missingGuard = createIfMissing
        ? ""
        : `if [ ! -f ${quotedPath} ]; then echo "File not found: ${path}" >&2; exit 1; fi && `;
    const script = `${missingGuard}cat <<'${delimiter}' > ${quotedPath}
${content}
${delimiter}`;

    const result = await postJson<SandboxExecResponse>("/api/sandbox/exec", {
        sandboxId,
        command: ["bash", "-lc", script],
        timeoutMs,
    });

    const out = { path, ...result };
    console.log(`[tool:updateFile] result=${truncate(out)}`);
    return out;
}

// async function grep({
//     sandboxId,
//     pattern,
//     path,
//     flags,
//     workdir,
//     timeoutMs,
// }: {
//     sandboxId: string;
//     pattern: string;
//     path?: string;
//     flags?: string[];
//     workdir?: string;
//     timeoutMs?: number;
// }) {
//     "use step";
//     console.log(`[tool:grep] args=${truncate({ sandboxId, pattern, path, flags, workdir })}`);
//     const result = await postJson<SandboxExecResponse>("/api/sandbox/exec", {
//         sandboxId,
//         command: [
//             "grep",
//             ...(flags ?? ["-R", "-n"]),
//             "--exclude-dir=node_modules",
//             "--exclude-dir=database",
//             "--exclude=*.lock",
//             "--exclude=bun.lockb",
//             pattern,
//             path ?? ".",
//         ],
//         workdir,
//         timeoutMs,
//     });
//     console.log(`[tool:grep] result=${truncate(result)}`);
//     return truncate(result, 1000);
// }

const sandboxTools = ({ sandboxId }: { sandboxId: string }) => {
    return {
        runCommand: tool({
            description: "Run a command inside a sandbox",
            inputSchema: z.object({
                command: z.string().min(1),
                args: z.array(z.string()).optional(),
                timeoutMs: z.number().int().positive().optional(),
            }),
            execute: (args, { messages }) => runCommand({ ...args, sandboxId }),
        }),
        createFile: tool({
            description: "Create or overwrite a file in a sandbox",
            inputSchema: z.object({
                path: z.string().describe("The path to create the file at"),
                prompt: z.string().describe("The prompt to create the file with"),
                timeoutMs: z.number().int().positive().optional(),
            }),
            execute: (args, { messages }) => createFile({ ...args, sandboxId, messages }),
        }),
        updateFile: tool({
            description: "Update an existing file in a sandbox",
            inputSchema: z.object({
                path: z.string().min(1),
                prompt: z.string().describe("The prompt to update the file with"),
                createIfMissing: z.boolean().optional(),
                timeoutMs: z.number().int().positive().optional(),
            }),
            execute: (args, { messages }) => updateFile({ ...args, sandboxId, messages }),
        }),
        // grep: tool({
        //     description: "Search files using grep inside a sandbox",
        //     inputSchema: z.object({
        //         sandboxId: z.string().min(1),
        //         pattern: z.string().min(1),
        //         path: z.string().optional(),
        //         flags: z.array(z.string()).optional(),
        //         workdir: z.string().optional(),
        //         timeoutMs: z.number().int().positive().optional(),
        //     }),
        //     execute: grep,
        // }),
    };
};
export { sandboxTools };
