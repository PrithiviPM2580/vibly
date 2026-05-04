"use client"

import { z } from "zod"
import { toast } from "sonner"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import {} from "@/components/ui/field"

import { PROJECT_TEMPLATES } from "@/constants"

const formSchema = z.object({
  value: z.string().min(1, { message: "Value is required" }),
})

export default function ProjectForm() {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions())
        router.push(`/projects/${data.id}`)
        // TODO: Invalidate usage status
      },
      onError: (error) => {
        // TODO: Redirect to pricing page if specific error
        toast.error(error.message)
      },
    })
  )

  const form = useForm({
    defaultValues: {
      value: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await createProject.mutateAsync({
        value: value.value,
      })
    },
  })

  const onSelect = (value: string) => {
    form.setFieldValue("value", value)
  }

  const [isFocused, setIsFocused] = useState(false)
  const isPending = createProject.isPending
  const isButtonDisabled = isPending || !form.state.canSubmit

  return (
    <section className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className={cn(
          "relative rounded-xl border bg-sidebar p-4 pt-1 transition-all dark:bg-sidebar",
          isFocused && "shadow-xs"
        )}
      >
        <form.Field
          name="value"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <TextareaAutosize
                value={field.state.value}
                disabled={isPending}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false)
                  field.handleBlur()
                }}
                onChange={(e) => field.handleChange(e.target.value)}
                minRows={2}
                maxRows={8}
                className="w-full resize-none border-none bg-transparent pt-4 outline-none"
                placeholder="What would you like to build?"
                aria-invalid={isInvalid}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    form.handleSubmit()
                  }
                }}
              />
            )
          }}
        />

        <div className="flex items-end justify-between gap-x-2 pt-2">
          <div className="font-mono text-[10px] text-muted-foreground">
            <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp;to submit
          </div>

          <Button
            type="submit"
            disabled={createProject.isPending || !form.state.canSubmit}
            className={cn(
              "size-8 rounded-full",
              (createProject.isPending || !form.state.canSubmit) &&
                "border bg-muted-foreground"
            )}
          >
            {createProject.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ArrowUpIcon />
            )}
          </Button>
        </div>
      </form>

      <div className="hidden max-w-3xl flex-wrap justify-center gap-2 md:flex">
        {PROJECT_TEMPLATES.map((template) => (
          <Button
            key={template.title}
            variant="outline"
            size="sm"
            className="bg-white dark:bg-sidebar"
            onClick={() => onSelect(template.prompt)}
          >
            {template.emoji} {template.title}
          </Button>
        ))}
      </div>
    </section>
  )
}
