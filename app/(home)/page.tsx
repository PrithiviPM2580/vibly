import Image from "next/image"

import ProjectForm from "@/trpc/modules/home/ui/components/project-form"
import ProjectsList from "@/trpc/modules/home/ui/components/projects-list"

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Vibe"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-center text-2xl font-bold md:text-5xl">
          Build something with Vibe
        </h1>
        <p className="text-center text-lg text-muted-foreground md:text-xl">
          Create apps and websites by chatting with AI
        </p>
        <div className="mx-auto w-full max-w-3xl">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  )
}
