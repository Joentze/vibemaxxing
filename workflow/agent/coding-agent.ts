

import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";

const codingSystemPrompt = `

`;

const agent = new DurableAgent({
    model: openai("gpt-5.3-codex"),
    system: codingSystemPrompt,
    temperature: 0.5,
    tools: {

    },
})

export { agent };