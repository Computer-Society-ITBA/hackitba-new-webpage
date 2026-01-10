import { GlassCard } from "@/components/ui/glass-card"
import Image from "next/image"

interface InfoCardsProps {
  translations: any
}

export function InfoCards({ translations }: InfoCardsProps) {
  return (
    <section id="info" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <GlassCard neonOnHover neonColor="orange">
            <div className="text-center mb-4">
              <p className="font-mono text-sm text-brand-cyan mb-2">{translations.about.title}</p>
              <p className="font-mono text-sm text-brand-cyan">GET v2026/about-us</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-pixel text-lg text-brand-yellow mb-2">{translations.about.history}</h3>
                <p className="text-brand-cyan text-sm leading-relaxed">{translations.about.historyText}</p>
              </div>

              <div>
                <h3 className="font-pixel text-lg text-brand-yellow mb-2">{translations.about.vision}</h3>
                <p className="text-brand-cyan text-sm leading-relaxed">{translations.about.visionText}</p>
              </div>

              <div>
                <h3 className="font-pixel text-lg text-brand-yellow mb-2">{translations.about.objective}</h3>
                <p className="text-brand-cyan text-sm leading-relaxed">{translations.about.objectiveText}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard neonOnHover neonColor="cyan">
            <div className="text-center mb-4">
              <p className="font-mono text-sm text-brand-cyan mb-2">{translations.location.title}</p>
              <p className="font-mono text-sm text-brand-cyan">GET v2026/location</p>
            </div>

            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <Image src="/images/image.png" alt="Location Map" fill className="object-cover" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-brand-cyan font-pixel">{translations.location.description}</p>
                <p className="text-brand-cyan/80 text-sm">{translations.location.address}</p>
                <p className="text-brand-cyan/60 text-xs font-mono">{translations.location.coordinates}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
