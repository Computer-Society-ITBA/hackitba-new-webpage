"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface NeonGlowProps {
  children: React.ReactNode
  className?: string
  color?: "cyan" | "orange" | "yellow"
  flickering?: boolean
}

export function NeonGlow({ children, className, color = "cyan", flickering = false }: NeonGlowProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!flickering) return

    const flicker = () => {
      const flickerPattern = [100, 50, 100, 150, 50, 100, 200, 50, 100, 300, 50, 100, 100, 50, 100, 2000]

      let index = 0
      const runFlicker = () => {
        setIsVisible((prev) => !prev)

        setTimeout(() => {
          index = (index + 1) % flickerPattern.length
          if (index === 0) {
            setTimeout(runFlicker, 5000 + Math.random() * 10000)
          } else {
            runFlicker()
          }
        }, flickerPattern[index])
      }

      runFlicker()
    }

    const initialDelay = setTimeout(flicker, 3000 + Math.random() * 5000)

    return () => clearTimeout(initialDelay)
  }, [flickering])

  const glowClass = `neon-glow-${color}`

  return (
    <span className={cn("transition-opacity duration-75", isVisible ? glowClass : "opacity-80", className)}>
      {children}
    </span>
  )
}
