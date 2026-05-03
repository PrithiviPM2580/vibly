"use client"

import { Suspense } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import MessageContainer from "../components/message-container"

interface Props {
  projectId: string
}

export default function ProjectView({ projectId }: Props) {
  return (
    <div className="h-screen">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex min-h-0 flex-col"
        >
          <Suspense fallback={<p>Loading messages...</p>}>
            <MessageContainer projectId={projectId} />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          TODO: Preview
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
