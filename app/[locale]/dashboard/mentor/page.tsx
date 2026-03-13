"use client"

import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { useAuth } from "@/lib/firebase/auth-context"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { Users, BookOpen, Calendar } from "lucide-react"

export default function MentorDashboard() {
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const t = getTranslations(locale)
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedRoles={["mentor"]}>
      <DashboardLayout title={locale === "es" ? "Panel de Mentor" : "Mentor Dashboard"}>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <p className="text-brand-cyan/70 text-sm">
              {locale === "es" 
                ? "Bienvenido a tu panel de mentor. Aquí puedes ver tu información y actividades." 
                : "Welcome to your mentor panel. Here you can view your information and activities."}
            </p>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
