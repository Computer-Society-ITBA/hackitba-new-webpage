"use client"

import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { Locale } from "@/lib/i18n/config"
import { getDbClient } from "@/lib/firebase/client-config"
import { doc, getDoc } from "firebase/firestore"
import { getTranslations } from "@/lib/i18n/get-translations"
import { Loading } from "@/components/ui/loading"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const [hasRedirected, setHasRedirected] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const db = getDbClient()

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

  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      setHasRedirected(true)

      // Check onboarding completion
      const onboardingStep = user.onboardingStep || 0

      console.log("Dashboard - User onboarding step:", onboardingStep, typeof onboardingStep)
      console.log("Dashboard - User role:", user.role)

      if (Number(onboardingStep) < 2) {
        // Redirect to complete event signup only if signup is enabled
        if (signupEnabled) {
          console.log("Redirecting to event-signup because step < 2")
          router.replace(`/${locale}/auth/event-signup`)
        } else {
          console.log("Signup disabled, staying on dashboard")
          // If signup is disabled and incomplete, go to home
          router.replace(`/${locale}`)
        }
        return
      }

      // Redirect to role-specific dashboard
      console.log("Onboarding complete, redirecting to role dashboard")
      if (user.role === "admin") {
        router.replace(`/${locale}/dashboard/admin`)
      } else if (user.role === "judge") {
        router.replace(`/${locale}/dashboard/jurado`)
      } else if (user.role === "participant") {
        router.replace(`/${locale}/dashboard/participante`)
      }
    }
  }, [user, loading, router, locale, hasRedirected, signupEnabled])

  const translations = getTranslations(locale)

  return (
    <ProtectedRoute>
      <Loading text={translations.redirecting} />
    </ProtectedRoute>
  )
}
