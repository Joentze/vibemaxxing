import { NextResponse } from "next/server";
import z from "zod";
import { createSandbox } from "@/lib/modal/sandbox";

export const runtime = "nodejs";

const createSandboxSchema = z.object({
  appName: z.string().optional(),
  image: z.string().optional(),
  workdir: z.string().optional(),
  command: z.array(z.string()).optional(),
  encryptedPorts: z.array(z.number().int().positive()).optional(),
  timeoutMs: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const body = createSandboxSchema.parse(await req.json().catch(() => ({})));
    const result = await createSandbox(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
