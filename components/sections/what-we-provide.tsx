import { GlassCard } from "@/components/ui/glass-card"

interface WhatWeProvideProps {
  translations: any
}

export function WhatWeProvide({ translations }: WhatWeProvideProps) {
  const weProvideItems = [
    translations.weProvide.swag,
    translations.weProvide.space,
    translations.weProvide.mentors,
    translations.weProvide.results,
    translations.weProvide.prizes,
  ]

  const youBringItems = [
    translations.youBring.talent,
    translations.youBring.sleepingBag,
    translations.youBring.computer,
  ]

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassCard neonOnHover neonColor="cyan">
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6 text-center">{translations.weProvide.title}</h3>
            <ul className="space-y-3">
              {weProvideItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-brand-orange text-lg">•</span>
                  <span className="text-brand-cyan leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard neonOnHover neonColor="orange">
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6 text-center">{translations.youBring.title}</h3>
            <ul className="space-y-3">
              {youBringItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-brand-orange text-lg">•</span>
                  <span className="text-brand-cyan leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
