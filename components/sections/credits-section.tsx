"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { CodeBackground } from "@/components/effects/code-background"

interface CreditsSectionProps {
  translations: any
  locale: string
}

export function CreditsSection({ translations, locale }: CreditsSectionProps) {
  const teamMembers = [
    "Nahuel Ignacio Prado",
    "Clara Rodriguez Acevedo",
    "Mateo Buela Daddiego",
  ]

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <CodeBackground className="opacity-20" />

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <GlassCard className="p-4 md:py-4 md:px-12">
          <div className="space-y-8">
            <div className="text-center border-b border-brand-cyan/20 pb-2">
              <h1 className="font-pixel text-3xl md:text-4xl text-brand-yellow mb-2">
                {translations.credits.title}
              </h1>
              <p className="font-pixel text-xs">
                {locale === "es"
                  ? "El sitio completo fue posible gracias al fantástico esfuerzo de estos miembros del equipo ITBA de IEEE Computer Society. Todo, desde el diseño hasta la ejecución, fue hecho por ellos:"
                  : "This entire site was made possible thanks to the fantastic effort of these members of the ITBA IEEE Computer Society team. Everything, from design to execution, was done by them:"}
              </p>
            </div>

            <div className="space-y-2">
              {teamMembers.length > 0 ? (
                <div className="text-center space-y-3">
                  {teamMembers.map((name, index) => (
                    <p key={index} className="font-pixel text-sm">
                      {name}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="inline-block px-6 py-2 rounded-lg border border-brand-cyan/30 bg-brand-navy/30">
                    <p className="font-pixel text-sm text-brand-cyan mb-2">🧡</p>
                    <p className="text-sm text-brand-cyan/70">
                      {locale === "es"
                        ? "Equipo IEEE Computer Society ITBA"
                        : "IEEE Computer Society ITBA Team"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-brand-cyan/20">
              <p className="text-xs text-brand-cyan/60">
                {locale === "es"
                  ? "IEEE Computer Society ITBA © 2026"
                  : "IEEE Computer Society ITBA © 2026"}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
