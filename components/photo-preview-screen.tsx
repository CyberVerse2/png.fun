"use client"

import { NeoButton } from "@/components/neo-button"
import { RefreshCw, Send } from "lucide-react"

interface PhotoPreviewScreenProps {
  photoUrl: string
  onRetake: () => void
  onSend: () => void
}

export function PhotoPreviewScreen({ photoUrl, onRetake, onSend }: PhotoPreviewScreenProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="relative flex-1 w-full bg-black">
        {/* Mock Camera View / Photo Preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={photoUrl || "/placeholder.svg"} alt="Captured photo" className="h-full w-full object-cover" />
        </div>

        {/* Overlay UI */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pt-12 bg-gradient-to-b from-black/50 to-transparent">
          <div className="bg-black/30 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
            PREVIEW
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black p-6 pb-12 flex items-center justify-between gap-4 border-t-4 border-white/20">
        <NeoButton
          variant="secondary"
          onClick={onRetake}
          className="flex-1 bg-transparent text-white border-white hover:bg-white/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retake
        </NeoButton>
        <NeoButton variant="primary" onClick={onSend} className="flex-1">
          <Send className="mr-2 h-4 w-4" />
          Send
        </NeoButton>
      </div>
    </div>
  )
}
