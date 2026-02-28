# vibemaxxing

A platform that lets you vibecode multiple apps at once. Describe what you want, and autonomous coding agents build it for you in parallel — each app running in its own sandboxed environment.

## How It Works

1. **Create a project** — give it a title and description.
2. **Agents take over** — a durable coding agent picks up your project, spins up a sandboxed Vite + React environment, and starts building.
3. **Watch it happen** — see live previews of your apps as agents write code in real time.
4. **Scale horizontally** — run as many projects as you want simultaneously.

## Architecture

- **[Modal](https://modal.com) Sandboxes** — each app gets its own isolated sandbox with a full Bun + Vite dev server. Agents create files, install dependencies, and run commands inside these sandboxes.
- **[Vercel Workflow](https://vercel.com/docs/workflow) for Durable Agents** — agent execution is powered by Vercel's workflow SDK, giving us durable, resumable, long-running AI agent loops that survive failures and timeouts.
- **[Convex](https://convex.dev)** — real-time backend for project state, message history, and live updates to the frontend.

### The Coding Agent

The core of the system lives in `workflow/agent/coding-agent.ts`:

```typescript
function createAgent(sandboxId: string) {
    return new DurableAgent({
        model: openai("gpt-5.3-codex"),
        system: buildSystemPrompt(sandboxId),
        temperature: 0.5,
        tools: sandboxTools({ sandboxId }),
    });
}
```

Each agent is scoped to a single sandbox and equipped with tools to `runCommand`, `createFile`, and `updateFile` inside its environment. The system prompt enforces frontend-only development within a Vite React project using shadcn/ui components.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- An OpenAI API key

### Setup

1. Clone the repo:

```bash
git clone https://github.com/your-org/vibemaxxing.git
cd vibemaxxing
```

2. Create a `.env.local` file with your API key:

```
OPENAI_API_KEY=sk-...
```

3. Install dependencies and start the dev server:

```bash
bun install
bun dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Runtime | Bun |
| Backend | Convex |
| Agent Execution | Vercel Workflow |
| Sandboxing | Modal |
| AI Model | OpenAI |
| Font | Geist (via `next/font`) |
