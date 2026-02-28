import { modal } from "@/lib/modal/client";

type CreateSandboxParams = {
  appName?: string;
  image?: string;
  workdir?: string;
  command?: string[];
  encryptedPorts?: number[];
  timeoutMs?: number;
};

type ExecSandboxParams = {
  sandboxId: string;
  command: string[];
  workdir?: string;
  timeoutMs?: number;
};

const DEFAULT_APP_NAME = "base-nitro-bun-codex-cli-app";
const DEFAULT_IMAGE = "joentze/nitro-bun-codex-cli-app-template:latest";

export async function createSandbox(params: CreateSandboxParams = {}) {
  const app = await modal.apps.fromName(params.appName ?? DEFAULT_APP_NAME, {
    createIfMissing: true,
  });
  const image = modal.images.fromRegistry(params.image ?? DEFAULT_IMAGE);

  const sandbox = await modal.sandboxes.create(app, image, {
    workdir: params.workdir ?? "/app",
    encryptedPorts: params.encryptedPorts ?? [3000],
    command: params.command ?? ["bun", "dev", "--", "--host", "0.0.0.0"],
    timeoutMs: params.timeoutMs,
    cpu: 1,
    cpuLimit: 2,
    memoryMiB: 1024,
    memoryLimitMiB: 4096,
    blockNetwork: false,
  });
  let url: string | undefined;
  try {
    const tunnels = await sandbox.tunnels();
    url = tunnels["3000"].url;
  } catch {
    // Tunnels may not be ready immediately; caller can request later.
  } finally {
    sandbox.detach();
  }
  return {
    sandboxId: sandbox.sandboxId,
    url,
  };

}

export async function execSandboxCommand(params: ExecSandboxParams) {
  const sandbox = await modal.sandboxes.fromId(params.sandboxId);
  const process = await sandbox.exec(params.command, {
    workdir: params.workdir,
    timeoutMs: params.timeoutMs,
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    process.stdout.readText(),
    process.stderr.readText(),
    process.wait(),
  ]);

  sandbox.detach();

  return { stdout, stderr, exitCode };
}

export async function terminateSandbox(sandboxId: string) {
  const sandbox = await modal.sandboxes.fromId(sandboxId);
  await sandbox.terminate();
  return { sandboxId };
}
