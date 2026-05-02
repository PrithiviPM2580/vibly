"use client"

import { useTRPC } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export default function Page() {
  const [value, setValue] = useState("")

  const trpc = useTRPC()
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success("Message created successfully")
      },
    })
  )

  return (
    <div className="mx-auto max-w-7xl p-4">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        disabled={createMessage.isPending}
        onClick={() => createMessage.mutate({ value })}
        className="mt-4"
      >
        Create Message
      </Button>
    </div>
  )
}
