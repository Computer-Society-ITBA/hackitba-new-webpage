import { Suspense } from "react"
import { VerifyEmailContent } from "./verify-email-content"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function VerifyEmailPage({ params }: PageProps) {
  const { locale } = await params
  const translations = getTranslations(locale)

  return (
    <Suspense fallback={
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-300 mt-4">{translations.verifyEmailPage.loading}</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
