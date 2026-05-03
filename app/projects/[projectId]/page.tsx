import { Suspense } from "react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { getQueryClient, trpc } from "@/trpc/server"

import ProjectView from "@/trpc/modules/projects/ui/views/project-view"

interface Props {
  params: Promise<{
    projectId: string
  }>
}

export default async function Project({ params }: Props) {
  const { projectId } = await params

  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(
    trpc.messages.getMany.queryOptions({
      projectId,
    })
  )
  void queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    })
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p>Loading Project...</p>}>
        <ProjectView projectId={projectId} />
      </Suspense>
    </HydrationBoundary>
  )
}
