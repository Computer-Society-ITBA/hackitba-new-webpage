import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"
import type React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  asChild?: boolean
  children?: React.ReactNode
  arrow?: "left" | "right"
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, children, arrow, ...props }, ref) => {
    if (asChild && children) {
      const child = children as any
      if (child?.type?.name === "Link" || child?.type?.displayName === "Link") {
        const leftIcon = <ChevronLeft className="w-6 h-6" />
        const rightIcon = <ChevronRight className="w-6 h-6 ml-2" />
        const childChildren = child.props.children
        const composedChildren =
          arrow === "left" ? (
            <>
              {leftIcon}
              {childChildren}
            </>
          ) : arrow === "right" ? (
            <>
              {childChildren}
              {rightIcon}
            </>
          ) : (
            childChildren
          )

        return (
          <child.type
            {...child.props}
            className={cn(
              "font-pixel uppercase tracking-wider transition-all duration-200",
              "border-3 relative overflow-hidden",
              "hover:scale-105 active:scale-95",
              "flex flex-row justify-center items-center",
              "sm:gap-x-4 gap-x-0",
              "[_svg]:w-6 [_svg]:h-6 [_svg]:hidden sm:[_svg]:inline-flex",
              "[_img]:w-6 [_img]:h-6 [_img]:hidden sm:[_img]:inline-flex",
              {
                "bg-brand-orange border-brand-orange text-brand-navy neon-glow-orange hover:neon-border-orange":
                  variant === "primary",
                "bg-transparent border-brand-cyan/80 text-brand-cyan neon-glow-cyan neon-border-cyan hover:neon-border-cyan hover:neon-glow-cyan":
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
            {composedChildren}
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
          "flex flex-row justify-center items-center",
          "sm:gap-x-4 gap-x-0",
          // Ensure any svg/img icon descendants have consistent size and responsive visibility
          "[_svg]:w-6 [_svg]:h-6 [_svg]:hidden sm:[_svg]:inline-flex",
          "[_img]:w-6 [_img]:h-6 [_img]:hidden sm:[_img]:inline-flex",
          {
            "bg-transparent border-brand-cyan/80 text-brand-cyan neon-glow-cyan neon-border-cyan hover:neon-border-cyan hover:neon-glow-cyan":
              variant === "primary",
            "bg-transparent border-brand-cyan text-brand-cyan neon-glow-cyan neon-border-cyan hover:neon-border-cyan hover:neon-glow-cyan":
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
        {
          (() => {
            const leftIcon = <ChevronLeft className="w-6 h-6" />
            const rightIcon = <ChevronRight className="w-6 h-6 ml-2" />
            const composedChildren =
              arrow === "left" ? (
                <>
                  {leftIcon}
                  {children}
                </>
              ) : arrow === "right" ? (
                <>
                  {children}
                  {rightIcon}
                </>
              ) : (
                children
              )

            return composedChildren
          })()
        }
      </button>
    )
  },
)

PixelButton.displayName = "PixelButton"

export { PixelButton }
