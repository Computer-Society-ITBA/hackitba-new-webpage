import { getTranslations } from "@/lib/i18n/get-translations"
import { type Locale } from "@/lib/i18n/config"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function CreditsPage({ params }: PageProps) {
  const { locale } = await params
  const translations = getTranslations(locale)

  const teamMembers = [
    "Nahuel Ignacio Prado",
    "Clara Rodriguez Acevedo",
    "Mateo Buela Daddiego",
  ]

  return (
    <div className="min-h-screen">
      <Header translations={translations} locale={locale} />

      <main className="min-h-screen flex items-center justify-center px-4 py-24">
        <div className="absolute inset-0 opacity-5 text-xs text-brand-cyan leading-relaxed overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i}>
              {Array.from({ length: 100 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join("")}
            </div>
          ))}
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <div className="mb-6">
            <Link 
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-brand-cyan hover:text-brand-orange transition-colors font-pixel text-sm"
            >
              <ArrowLeft size={16} />
              {locale === "es" ? "Volver" : "Back"}
            </Link>
          </div>

          <GlassCard className="p-8 md:p-12">
            <div className="space-y-8">
              <div className="text-center border-b border-brand-cyan/20 pb-6">
                <h1 className="font-pixel text-3xl md:text-4xl text-brand-orange mb-4">
                  {locale === "es" ? "Créditos" : "Credits"}
                </h1>
                <p className="font-pixel text-sm text-brand-cyan">
                  {locale === "es" 
                    ? "El sitio completo fue posible gracias al fantástico esfuerzo de estos miembros del equipo ITBA de IEEE Computer Society. Todo, desde el diseño hasta la ejecución, fue hecho por ellos:"
                    : "This entire site was made possible thanks to the fantastic effort of these members of the ITBA IEEE Computer Society team. Everything, from design to execution, was done by them:"}
                </p>
              </div>

              <div className="space-y-6">
                {teamMembers.length > 0 ? (
                  <div className="text-center space-y-3">
                    {teamMembers.map((name, index) => (
                      <p 
                        key={index}
                        className="font-pixel text-md text-brand-yellow"
                      >
                        {name}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-block p-6 rounded-lg border border-brand-cyan/30 bg-brand-navy/30">
                      <p className="font-pixel text-sm text-brand-cyan mb-4">
                        🧡
                      </p>
                      <p className="text-sm text-brand-cyan/70">
                        {locale === "es"
                          ? "Equipo IEEE Computer Society ITBA"
                          : "IEEE Computer Society ITBA Team"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center pt-6 border-t border-brand-cyan/20">
                <p className="text-xs text-brand-cyan/60">
                  {locale === "es"
                    ? "IEEE Computer Society ITBA © 2026"
                    : "IEEE Computer Society ITBA © 2026"}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>

      <Footer translations={translations} locale={locale} />
    </div>
  )
}
