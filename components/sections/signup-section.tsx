import Link from "next/link"
import { PixelButton } from "@/components/ui/pixel-button"
import type { Locale } from "@/lib/i18n/config"

interface SignupSectionProps {
  translations: any
  locale: Locale
}

export function SignupSection({ translations, locale }: SignupSectionProps) {
  return (
    <section id="signup" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="mb-8">
          <p className="font-mono text-sm text-brand-cyan mb-2">{translations.signup.subtitle}</p>
          <h2 className="font-pixel text-3xl md:text-5xl text-brand-orange neon-glow-orange">
            {translations.signup.title}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <PixelButton asChild size="lg" variant="primary">
            <Link href={`/${locale}/auth/signup?role=participante`}>{translations.signup.participant}</Link>
          </PixelButton>

          <PixelButton asChild size="lg" variant="secondary">
            <Link href={`/${locale}/auth/signup?role=sponsor`}>{translations.signup.sponsor}</Link>
          </PixelButton>

          <PixelButton asChild size="lg" variant="outline">
            <Link href={`/${locale}/auth/signup?role=mentor`}>{translations.signup.mentor}</Link>
          </PixelButton>
        </div>
      </div>
    </section>
  )
}
