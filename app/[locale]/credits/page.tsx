import { getTranslations } from "@/lib/i18n/get-translations"
import { type Locale } from "@/lib/i18n/config"
import { Header } from "@/components/sections/header"
import { Footer } from "@/components/sections/footer"
import { CreditsSection } from "@/components/sections/credits-section"

interface PageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function CreditsPage({ params }: PageProps) {
  const { locale } = await params
  const translations = getTranslations(locale)

  return (
    <div className="min-h-screen">
      <Header translations={translations} locale={locale} />

      <main>
        <CreditsSection translations={translations} locale={locale} />
      </main>

      <Footer translations={translations} locale={locale} />
    </div>
  )
}
