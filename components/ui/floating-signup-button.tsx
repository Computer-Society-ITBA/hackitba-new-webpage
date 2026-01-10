"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"

interface FloatingSignupButtonProps {
  locale: Locale
}

export function FloatingSignupButton({ locale }: FloatingSignupButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector("section")
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom
        setIsVisible(heroBottom < 0)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <Link
      href={`/${locale}/auth/signup`}
      className={cn(
        "fixed bottom-8 right-8 z-50",
        "w-16 h-16 flex items-center justify-center",
        "glass-effect rounded-full border-2 border-brand-orange",
        "text-brand-orange hover:neon-border-orange",
        "transition-all duration-300 hover:scale-110",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-label="Sign up"
    >
      <FolderOpen size={28} />
    </Link>
  )
}
