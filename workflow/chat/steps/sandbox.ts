const apiBaseUrl =
    process.env.INTERNAL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

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

async function createSandbox(): Promise<{ sandboxId: string; url: string; expiryDate: number }> {
  "use step";
  const result = await postJson<{ sandboxId: string; url?: string; expiryDate: number }>(
    "/api/sandbox/create",
    {},
  );
  return {
    sandboxId: result.sandboxId,
    url: result.url ?? "",
    expiryDate: result.expiryDate,
  };
}

async function terminateSandbox(sandboxId: string): Promise<void> {
    "use step";
    await postJson("/api/sandbox/terminate", { sandboxId });
}

export { createSandbox, terminateSandbox };