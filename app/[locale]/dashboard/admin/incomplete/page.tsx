"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { getAuthClient } from "@/lib/firebase/client-config"
import { AlertCircle, Clock, UserX, RefreshCw } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import { PaginationControls } from "@/components/ui/pagination-controls"
import type { Locale } from "@/lib/i18n/config"

const PAGE_SIZE = 5

interface IncompleteUser {
  id: string
  name: string | null
  surname: string | null
  email: string | null
  emailVerified: boolean
  onboardingStep: number
  createdAt: string | null
}

export default function IncompleteUsersPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"
  const auth = getAuthClient()

  const [users, setUsers] = useState<IncompleteUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setAuthReady(true)
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    if (authReady) loadIncompleteUsers()
  }, [authReady])

  const loadIncompleteUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) throw new Error("No auth token available")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const url = `${apiUrl}/users/incomplete`
      let response: Response
      try {
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${idToken}` },
        })
      } catch (networkErr: any) {
        throw new Error(`Network error reaching ${url}: ${networkErr.message}`)
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new Error(`HTTP ${response.status} from ${url}: ${body}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPage(1)
    } catch (err: any) {
      setError(err.message || "Error loading incomplete users")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (createdAt: string | null) => {
    if (!createdAt) return "—"
    const d = new Date(createdAt)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString(locale === "es" ? "es-AR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const totalPages = Math.ceil(users.length / PAGE_SIZE)
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const title = locale === "es" ? "Inscripciones Incompletas" : "Incomplete Registrations"

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title={title}>
        <div className="space-y-6">
          {/* Header */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <UserX className="w-6 h-6 text-brand-orange" />
                <div>
                  <h2 className="font-pixel text-sm text-brand-yellow">
                    {locale === "es" ? "Usuarios con registro incompleto" : "Users with incomplete registration"}
                  </h2>

                </div>
              </div>
              <button
                onClick={loadIncompleteUsers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/10 transition-colors font-pixel text-xs disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                {locale === "es" ? "Actualizar" : "Refresh"}
              </button>
            </div>
          </GlassCard>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <GlassCard className="p-6">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-brand-cyan/5 rounded animate-pulse" />
                ))}
              </div>
            </GlassCard>
          )}

          {/* Empty state */}
          {!loading && !error && users.length === 0 && (
            <GlassCard className="p-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <Clock className="w-10 h-10 text-brand-cyan/30" />
                <p className="font-pixel text-sm text-brand-cyan/40 uppercase tracking-widest">
                  {locale === "es" ? "No hay usuarios con registro incompleto" : "No incomplete registrations"}
                </p>
              </div>
            </GlassCard>
          )}

          {/* Users table */}
          {!loading && !error && users.length > 0 && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-pixel text-xs text-brand-cyan uppercase tracking-wider">
                  {users.length} {locale === "es" ? "usuarios" : "users"}
                </h3>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-cyan/10">
                      <th className="text-left py-2 px-3 font-pixel text-xs text-brand-cyan/60 uppercase">
                        {locale === "es" ? "Nombre" : "Name"}
                      </th>
                      <th className="text-left py-2 px-3 font-pixel text-xs text-brand-cyan/60 uppercase">Email</th>
                      <th className="text-left py-2 px-3 font-pixel text-xs text-brand-cyan/60 uppercase">
                        {locale === "es" ? "Mail verificado" : "Email verified"}
                      </th>
                      <th className="text-left py-2 px-3 font-pixel text-xs text-brand-cyan/60 uppercase">
                        {locale === "es" ? "Fecha" : "Date"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-brand-cyan/5 hover:bg-brand-cyan/5 transition-colors">
                        <td className="py-3 px-3 text-white">
                          {user.name || user.surname
                            ? `${user.name ?? ""} ${user.surname ?? ""}`.trim()
                            : <span className="text-brand-cyan/30 italic">{locale === "es" ? "Sin nombre" : "No name"}</span>}
                        </td>
                        <td className="py-3 px-3 text-brand-cyan/80">{user.email ?? "—"}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-pixel border ${
                            user.emailVerified
                              ? "text-green-400 bg-green-500/10 border-green-500/20"
                              : "text-red-400 bg-red-500/10 border-red-500/20"
                          }`}>
                            {user.emailVerified ? (locale === "es" ? "Sí" : "Yes") : (locale === "es" ? "No" : "No")}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-brand-cyan/60 text-xs">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {pagedUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg border border-brand-cyan/10 bg-brand-cyan/5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm font-medium">
                        {user.name || user.surname
                          ? `${user.name ?? ""} ${user.surname ?? ""}`.trim()
                          : <span className="text-brand-cyan/30 italic">{locale === "es" ? "Sin nombre" : "No name"}</span>}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-xs font-pixel border flex-shrink-0 ${
                        user.emailVerified
                          ? "text-green-400 bg-green-500/10 border-green-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}>
                        {user.emailVerified ? (locale === "es" ? "Mail verificado" : "Email verified") : (locale === "es" ? "Mail no verificado" : "Email not verified")}
                      </span>
                    </div>
                    <p className="text-brand-cyan/60 text-xs">{user.email ?? "—"}</p>
                    <p className="text-brand-cyan/40 text-xs">{formatDate(user.createdAt)}</p>
                  </div>
                ))}
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={users.length}
                pageSize={PAGE_SIZE}
                locale={locale}
              />            </GlassCard>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
