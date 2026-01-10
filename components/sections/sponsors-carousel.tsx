"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SponsorsCarouselProps {
  translations: any
}

const sponsors = [
  { name: "Microsoft", logo: "https://logo.clearbit.com/microsoft.com" },
  { name: "Google", logo: "https://logo.clearbit.com/google.com" },
  { name: "ExxonMobil", logo: "https://logo.clearbit.com/exxonmobil.com" },
  { name: "MODO", logo: "https://logo.clearbit.com/modo.com.ar" },
  { name: "IOL Inversiones", logo: "https://logo.clearbit.com/iol.com.ar" },
]

export function SponsorsCarousel({ translations }: SponsorsCarouselProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev - 1) % 100)
    }, 30)

    return () => clearInterval(interval)
  }, [])

  const doubledSponsors = [...sponsors, ...sponsors, ...sponsors]

  return (
    <section id="sponsors" className="py-20 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-brand-cyan mb-2">{translations.sponsors.endpoint}</p>
          <h2 className="font-pixel text-3xl md:text-5xl text-brand-orange neon-glow-orange">
            {translations.sponsors.title}
          </h2>
        </div>

        <div className="relative">
          <div className="flex gap-12 items-center" style={{ transform: `translateX(${offset}%)` }}>
            {doubledSponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.name}-${index}`}
                className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center glass-effect rounded-lg p-6"
              >
                <Image
                  src={sponsor.logo || "/placeholder.svg"}
                  alt={sponsor.name}
                  width={120}
                  height={120}
                  className="object-contain filter brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
