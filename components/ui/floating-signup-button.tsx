"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/lib/firebase/auth-context"

interface FloatingSignupButtonProps {
  locale: Locale
}

export function FloatingSignupButton({ locale }: FloatingSignupButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [signupLoading, setSignupLoading] = useState(true)
  const db = getDbClient()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!db) return

    const envVal = process.env.NEXT_PUBLIC_SIGNUP_ENABLED
    if (typeof envVal !== "undefined" && envVal !== null && envVal !== "") {
      const enabled = envVal === "true" || envVal === "1"
      setSignupEnabled(enabled)
      setSignupLoading(false)
      return
    }

    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setSignupEnabled(data?.signupEnabled !== false)
        } else {
          setSignupEnabled(true)
        }
      } catch (err) {
        console.error("Error loading signup setting:", err)
        setSignupEnabled(true)
      } finally {
        setSignupLoading(false)
      }
    }

    loadSettings()
  }, [db])

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

  const isDisabled = signupLoading || !signupEnabled
  const Component = isDisabled ? "div" : Link

  // Determine the href based on user login status
  const href = user ? `/${locale}/dashboard` : `/${locale}/auth/signup`

  return (
    <Component
      {...(!isDisabled && { href })}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => !isDisabled && setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-8 right-8 z-50",
        "w-24 h-24 flex items-center justify-center",
        isDisabled ? "cursor-not-allowed" : "transition-all duration-300 hover:scale-110",
        isVisible ? (isDisabled ? "opacity-30 translate-y-0" : "opacity-100 translate-y-0") : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-label={user ? "Go to dashboard" : "Sign up"}
      {...(isDisabled && { "aria-disabled": "true" })}
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
    </Component>
  )
}
