import { GlassCard } from "@/components/ui/glass-card"
import Image from "next/image"
import { Timeline } from "./timeline"

interface InfoCardsProps {
  translations: any
}

export function InfoCards({ translations }: InfoCardsProps) {
  return (
    <section
      id="info"
      className="py-20 px-4"
      style={{
        background: "linear-gradient(to bottom, var(--color-brand-navy) 50%, var(--color-brand-dark-orange))"
      }}
    >
      <Timeline translations={translations} />
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 mb-8">
          <GlassCard className="px-8">
            <div className="mb-4">
              <p className="font-pixel text-xs text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
              <p className="font-pixel text-md text-brand-yellow">v2026/about-us</p>
            </div>
            <div className="mb-8">
              <span>{"{"}</span>

              <div className="pl-4 mb-4">
                <p className="text-sm"><span className="text-brand-yellow">"{translations.about.history}":</span> "{translations.about.historyText}"</p>
              </div>

              <div className="pl-4 mb-4">
                <p className="text-sm"><span className="text-brand-yellow">"{translations.about.vision}":</span> "{translations.about.visionText}"</p>
              </div>

              <div className="pl-4">
                <p className="text-sm"><span className="text-brand-yellow">"{translations.about.objective}":</span> "{translations.about.objectiveText}"</p>
              </div>

              <span>{"}"}</span>
            </div>
          </GlassCard>

          <GlassCard className="px-8 flex flex-col">
            <div className="mb-4">
              <p className="font-pixel text-xs text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
              <p className="font-pixel text-md text-brand-yellow">v2026/location</p>
            </div>
            <div className="mb-8">
              <span>{"{"}</span>

              <div className="pl-4">
                <p className="text-sm"><span className="text-brand-yellow">"{translations.about.history}":</span> "{translations.location.description}"</p>
              </div>

              <div className="pl-4">
                <p className="text-sm"><span className="text-brand-yellow">"{translations.about.vision}":</span> "{translations.location.address}"</p>
              </div>

              <div className="pl-4">
                <p className="text-sm"><span className="text-brand-yellow">"{translations.about.objective}":</span> "{translations.location.coordinates}"</p>
              </div>

              <span>{"}"}</span>
            </div>
            <div className="relative w-full h-[200px] max-h-[400px] rounded-lg overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?hl=en&q=Iguazú%20341%20Cdad.%20Autónoma%20de%20Buenos%20Aires+(ITBA%20Sede%20Rectorado)&z=13&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </GlassCard>

        </div>
      </div >
    </section >
  )
}
