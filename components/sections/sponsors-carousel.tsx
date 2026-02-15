"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { useSponsors } from "@/hooks/use-sponsors"

interface SponsorsCarouselProps {
  translations: any
}

export function SponsorsCarousel({ translations }: SponsorsCarouselProps) {
  const { sponsors, loading, error } = useSponsors()

  // Triplicate sponsors for infinite marquee effect
  const tripledSponsors = [...sponsors, ...sponsors, ...sponsors]

  if (loading) {
    return (
      <section id="sponsors" className="py-20 px-4">
        <div className="container mx-auto flex flex-col items-center">
          <p className="font-pixel text-brand-yellow animate-pulse text-xs">{translations.sponsors.loading?.toUpperCase()}</p>
        </div>
      </section>
    )
  }

  if (error) return null // Hide section if there's an error or handle as needed


  return (
    <section id="sponsors" className="py-20 px-4 overflow-hidden relative">
      <div className="container mx-auto relative">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.sponsors.endpoint}</p>
          </div>
        </div>

        <div className="relative flex items-center max-w-4xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full flex items-center bg-gradient-to-r from-[var(--color-brand-navy)] via-[var(--color-brand-navy)] to-transparent pr-8 pl-0">
            <div className="relative w-16 h-16 md:w-24 md:h-24 -rotate-90 filter">
              <Image
                src="/images/flecha-abajo.png"
                alt="Arrow"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex overflow-hidden w-full relative mask-linear-fade py-10">
            <div className="flex gap-12 items-center animate-marquee hover:pause-animation">
              {tripledSponsors.map((sponsor, index) => (
                <a
                  key={`${sponsor.name}-${index}`}
                  href={sponsor.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-40 h-40 md:w-40 md:h-40 p-2 flex items-center justify-center hover:scale-110 transition-transform duration-500 ease-out"
                >
                  <Image
                    src={sponsor.imageUrl || "/placeholder.svg"}
                    alt={sponsor.name}
                    width={160}
                    height={160}
                    className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
        .hover\:pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
