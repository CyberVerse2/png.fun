"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopBarProps {
  onProfileClick?: () => void
}

export function TopBar({ onProfileClick }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b-[5px] border-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xl font-black uppercase tracking-tight">PNG.FUN</div>

        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full neo-border neo-shadow-sm active:neo-pressed transition-all"
        >
          <Avatar className="h-6 w-6 border-2 border-primary-foreground bg-background">
            <AvatarImage src="/placeholder.svg?height=24&width=24" />
            <AvatarFallback className="text-xs font-black text-primary">T</AvatarFallback>
          </Avatar>
          <span className="text-xs font-black lowercase">@thecyberverse</span>
        </button>
      </div>
    </div>
  )
}
