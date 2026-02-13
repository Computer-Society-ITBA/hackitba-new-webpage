"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

export default function NotFound() {
  const params = useParams()
  const locale = (params?.locale as string) || "es"

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-pixel text-brand-cyan animate-pulse">404</h1>
        <p className="text-xl text-gray-400">
          {locale === "es" ? "Página no encontrada" : "Page not found"}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-block mt-4 px-6 py-3 bg-brand-cyan text-brand-dark font-pixel text-xs uppercase hover:bg-brand-pink transition-colors"
        >
          {locale === "es" ? "Volver al inicio" : "Back to home"}
        </Link>
      </div>
    </div>
  )
}
