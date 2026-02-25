"use client"

import { CodeBackground } from "@/components/effects/code-background"
import { cn } from "@/lib/utils"

interface LoadingProps {
    /** The text to display. Defaults to "Loading..." */
    text?: string
    /** If true, takes the full screen. Default: true */
    fullPage?: boolean
    /** Additional classes for the container */
    className?: string
    /** Whether to show the code background effect. Default: true if fullPage is true */
    showBackground?: boolean
}

export function Loading({
    text,
    fullPage = true,
    className,
    showBackground = true
}: LoadingProps) {
    // Use a default text if none provided
    const displayText = text || "Loading..."

    return (
        <div className={cn(
            "flex flex-col items-center justify-center relative overflow-hidden bg-brand-navy",
            fullPage ? "fixed inset-0 z-50 min-h-screen w-full" : "w-full p-8 rounded-lg",
            className
        )}>
            {fullPage && showBackground && <CodeBackground opacity={0.1} />}

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Standardized Pulsing Pixel Text */}
                <p className="text-brand-cyan font-pixel text-sm md:text-md lg:text-lg uppercase tracking-[0.2em] animate-pulse text-center neon-glow-cyan">
                    {displayText}
                </p>

                {/* Decorative Pixel-style Loading Bar */}
                <div className="w-48 h-1 bg-brand-cyan/10 relative overflow-hidden border border-brand-cyan/20">
                    <div className="absolute inset-0 bg-brand-cyan/40 animate-loading-bar" style={{ width: '30%' }}></div>
                </div>
            </div>

            <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite linear;
        }
      `}</style>
        </div>
    )
}
