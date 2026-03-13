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
      <DashboardLayout locale={locale} translations={t}>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="font-pixel text-3xl text-brand-yellow uppercase mb-2">
              {locale === "es" ? "Panel de Mentor" : "Mentor Dashboard"}
            </h1>
            <p className="text-brand-cyan/70 text-sm">
              {locale === "es" 
                ? "Bienvenido a tu panel de mentor. Aquí puedes ver tu información y actividades." 
                : "Welcome to your mentor panel. Here you can view your information and activities."}
            </p>
          </div>

          {/* Profile Card */}
          <GlassCard className="p-6 border-brand-cyan/20">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-brand-orange" />
              </div>
              <div className="flex-1">
                <p className="font-pixel text-brand-yellow text-lg">{user?.email}</p>
                <p className="text-brand-cyan/70 text-xs mt-1">
                  {locale === "es" ? "Tu correo de mentor" : "Your mentor email"}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-4 border-brand-cyan/20 hover:border-brand-orange/40 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-brand-orange flex-shrink-0 mt-1" />
                <div>
                  <p className="font-pixel text-brand-yellow text-sm">
                    {locale === "es" ? "Tu Perfil" : "Your Profile"}
                  </p>
                  <p className="text-brand-cyan/60 text-xs mt-1">
                    {locale === "es" 
                      ? "Actualiza tu información y foto" 
                      : "Update your information and photo"}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 border-brand-cyan/20 hover:border-brand-orange/40 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand-orange flex-shrink-0 mt-1" />
                <div>
                  <p className="font-pixel text-brand-yellow text-sm">
                    {locale === "es" ? "Evento" : "Event"}
                  </p>
                  <p className="text-brand-cyan/60 text-xs mt-1">
                    {locale === "es" 
                      ? "Información del evento" 
                      : "Event information"}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Info Box */}
          <GlassCard className="p-6 border-brand-yellow/20 bg-brand-yellow/5">
            <p className="font-pixel text-brand-yellow text-sm uppercase mb-2">
              {locale === "es" ? "Información Importante" : "Important Information"}
            </p>
            <p className="text-brand-cyan/70 text-xs leading-relaxed">
              {locale === "es"
                ? "Como mentor, estás contribuyendo a HackITBA. Tu rol es fundamental para guiar y ayudar a los participantes durante el evento."
                : "As a mentor, you are contributing to HackITBA. Your role is fundamental to guiding and helping participants during the event."}
            </p>
          </GlassCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
