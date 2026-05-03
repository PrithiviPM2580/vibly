"use client"

import { z } from "zod"
import { toast } from "sonner"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldError,
  FieldContent,
} from "@/components/ui/field"

interface Props {
  projectId: string
}

const formSchema = z.object({
  value: z.string().min(1, { message: "Value is required" }),
})

export default function MessageForm({ projectId }: Props) {
  const [isFocused, setIsFocused] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      value: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await createMessage.mutateAsync({
        value: value.value,
        projectId,
      })
    },
  })

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset()
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        )
        // TODO: Invalidate usage status
      },
      onError: (error) => {
        // TODO: Redirect to pricing page if specific error
        toast.error(error.message)
      },
    })
  )

  const isPending = createMessage.isPending
  const isButtonDisabled =
    isPending ||
    !((form as any).getFieldState?.("value")?.meta?.isValid ?? true)
  const showUsage = false

  return (
    <form
      id="bug-report-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className={cn(
        "relative rounded-xl border bg-sidebar p-4 pt-1 transition-all dark:bg-sidebar",
        isFocused && "shadow-xs",
        showUsage && "rounded-t-none"
      )}
    >
      <FieldGroup>
        <form.Field
          name="value"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <TextareaAutosize
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isPending}
                  onFocus={(e) => {
                    setIsFocused(true)
                  }}
                  onBlur={(e) => {
                    setIsFocused(false)
                    field.handleBlur()
                  }}
                  minRows={2}
                  maxRows={8}
                  className="w-full resize-none border-none bg-transparent pt-4 outline-none"
                  placeholder="What would you like to build?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      form.handleSubmit()
                    }
                  }}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <FieldContent>
          <div className="flex items-end justify-between gap-x-2 pt-2">
            <div className="font-mono text-[10px] text-muted-foreground">
              <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp;to submit
            </div>
            <Button
              disabled={isButtonDisabled}
              className={cn(
                "size-8 rounded-full",
                isButtonDisabled && "border bg-muted-foreground"
              )}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon />
              )}
            </Button>
          </div>
        </FieldContent>
      </FieldGroup>
    </form>
  )
}
