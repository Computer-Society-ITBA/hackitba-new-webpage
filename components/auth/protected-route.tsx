"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import type { UserRole } from "@/lib/firebase/types"
import type { Locale } from "@/lib/i18n/config"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "es"

  useEffect(() => {
    if (loading) return // Don't redirect while loading

    if (!user) {
      router.replace(`/${locale}/auth/login`)
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [user, loading, router, allowedRoles, locale])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-2xl text-brand-cyan neon-glow-cyan">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
