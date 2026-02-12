"use client"

import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { Locale } from "@/lib/i18n/config"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      setHasRedirected(true)
      
      // Check onboarding completion
      const onboardingStep = user.onboardingStep || 0
      
      console.log("Dashboard - User onboarding step:", onboardingStep, typeof onboardingStep)
      console.log("Dashboard - User role:", user.role)
      
      if (Number(onboardingStep) < 2) {
        // Redirect to complete event signup
        console.log("Redirecting to event-signup because step < 2")
        router.replace(`/${locale}/auth/event-signup`)
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
  }, [user, loading, router, locale, hasRedirected])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-2xl text-brand-cyan neon-glow-cyan">Redirecting...</div>
      </div>
    </ProtectedRoute>
  )
}
