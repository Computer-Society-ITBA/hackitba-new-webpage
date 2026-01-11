import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"
import type React from "react"

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  asChild?: boolean
  children?: React.ReactNode
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, children, ...props }, ref) => {
    if (asChild && children) {
      const child = children as any
      if (child?.type?.name === "Link" || child?.type?.displayName === "Link") {
        return (
          <child.type
            {...child.props}
            className={cn(
              "font-pixel uppercase tracking-wider transition-all duration-200",
              "border-3 relative overflow-hidden inline-flex items-center justify-center",
              "hover:scale-105 active:scale-95",
              {
                "bg-brand-orange border-brand-orange text-brand-navy neon-glow-orange hover:neon-border-orange":
                  variant === "primary",
                "bg-brand-cyan border-brand-cyan text-brand-navy neon-glow-cyan hover:neon-border-cyan":
                  variant === "secondary",
                "bg-transparent border-brand-cyan text-brand-cyan":
                  variant === "outline",
              },
              {
                "px-3 py-1.5 text-xs": size === "sm",
                "px-6 py-2.5 text-sm": size === "md",
                "px-8 py-3.5 text-base": size === "lg",
              },
              className,
              child.props.className,
            )}
          >
            {child.props.children}
          </child.type>
        )
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          "font-pixel uppercase tracking-wider transition-all duration-200",
          "border-3 relative overflow-hidden",
          "hover:scale-105 active:scale-95",
          {
            "bg-brand-orange border-brand-orange text-brand-navy neon-glow-orange hover:neon-border-orange":
              variant === "primary",
            "bg-brand-cyan border-brand-cyan text-brand-navy neon-glow-cyan hover:neon-border-cyan":
              variant === "secondary",
            "bg-transparent border-brand-cyan text-brand-cyan hover:neon-border-cyan hover:neon-glow-cyan":
              variant === "outline",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-6 py-2.5 text-sm": size === "md",
            "px-8 py-3.5 text-base": size === "lg",
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

PixelButton.displayName = "PixelButton"

export { PixelButton }
