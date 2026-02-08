"use client"

import { TypingEffect } from "@/components/effects/typing-effect"
import { NeonGlow } from "@/components/effects/neon-glow"
import { FloatingArrow } from "@/components/effects/floating-arrow"
import { LoremIpsum } from "lorem-ipsum"

interface HeroProps {
  translations: any
}

const lorem = new LoremIpsum()

export function Hero({ translations }: HeroProps) {
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
