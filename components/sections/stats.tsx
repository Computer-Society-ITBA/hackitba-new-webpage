"use client"

import { useEffect, useState, useRef } from "react"
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
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const stats: StatItem[] = [
    { value: 3, label: translations.stats.categories },
    { value: 36, label: translations.stats.hoursOfCoding },
    { value: 200, label: translations.stats.participants },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 1000
    const steps = 60
    const timers: NodeJS.Timeout[] = []

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
      timers.push(timer)
    })

    return () => timers.forEach(clearInterval)
  }, [isVisible])

  return (
    <section id="stats" ref={sectionRef} className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="font-pixel text-6xl md:text-7xl text-brand-yellow neon-glow-orange mb-4">
              <NeonGlow flickering color="orange">
                {counts.categories}
              </NeonGlow>
            </div>
            <p className="font-pixel text-lg text-brand-yellow whitespace-pre-line">{translations.stats.categories}</p>
          </div>

          <div className="text-center">
            <div className="font-pixel text-6xl md:text-7xl text-brand-yellow neon-glow-orange mb-4">
              <NeonGlow flickering color="orange">
                {counts.hours}
              </NeonGlow>
            </div>
            <p className="font-pixel text-lg text-brand-yellow whitespace-pre-line">{translations.stats.hoursOfCoding}</p>
          </div>

          <div className="text-center">
            <div className="font-pixel text-6xl md:text-7xl text-brand-yellow neon-glow-orange mb-4">
              <NeonGlow flickering color="orange">
                {counts.participants}
              </NeonGlow>
            </div>
            <p className="font-pixel text-lg text-brand-yellow whitespace-pre-line">{translations.stats.participants}</p>
          </div>
        </div>

        <div className="mt-16 text-center max-w-xl mx-auto">
          <p className="font-pixel text-lg text-brand-yellow">{translations.event.location}</p>
          <p className="font-pixel text-lg text-brand-yellow">{translations.event.dates}</p>
          <p className="font-pixel text-lg text-brand-yellow">{translations.event.free}</p>
        </div>
      </div>
    </section>
  )
}
