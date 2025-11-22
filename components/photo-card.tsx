"use client"

import type * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Zap, Trophy } from "lucide-react"

interface PhotoCardProps {
  imageUrl: string
  username: string
  avatarUrl: string
  rank?: number
  wld: number
  potentialWld: number
  style?: React.CSSProperties
  className?: string
}

export function PhotoCard({
  imageUrl,
  username,
  avatarUrl,
  rank,
  wld,
  potentialWld,
  style,
  className,
}: PhotoCardProps) {
  return (
    <div className={cn("neo-card overflow-hidden", className)} style={style}>
      <div className="relative aspect-[3/4] bg-muted">
        <img src={imageUrl || "/placeholder.svg"} alt={`Photo by ${username}`} className="w-full h-full object-cover" />

        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <Badge className="bg-primary text-primary-foreground font-black border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] h-7 px-3 gap-1">
            <Zap className="h-3 w-3 fill-current" />
            {wld} WLD
          </Badge>
          <Badge className="bg-yellow-400 text-black font-black border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] h-7 px-3 gap-1">
            <Trophy className="h-3 w-3" />
            Win: {potentialWld} WLD
          </Badge>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

        {/* User info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="text-foreground font-black">{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-black text-base">{username}</div>
              {rank && (
                <Badge className="bg-primary text-primary-foreground font-black border-0 h-5 px-2 mt-1">#{rank}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
