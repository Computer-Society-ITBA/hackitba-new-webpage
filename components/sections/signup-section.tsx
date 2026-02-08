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
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">POST</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.signup.endpoint}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          <PixelButton asChild size="lg" variant="outline">
            <Link href={`/${locale}/auth/signup?role=participante`}>{translations.signup.participant}</Link>
          </PixelButton>

          <Link className="font-pixel text-md text-brand-yellow neon-glow-orange hover:neon-glow-orange transition-all duration-200 uppercase" href={`/${locale}/auth/signup?role=mentor`}>{translations.signup.mentor}</Link>

          <Link className="font-pixel text-md text-brand-yellow neon-glow-orange hover:neon-glow-orange transition-all duration-200 uppercase" href={`/${locale}/auth/signup?role=jurado`}>Jurado</Link>
        </div>
      </div>
    </section>
  )
}
