"use client"

import Link from "next/link"
import { PixelButton } from "@/components/ui/pixel-button"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

interface SignupSectionProps {
  translations: any
  locale: Locale
}

export function SignupSection({ translations, locale }: SignupSectionProps) {
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "false" && process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "0"

  const isDisabled = !signupEnabled

  return (
    <section id="signup" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
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
