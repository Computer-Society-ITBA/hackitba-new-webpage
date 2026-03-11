"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { useParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"

export default function SettingsPage() {
  const params = useParams()
  const locale = params.locale as Locale
  const translations = getTranslations(locale)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-pixel text-brand-cyan neon-glow-cyan">
            {translations.dashboard.settings.title}
          </h1>

          <GlassCard>
            <p className="text-gray-400 text-center py-8">
              {translations.dashboard.settings.comingSoon}
            </p>
          </GlassCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
