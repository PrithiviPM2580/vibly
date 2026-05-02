// src/inngest/functions.ts
import { inngest } from "./client"
import { createAgent, grok, gemini } from "@inngest/agent-kit"
import { Sandbox } from "@e2b/code-interpreter"

export const processTask = inngest.createFunction(
  { id: "process-task", triggers: { event: "app/task.created" } },
  async ({ event, step }) => {
    const summarizer = createAgent({
      name: "summarizer",
      system:
        "You are a helpful assistant that summarizes text. You summarize in 2 words.",
      model: gemini({ model: "gemini-2.5-flash" }),
    })

    return { message: `Hello ${event.data.value}` }
  }
)
