"use client"

import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else if (user.role === "jurado") {
        router.push("/dashboard/jurado")
      } else if (user.role === "participante") {
        router.push("/dashboard/participante")
      }
    }
  }, [user, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-2xl text-brand-cyan neon-glow-cyan">Redirecting...</div>
      </div>
    </ProtectedRoute>
  )
}
