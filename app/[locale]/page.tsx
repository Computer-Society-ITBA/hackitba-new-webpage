import { getTranslations } from "@/lib/i18n/get-translations"
import { type Locale, locales } from "@/lib/i18n/config"
import { Header } from "@/components/sections/header"
import { Hero } from "@/components/sections/hero"
import { Stats } from "@/components/sections/stats"
import { Timeline } from "@/components/sections/timeline"
import { InfoCards } from "@/components/sections/info-cards"
import { SponsorsCarousel } from "@/components/sections/sponsors-carousel"
import { Mentors } from "@/components/sections/mentors"
import { Judges } from "@/components/sections/judges"
import { Categories } from "@/components/sections/categories"
import { WhatWeProvide } from "@/components/sections/what-we-provide"
import { FAQs } from "@/components/sections/faqs"
import { Footer } from "@/components/sections/footer"
import { FloatingSignupButton } from "@/components/ui/floating-signup-button"

interface PageProps {
  params: Promise<{
    locale: Locale
  }>
}

import { Countdown } from "@/components/sections/countdown"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  const translations = getTranslations(locale)

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header translations={translations} locale={locale} />

      <main className="flex-grow">
        <Hero translations={translations} locale={locale} />
        <Stats translations={translations} />
        <InfoCards translations={translations} />
        <Categories translations={translations} locale={locale} />
        <Judges locale={locale} translations={translations} />
        <Mentors locale={locale} translations={translations} />
        <WhatWeProvide translations={translations} />
        <Countdown translations={translations} />
        <FAQs translations={translations} />
        <SponsorsCarousel translations={translations} />
      </main>

      <Footer translations={translations} locale={locale} />
      <FloatingSignupButton locale={locale} />
    </div>
  )
}
