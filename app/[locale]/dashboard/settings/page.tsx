"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { useParams, useRouter } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { useAuth } from "@/lib/firebase/auth-context"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, getDoc } from "firebase/firestore"

export default function SettingsPage() {
  const params = useParams()
  const locale = params.locale as Locale
  const router = useRouter()
  const translations = getTranslations(locale)
  const { user, loading } = useAuth()
  const db = getDbClient()

  const [hasRedirected, setHasRedirected] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)

  // Load signup enabled setting
  useEffect(() => {
    if (!db) return
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setSignupEnabled(data?.signupEnabled !== false)
        } else {
          setSignupEnabled(true)
        }
      } catch (err) {
        console.error("Error loading signup setting:", err)
        setSignupEnabled(true)
      }
    }
    loadSettings()
  }, [db])

  // Check onboarding completion and redirect if needed
  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      setHasRedirected(true)
      const onboardingStep = user.onboardingStep || 0

      console.log("SettingsPage - User onboarding step:", onboardingStep, typeof onboardingStep)

      if (Number(onboardingStep) < 2) {
        if (signupEnabled) {
          console.log("Redirecting to event-signup because step < 2")
          router.replace(`/${locale}/auth/event-signup`)
        } else {
          console.log("Signup disabled, redirecting to home")
          router.replace(`/${locale}`)
        }
      }
    }
  }, [user, loading, router, locale, hasRedirected, signupEnabled])

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
