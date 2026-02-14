"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PixelButton } from "@/components/ui/pixel-button"
import type { Locale } from "@/lib/i18n/config"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, getDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface SignupSectionProps {
  translations: any
  locale: Locale
}

export function SignupSection({ translations, locale }: SignupSectionProps) {
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [signupLoading, setSignupLoading] = useState(true)
  const db = getDbClient()

  useEffect(() => {
    if (!db) return
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

  const isDisabled = signupLoading || !signupEnabled

  return (
    <section id="signup" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">POST</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.signup.endpoint}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          <PixelButton
            asChild={!isDisabled}
            size="lg"
            variant="outline"
            disabled={isDisabled}
            className={cn(isDisabled ? "opacity-50 cursor-not-allowed" : "")}
          >
            {!isDisabled ? (
              <Link href={`/${locale}/auth/signup?role=participante`}>{translations.signup.participant}</Link>
            ) : (
              <span>{translations.signup.participant}</span>
            )}
          </PixelButton>
        </div>
      </div>
    </section>
  )
}
