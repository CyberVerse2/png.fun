"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

interface NeoButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg" | "icon"
}

export function NeoButton({ className, variant = "secondary", size = "md", children, ...props }: NeoButtonProps) {
  return (
    <motion.button
      className={cn(
        "neo-border neo-shadow rounded-lg font-black uppercase transition-colors active:neo-pressed disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
        {
          "bg-primary text-primary-foreground": variant === "primary",
          "bg-background text-foreground": variant === "secondary",
          "bg-transparent border-0 shadow-none": variant === "ghost",
          "h-9 px-4 text-xs": size === "sm",
          "h-12 px-6 text-sm": size === "md",
          "h-14 px-8 text-base": size === "lg",
          "h-16 w-16 rounded-full p-0": size === "icon",
        },
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
