import type * as React from "react"
import { cn } from "@/lib/utils"

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function NeoCard({ className, children, ...props }: NeoCardProps) {
  return (
    <div className={cn("neo-card p-4", className)} {...props}>
      {children}
    </div>
  )
}
