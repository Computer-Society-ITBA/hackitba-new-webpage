"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { type HTMLAttributes, useState } from "react"

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  neonOnHover?: boolean
  neonColor?: "cyan" | "orange" | "yellow"
}

export function GlassCard({ className, children, neonOnHover = false, neonColor = "cyan", ...props }: GlassCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!neonOnHover) return

    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const neonColorMap = {
    cyan: "var(--color-brand-cyan)",
    orange: "var(--color-brand-orange)",
    yellow: "var(--color-brand-yellow)",
  }

  return (
    <div
      className={cn(
        "glass-effect rounded-lg p-6 relative",
        "transition-all duration-200",
        neonOnHover && "hover:border-opacity-50",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {neonOnHover && isHovered && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px, ${neonColorMap[neonColor]}20, transparent)`,
            boxShadow: `0 0 20px ${neonColorMap[neonColor]}40`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
