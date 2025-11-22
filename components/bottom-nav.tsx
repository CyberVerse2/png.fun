"use client"

import { Camera, ThumbsUp, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "vote" | "leaderboard"
  onTabChange: (tab: "vote" | "leaderboard") => void
  onCameraClick: () => void
}

export function BottomNav({ activeTab, onTabChange, onCameraClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-[5px] border-foreground">
      <div className="relative flex items-center justify-around h-20 px-4">
        {/* Vote Tab */}
        <button
          onClick={() => onTabChange("vote")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === "vote" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === "vote"
                ? "bg-primary text-primary-foreground neo-shadow-sm"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ThumbsUp className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black uppercase">Vote</span>
        </button>

        {/* Camera FAB - Overflows top */}
        <button
          onClick={onCameraClick}
          className="absolute -top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-primary text-primary-foreground neo-border neo-shadow flex items-center justify-center active:neo-pressed transition-all"
        >
          <Camera className="h-8 w-8" strokeWidth={3} />
        </button>

        {/* Leaderboard Tab */}
        <button
          onClick={() => onTabChange("leaderboard")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === "leaderboard" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-lg transition-all",
              activeTab === "leaderboard"
                ? "bg-primary text-primary-foreground neo-shadow-sm"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Trophy className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black uppercase">Board</span>
        </button>
      </div>
    </div>
  )
}
