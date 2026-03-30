"use client"

import { CodeBackground } from "@/components/effects/code-background"
import { NeonGlow } from "@/components/effects/neon-glow"
import { FloatingArrow } from "@/components/effects/floating-arrow"
import { useAuth } from "@/lib/firebase/auth-context"
import type { Locale } from "@/lib/i18n/config"
import Link from "next/link"


interface HeroProps {
  translations: any,
  locale: Locale
}

export function Hero({ translations, locale }: HeroProps) {
  const { user, loading } = useAuth()
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "false" && process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "0"

  const scrollToNext = () => {
    const nextSection = document.getElementById("stats")
    nextSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <CodeBackground />

      <div className="relative z-10 text-center space-y-8 max-w-4xl flex flex-col items-center">
        <div>
          <h1 className="font-pixel text-3xl md:text-5xl lg:text-6xl mb-4 mx-auto max-w-2xl">
            <NeonGlow color="orange" flickering>
              {/* <TypingEffect
                text={translations.hero.title}
                speed="slow"
                direction="horizontal"
              /> */}
              <img src="/images/hackitba-alt-logo.png" alt="" />
            </NeonGlow>
          </h1>
          <p className="font-pixel text-lg md:text-xl text-brand-yellow">{translations.hero.subtitle}</p>
          {!loading && (
            <Link
              href={`/${locale}/dashboard/winners-reveal`}
              className="duration-200 ease-in-out mt-6 inline-flex items-center gap-2 rounded-lg border border-brand-cyan/60 bg-brand-navy/60 px-4 py-2 font-pixel text-xs md:text-sm text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan hover:opacity-100 transition-all"
            >
              {translations.hero.seeWinners}
            </Link>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <NeonGlow color="cyan" flickering>
          <FloatingArrow onClick={scrollToNext} />
        </NeonGlow>
      </div>
    </section>
  )
}
