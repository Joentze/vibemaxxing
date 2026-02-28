import { NextResponse } from "next/server";
import z from "zod";
import { terminateSandbox } from "@/lib/modal/sandbox";

export const runtime = "nodejs";

const terminateSchema = z.object({
  sandboxId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = terminateSchema.parse(await req.json());
    const result = await terminateSandbox(body.sandboxId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
