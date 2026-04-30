import { caller } from "@/trpc/server"

export default async function Page() {
  const data = await caller.createAI({ text: "Hello world" })
  return <div>{data.greeting}</div>
}
