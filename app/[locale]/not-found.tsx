"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

export default function NotFound() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"
  const translations = getTranslations(locale)

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-pixel text-brand-cyan animate-pulse">404</h1>
        <p className="text-xl text-gray-400">
          {translations.notFound.title}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-block mt-4 px-6 py-3 bg-brand-cyan text-brand-dark font-pixel text-xs uppercase hover:bg-brand-pink transition-colors"
        >
          {translations.notFound.backToHome}
        </Link>
      </div>
    </div>
  )
}
