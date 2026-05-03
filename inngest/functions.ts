// src/inngest/functions.ts
import { inngest } from "./client"
import {
  createAgent,
  grok,
  gemini,
  createNetwork,
  createTool,
  createState,
  type Tool,
  type Message,
} from "@inngest/agent-kit"
import { Sandbox } from "@e2b/code-interpreter"
import { PROMPT } from "@/lib/prompt"
import {
  getSandbox,
  lastAssistantTextMessageContent,
  parseAgentOutput,
  SANDBOX_TIMEOUT,
} from "./utils"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

interface AgentState {
  summary: string
  files: { [path: string]: string }
}

export const codeAgentFunction = inngest.createFunction(
  {
    name: "Code Agent Function",
    id: "code-agent",
    triggers: {
      event: "code-agent/run",
    },
  },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibely-nextjs-app")
      await sandbox.setTimeout(SANDBOX_TIMEOUT)
      return sandbox.sandboxId
    })

    const state = createState<AgentState>({
      summary: "",
      files: {},
    })

    const codeAgent = createAgent<AgentState>({
      name: "code-agent-main",
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run the commands",
          parameters: z.object({
            command: z.string().describe("The command to run in the terminal"),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" }

              try {
                const sandbox = await getSandbox(sandboxId)
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data
                  },
                })

                return result.stdout
              } catch (error) {
                console.error(
                  `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`
                )
                return `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`
              }
            })
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z
                  .string()
                  .describe("The path of the file to create or update"),
                content: z.string().describe("The content of the file"),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {}
                  const sandbox = await getSandbox(sandboxId)

                  for (const file of files) {
                    // Defensive validation: ensure file shape is correct
                    if (
                      !file ||
                      typeof file.path !== "string" ||
                      typeof file.content !== "string"
                    ) {
                      console.warn(
                        "Skipping malformed file entry from agent:",
                        file
                      )
                      continue
                    }

                    await sandbox.files.write(file.path, file.content)
                    updatedFiles[file.path] = file.content
                  }

                  return updatedFiles
                } catch (error) {
                  return "Error: " + error
                }
              }
            )

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z
              .array(z.string())
              .describe("The paths of the files to read")
              .describe("The paths of the files to read"),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId)
                const contents = []

                for (const file of files) {
                  const content = await sandbox.files.read(file)
                  contents.push({ path: file, content })
                }

                return JSON.stringify(contents)
              } catch (error) {
                return "Error: " + error
              }
            })
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result)

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText
            }
          }

          return result
        },
      },
    })

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary

        if (summary) return

        return codeAgent
      },
    })

    const result = await network.run(event.data.value)

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId)
      const host = sandbox.getHost(3000)
      return `https://${host}`
    })

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong, Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        })
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      })
    })
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    }
  }
)
