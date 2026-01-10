import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { Header } from "@/components/sections/header"
import { Hero } from "@/components/sections/hero"
import { Stats } from "@/components/sections/stats"
import { Timeline } from "@/components/sections/timeline"
import { InfoCards } from "@/components/sections/info-cards"
import { SponsorsCarousel } from "@/components/sections/sponsors-carousel"
import { Mentors } from "@/components/sections/mentors"
import { Categories } from "@/components/sections/categories"
import { WhatWeProvide } from "@/components/sections/what-we-provide"
import { FAQs } from "@/components/sections/faqs"
import { SignupSection } from "@/components/sections/signup-section"
import { Footer } from "@/components/sections/footer"
import { FloatingSignupButton } from "@/components/ui/floating-signup-button"

interface PageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  const translations = getTranslations(locale)

  return (
    <div className="min-h-screen">
      <Header translations={translations} locale={locale} />

      <main>
        <Hero translations={translations} />
        <Stats translations={translations} />
        <Timeline translations={translations} />
        <InfoCards translations={translations} />
        <SponsorsCarousel translations={translations} />
        <Mentors translations={translations} />
        <Categories translations={translations} />
        <WhatWeProvide translations={translations} />
        <SignupSection translations={translations} locale={locale} />
        <FAQs translations={translations} />
      </main>

      <Footer translations={translations} locale={locale} />
      <FloatingSignupButton locale={locale} />
    </div>
  )
}
