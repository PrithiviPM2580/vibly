import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { baseProcedure, createTRPCRouter } from "@/trpc/init"
import { inngest } from "@/inngest/client"

export const messagesRouter = createTRPCRouter({
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      })

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value,
        },
      })

      return createdMessage
    }),
})
