"use client"

import { useEffect, useState } from "react"
import { TypingEffect } from "@/components/effects/typing-effect"
import { NeonGlow } from "@/components/effects/neon-glow"
import { FloatingArrow } from "@/components/effects/floating-arrow"
import { LoremIpsum } from "lorem-ipsum"
import { useAuth } from "@/lib/firebase/auth-context"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, getDoc } from "firebase/firestore"

interface HeroProps {
  translations: any
}

const lorem = new LoremIpsum()

export function Hero({ translations }: HeroProps) {
  const { user, loading } = useAuth()
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

  const scrollToNext = () => {
    const nextSection = document.getElementById("stats")
    nextSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="[mask-image:linear-gradient(to_bottom,transparent,black,transparent)] absolute inset-4 opacity-10 font-pixel text-s text-brand-cyan leading-relaxed overflow-hidden pointer-events-none">
        <TypingEffect
          text={lorem.generateParagraphs(55)}
          speed="fast"
          direction="vertical"
        />
      </div>

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
          {!loading && !signupLoading && !user && signupEnabled && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-brand-cyan/40 bg-brand-navy/60 px-4 py-2 font-pixel text-xs md:text-sm text-brand-cyan">
              Están abiertas las inscripciones!
            </div>
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
