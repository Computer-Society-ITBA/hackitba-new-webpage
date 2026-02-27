import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef, isValidElement, cloneElement } from "react"
import type React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  asChild?: boolean
  children?: React.ReactNode
  arrow?: "left" | "right"
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "outline", size = "md", asChild = false, children, arrow, ...props }, ref) => {

    // Define icons
    const leftIcon = <ChevronLeft className="w-6 h-6" />
    const rightIcon = <ChevronRight className="w-6 h-6 ml-2" />

    // Determine the component type
    const Comp = asChild ? Slot : "button"

    // Process children to include arrows if needed
    // This allows the whole button to remain a single clickable element (like a Link)
    // while still injecting icons if the arrow prop is used.
    const composedChildren = (() => {
      // If not asChild, just return the content wrapped in icons
      if (!asChild) {
        return (
          <>
            {arrow === "left" && leftIcon}
            {children}
            {arrow === "right" && rightIcon}
          </>
        )
      }

      // If asChild, we handle the case where we might want to inject arrows into the child component
      if (arrow && isValidElement(children)) {
        const child = children as React.ReactElement<any>
        return cloneElement(child, {
          children: (
            <>
              {arrow === "left" && leftIcon}
              {child.props.children}
              {arrow === "right" && rightIcon}
            </>
          ),
          // Merge styles to ensure flex and gap are applied to the child (e.g. the Link)
          className: cn(
            "flex flex-row justify-center items-center",
            "sm:gap-x-4 gap-x-0",
            child.props.className
          )
        })
      }

      return children
    })()

    return (
      <Comp
        ref={ref}
        className={cn(
          "font-pixel uppercase tracking-wider leading-none transition-all duration-200",
          "border-3 relative overflow-hidden",
          "hover:scale-105 active:scale-95",
          "flex flex-row justify-center items-center cursor-pointer",
          "sm:gap-x-4 gap-x-0",
          // Ensuring any svg/img icon descendants have consistent size and responsive visibility
          "[_svg]:w-6 [_svg]:h-6 [_svg]:hidden sm:[_svg]:inline-flex",
          "[_img]:w-6 [_img]:h-6 [_img]:hidden sm:[_img]:inline-flex",
          {
            // Primary variant: Solid brand orange with navy text
            "bg-brand-orange border-brand-orange text-brand-navy neon-glow-orange hover:neon-border-orange":
              variant === "primary",
            // Outline/Secondary variant: Transparent brand cyan with neon glow
            "bg-transparent border-brand-cyan/80 text-brand-cyan neon-glow-cyan neon-border-cyan hover:neon-border-cyan hover:neon-glow-cyan":
              variant === "outline" || variant === "secondary",
          },
          {
            // Size mapping
            "px-3 py-1 text-xs": size === "sm",
            "px-6 py-2 text-sm": size === "md",
            "px-8 py-3 text-base": size === "lg",
          },
          className,
        )}
        {...props}
      >
        {composedChildren}
      </Comp>
    )
  },
)

PixelButton.displayName = "PixelButton"

export { PixelButton }

