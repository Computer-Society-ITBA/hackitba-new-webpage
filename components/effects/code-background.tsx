"use client"

import { TypingEffect } from "@/components/effects/typing-effect"
import { codeSnippet } from "@/lib/code-snippet"
import { cn } from "@/lib/utils"

interface CodeBackgroundProps {
  className?: string
}

export function CodeBackground({ className }: CodeBackgroundProps) {
  return (
    <div className={cn(
      "[mask-image:linear-gradient(to_bottom,transparent,black,transparent)] absolute inset-4 opacity-10 font-pixel text-sm text-brand-cyan leading-none pointer-events-none overflow-hidden",
      className,
    )}>
      <TypingEffect text={codeSnippet} speed="fast" direction="horizontal" />
    </div>
  )
}
