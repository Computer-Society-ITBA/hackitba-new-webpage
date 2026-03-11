import { Suspense } from "react"
import { ResetPasswordContent } from "./reset-password-content"
import type { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { locale } = await params

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-pixel text-2xl text-brand-cyan neon-glow-cyan">
            {locale === "es" ? "Cargando..." : "Loading..."}
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
