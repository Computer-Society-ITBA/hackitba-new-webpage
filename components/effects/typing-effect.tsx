"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypingEffectProps {
  text: string
  speed?: "slow" | "fast"
  direction?: "horizontal" | "vertical"
  className?: string
  repeat?: boolean
}

export function TypingEffect({
  text,
  speed = "slow",
  direction = "horizontal",
  className,
  repeat = false,
}: TypingEffectProps) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  const typingSpeed = speed === "slow" ? 100 : 30

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, typingSpeed)

      return () => clearTimeout(timeout)
    } else if (repeat) {
      const resetTimeout = setTimeout(() => {
        setDisplayText("")
        setCurrentIndex(0)
      }, 2000)

      return () => clearTimeout(resetTimeout)
    }
  }, [currentIndex, text, typingSpeed, repeat])

  if (direction === "vertical") {
    return (
      <div className={cn("overflow-hidden", className)}>
        {displayText.split("\n").map((line, i) => (
          <div key={i} className="whitespace-pre">
            {line}
          </div>
        ))}
      </div>
    )
  }

  return (
    <span className={cn("inline-block", className)}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}
