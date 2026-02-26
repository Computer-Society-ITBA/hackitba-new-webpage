"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"
import { useAuth } from "@/lib/firebase/auth-context"

interface FloatingSignupButtonProps {
  locale: Locale
}

export function FloatingSignupButton({ locale }: FloatingSignupButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "true" || process.env.NEXT_PUBLIC_SIGNUP_ENABLED === "1"
  const signupLoading = false
  const { user, loading: authLoading } = useAuth()

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

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isHovered && currentFrame < 5) {
      timeout = setTimeout(() => {
        setCurrentFrame((prev) => prev + 1)
      }, 20)
    } else if (!isHovered && currentFrame > 0) {
      timeout = setTimeout(() => {
        setCurrentFrame((prev) => prev - 1)
      }, 20)
    }

    return () => clearTimeout(timeout)
  }, [isHovered, currentFrame])

  if (signupLoading) return null
  if (!signupEnabled) return null

  const isDisabled = false
  const Component = isDisabled ? "div" : Link

  // Determine the href based on user login status
  const href = user ? `/${locale}/dashboard` : `/${locale}/auth/signup`

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-8 right-8 z-50",
        "w-24 h-24 flex items-center justify-center",
        "transition-all duration-300 hover:scale-110",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-label={user ? "Go to dashboard" : "Sign up"}
    >
      <div className="relative w-24 h-24">
        {[0, 1, 2, 3, 4, 5].map((frame) => (
          <Image
            key={frame}
            src={`/images/folder-animation/${frame}.png`}
            alt=""
            width={80}
            height={80}
            className={cn(
              "absolute inset-0 object-contain transition-opacity duration-0",
              currentFrame === frame ? "opacity-100" : "opacity-0"
            )}
            priority={frame === 0}
          />
        ))}
      </div>
    </Link>
  )
}
