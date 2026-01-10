"use client"

import { TypingEffect } from "@/components/effects/typing-effect"
import { NeonGlow } from "@/components/effects/neon-glow"
import { FloatingArrow } from "@/components/effects/floating-arrow"

interface HeroProps {
  translations: any
}

export function Hero({ translations }: HeroProps) {
  const scrollToNext = () => {
    const nextSection = document.getElementById("stats")
    nextSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-10 font-mono text-xs text-brand-cyan leading-relaxed overflow-hidden pointer-events-none">
        <TypingEffect
          text={`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.`}
          speed="fast"
          direction="vertical"
          repeat
        />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-4xl">
        <div>
          <h1 className="font-pixel text-5xl md:text-7xl lg:text-8xl mb-4">
            <NeonGlow color="orange" flickering>
              [{translations.hero.title}]
            </NeonGlow>
          </h1>
          <p className="font-pixel text-lg md:text-xl text-brand-yellow">{translations.hero.subtitle}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <p className="text-brand-cyan text-base md:text-lg leading-relaxed">{translations.hero.description}</p>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <FloatingArrow onClick={scrollToNext} />
      </div>
    </section>
  )
}
