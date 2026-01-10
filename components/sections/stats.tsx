"use client"

import { useEffect, useState } from "react"
import { NeonGlow } from "@/components/effects/neon-glow"

interface StatsProps {
  translations: any
}

interface StatItem {
  value: number
  label: string
}

export function Stats({ translations }: StatsProps) {
  const [counts, setCounts] = useState({ categories: 0, hours: 0, participants: 0 })

  const stats: StatItem[] = [
    { value: 3, label: translations.stats.categories },
    { value: 36, label: translations.stats.hoursOfCoding },
    { value: 100, label: translations.stats.participants },
  ]

  useEffect(() => {
    const duration = 2000
    const steps = 60

    stats.forEach((stat, index) => {
      const increment = stat.value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= stat.value) {
          current = stat.value
          clearInterval(timer)
        }

        setCounts((prev) => ({
          ...prev,
          [index === 0 ? "categories" : index === 1 ? "hours" : "participants"]: Math.floor(current),
        }))
      }, duration / steps)
    })
  }, [])

  return (
    <section id="stats" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="font-pixel text-6xl md:text-7xl text-brand-yellow neon-glow-yellow mb-4">
              {counts.categories}
            </div>
            <p className="font-pixel text-lg text-brand-cyan whitespace-pre-line">{translations.stats.categories}</p>
          </div>

          <div className="text-center">
            <div className="font-pixel text-6xl md:text-7xl text-brand-yellow neon-glow-yellow mb-4">
              {counts.hours}
            </div>
            <p className="font-pixel text-lg text-brand-cyan whitespace-pre-line">{translations.stats.hoursOfCoding}</p>
          </div>

          <div className="text-center">
            <div className="font-pixel text-6xl md:text-7xl text-brand-yellow neon-glow-yellow mb-4">
              {counts.participants}
            </div>
            <p className="font-pixel text-lg text-brand-cyan whitespace-pre-line">{translations.stats.participants}</p>
          </div>
        </div>

        <div className="mt-16 text-center space-y-4 max-w-xl mx-auto">
          <p className="font-pixel text-xl md:text-2xl text-brand-orange">
            <NeonGlow color="orange">{translations.event.location}</NeonGlow>
          </p>
          <p className="font-pixel text-lg text-brand-cyan">{translations.event.dates}</p>
          <p className="font-pixel text-lg text-brand-yellow">{translations.event.free}</p>
        </div>
      </div>
    </section>
  )
}
