"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { useParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"

export default function SettingsPage() {
  const params = useParams()
  const locale = params.locale as Locale

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-pixel text-brand-cyan neon-glow-cyan">
            {locale === "es" ? "Configuración" : "Settings"}
          </h1>

          <GlassCard>
            <p className="text-gray-400 text-center py-8">
              {locale === "es" 
                ? "Página de configuración - Próximamente" 
                : "Settings page - Coming soon"}
            </p>
          </GlassCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
