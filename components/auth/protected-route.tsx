"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import type { UserRole } from "@/lib/firebase/types"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }

    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, loading, router, allowedRoles])

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
