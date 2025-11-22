"use client"
import { Clock, ChevronDown, Users, Radio, Trophy } from "lucide-react"
import { NeoCard } from "./neo-card"
import { cn } from "@/lib/utils"

interface ChallengeHeaderProps {
  title: string
  timeRemaining: string
  submissionCount: number
  prizePool: string
  isExpanded: boolean
  onToggle: () => void
}

export function ChallengeHeader({
  title,
  timeRemaining,
  submissionCount,
  prizePool,
  isExpanded,
  onToggle,
}: ChallengeHeaderProps) {
  return (
    <NeoCard className="mb-4">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                <Radio className="h-3 w-3 animate-pulse" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-wider">LIVE</span>
              </div>
              <h2 className="text-xs font-black uppercase text-muted-foreground">Today's Challenge</h2>
            </div>
            <h1 className="text-lg font-black uppercase leading-tight mb-2">{title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <div className="bg-primary text-primary-foreground p-1 rounded-md">
                  <Users className="h-3 w-3" strokeWidth={3} />
                </div>
                <span>{submissionCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <div className="bg-primary text-primary-foreground p-1 rounded-md">
                  <Clock className="h-3 w-3" strokeWidth={3} />
                </div>
                <span>{timeRemaining}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <div className="bg-primary text-primary-foreground p-1 rounded-md">
                  <Trophy className="h-3 w-3" strokeWidth={3} />
                </div>
                <span>{prizePool}</span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "bg-primary text-primary-foreground p-1.5 rounded-lg transition-transform flex-shrink-0 mt-1",
              isExpanded && "rotate-180",
            )}
          >
            <ChevronDown className="h-4 w-4" strokeWidth={3} />
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 pt-4 border-t-2 border-foreground space-y-4">
            <p className="text-sm font-bold leading-relaxed text-muted-foreground">
              Submit your best photo that captures this moment. Be creative and authentic. Top voted photos win prizes.
            </p>
          </div>
        )}
      </button>
    </NeoCard>
  )
}
