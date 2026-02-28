import { NextResponse } from "next/server";
import z from "zod";
import { execSandboxCommand } from "@/lib/modal/sandbox";

export const runtime = "nodejs";

const execSchema = z.object({
  sandboxId: z.string().min(1),
  command: z.array(z.string()).min(1),
  workdir: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    console.log("exec route");
    const body = execSchema.parse(await req.json());
    console.log(body);
    const result = await execSandboxCommand(body);
    console.log(result);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
