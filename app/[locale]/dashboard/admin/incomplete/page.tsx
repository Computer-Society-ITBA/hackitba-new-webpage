"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { getAuthClient } from "@/lib/firebase/client-config"
import { AlertCircle, Clock, UserX, RefreshCw, Mail, SendHorizonal, RotateCcw, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { toast } from "@/hooks/use-toast"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

interface IncompleteUser {
  id: string
  name: string | null
  surname: string | null
  email: string | null
  emailVerified: boolean
  onboardingStep: number
  createdAt: string | null
  incompleteMailCount: number
  incompleteMailLastSent: string | null
}

interface BulkMailLog {
  lastSentAt: string | null
  lastSentCount: number
}

export default function IncompleteUsersPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "es"
  const auth = getAuthClient()

  const [users, setUsers] = useState<IncompleteUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [page, setPage] = useState(1)

  // Bulk mail log
  const [bulkLog, setBulkLog] = useState<BulkMailLog | null>(null)
  const [isSendingAll, setIsSendingAll] = useState(false)

  // Per-user send state
  const [sendingUser, setSendingUser] = useState<Record<string, boolean>>({})

  // Sorting
  type SortKey = "name" | "email" | "emailVerified" | "createdAt" | "incompleteMailCount" | "incompleteMailLastSent"
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "createdAt" || key === "incompleteMailLastSent" || key === "incompleteMailCount" ? "desc" : "asc")
    }
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let aVal: string | number | boolean | null
      let bVal: string | number | boolean | null
      if (sortKey === "name") {
        aVal = `${a.name ?? ""} ${a.surname ?? ""}`.trim().toLowerCase()
        bVal = `${b.name ?? ""} ${b.surname ?? ""}`.trim().toLowerCase()
      } else if (sortKey === "email") {
        aVal = (a.email ?? "").toLowerCase()
        bVal = (b.email ?? "").toLowerCase()
      } else if (sortKey === "emailVerified") {
        aVal = a.emailVerified ? 1 : 0
        bVal = b.emailVerified ? 1 : 0
      } else if (sortKey === "createdAt") {
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
      } else if (sortKey === "incompleteMailCount") {
        aVal = a.incompleteMailCount
        bVal = b.incompleteMailCount
      } else {
        aVal = a.incompleteMailLastSent ? new Date(a.incompleteMailLastSent).getTime() : 0
        bVal = b.incompleteMailLastSent ? new Date(b.incompleteMailLastSent).getTime() : 0
      }
      if (aVal === null || aVal === undefined) aVal = ""
      if (bVal === null || bVal === undefined) bVal = ""
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [users, sortKey, sortDir])

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setAuthReady(true)
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    if (authReady) {
      loadIncompleteUsers(1)
      loadBulkMailLog()
    }
  }, [authReady])

  const getToken = async () => {
    const token = await auth?.currentUser?.getIdToken()
    if (!token) throw new Error("No auth token available")
    return token
  }

  const loadIncompleteUsers = async (targetPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const idToken = await getToken()
      const url = `${apiUrl}/users/incomplete?page=${targetPage}&pageSize=${PAGE_SIZE}`
      const response = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
      if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new Error(`HTTP ${response.status}: ${body}`)
      }
      const data = await response.json()
      setUsers(data.users || [])
      setTotalUsers(data.count ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(data.page ?? targetPage)
    } catch (err: any) {
      setError(err.message || "Error loading incomplete users")
    } finally {
      setLoading(false)
    }
  }

  const loadBulkMailLog = async () => {
    try {
      const idToken = await getToken()
      const res = await fetch(`${apiUrl}/users/incomplete-mail-log`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) setBulkLog(await res.json())
    } catch (_) { /* non-critical */ }
  }

  const handleSendAll = async () => {
    if (isSendingAll) return
    setIsSendingAll(true)
    try {
      const idToken = await getToken()
      const res = await fetch(`${apiUrl}/users/send-incomplete-reminder-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: locale === "es" ? `✓ ${data.sent} emails encolados` : `✓ ${data.sent} emails queued`,
          description: data.failed > 0
            ? (locale === "es" ? `${data.failed} fallaron` : `${data.failed} failed`)
            : undefined,
        })
        await Promise.all([loadIncompleteUsers(1), loadBulkMailLog()])
      } else {
        toast({ title: "Error", description: data.error || "Error sending emails", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Network error", variant: "destructive" })
    } finally {
      setIsSendingAll(false)
    }
  }

  const handleSendOne = async (user: IncompleteUser) => {
    if (sendingUser[user.id]) return
    setSendingUser((prev) => ({ ...prev, [user.id]: true }))
    try {
      const idToken = await getToken()
      const res = await fetch(`${apiUrl}/users/send-incomplete-reminder/${user.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: locale === "es"
            ? `Email enviado a ${user.name || user.email}`
            : `Email sent to ${user.name || user.email}`,
          description: locale === "es" ? `Total enviados: ${data.count}` : `Total sent: ${data.count}`,
        })
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, incompleteMailCount: data.count, incompleteMailLastSent: new Date().toISOString() }
              : u
          )
        )
      } else {
        toast({ title: "Error", description: data.error || "Error sending email", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Network error", variant: "destructive" })
    } finally {
      setSendingUser((prev) => ({ ...prev, [user.id]: false }))
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) return "—"
    const d = new Date(value)
    if (isNaN(d.getTime())) return "—"

    const p = (n: number) => n.toString().padStart(2, "0")
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
  }

  const title = locale === "es" ? "Inscripciones Incompletas" : "Incomplete Registrations"
  const hasBulkMailBeenSent = bulkLog && bulkLog.lastSentAt !== null

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title={title}>
        <div className="space-y-6">

          {/* Header card */}
          <GlassCard className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <UserX className="w-6 h-6 text-brand-orange flex-shrink-0" />
                  <div>
                    <h2 className="font-pixel text-sm text-brand-yellow">
                      {locale === "es" ? "Usuarios con registro incompleto" : "Users with incomplete registration"}
                    </h2>
                    {typeof totalUsers === "number" && totalUsers > 0 && (
                      <p className="text-brand-cyan/50 text-xs mt-0.5 font-montserrat">
                        {totalUsers} {locale === "es" ? "usuarios" : "users"}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { loadIncompleteUsers(1); loadBulkMailLog(); }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/10 transition-colors font-pixel text-xs disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  {locale === "es" ? "Actualizar" : "Refresh"}
                </button>
              </div>

              {/* Bulk mail action strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-brand-cyan/10">
                <div className="flex gap-3 flex-wrap">
                  {/* First-time send */}
                  {!hasBulkMailBeenSent && (
                    <button
                      onClick={handleSendAll}
                      disabled={isSendingAll || loading || totalUsers === 0}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded font-pixel text-xs transition-colors",
                        "bg-brand-orange/20 text-brand-orange border border-brand-orange/40",
                        "hover:bg-brand-orange/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isSendingAll
                        ? <RefreshCw size={13} className="animate-spin" />
                        : <SendHorizonal size={13} />}
                      {isSendingAll
                        ? (locale === "es" ? "Enviando..." : "Sending...")
                        : (locale === "es" ? "Enviar a todos" : "Send to all")}
                    </button>
                  )}

                  {/* Resend button */}
                  {hasBulkMailBeenSent && (
                    <button
                      onClick={handleSendAll}
                      disabled={isSendingAll || loading || totalUsers === 0}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded font-pixel text-xs transition-colors",
                        "bg-blue-600/20 text-blue-300 border border-blue-500/40",
                        "hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isSendingAll
                        ? <RefreshCw size={13} className="animate-spin" />
                        : <RotateCcw size={13} />}
                      {isSendingAll
                        ? (locale === "es" ? "Reenviando..." : "Resending...")
                        : (locale === "es" ? "Reenviar a todos" : "Resend to all")}
                    </button>
                  )}
                </div>

                {/* Last bulk send info */}
                {bulkLog?.lastSentAt && (
                  <div className="flex items-center gap-2 text-xs text-brand-cyan/50 font-montserrat">
                    <Mail size={12} className="text-brand-cyan/40 flex-shrink-0" />
                    <span>
                      {locale === "es" ? "Último envío masivo:" : "Last bulk send:"}
                      {" "}
                      <span className="text-brand-cyan/80">{formatDate(bulkLog.lastSentAt)}</span>
                      {" — "}
                      <span className="text-brand-cyan/80">
                        {bulkLog.lastSentCount} {locale === "es" ? "enviados" : "sent"}
                      </span>
                    </span>
                  </div>
                )}
                {bulkLog && !bulkLog.lastSentAt && (
                  <p className="text-xs text-brand-cyan/40 font-montserrat italic">
                    {locale === "es" ? "Nunca se envió un mail masivo" : "No bulk email has been sent yet"}
                  </p>
                )}
              </div>
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
          {!loading && !error && totalUsers === 0 && (
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
          {!loading && !error && totalUsers > 0 && (
            <GlassCard className="p-6">

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-cyan/10">
                      {([
                        { key: "name" as const, label: locale === "es" ? "Nombre" : "Name", align: "left" },
                        { key: "email" as const, label: "Email", align: "left" },
                        { key: "emailVerified" as const, label: locale === "es" ? "Mail verificado" : "Email verified", align: "left" },
                        { key: "createdAt" as const, label: locale === "es" ? "Registro" : "Date", align: "left" },
                        { key: "incompleteMailCount" as const, label: locale === "es" ? "Mails env." : "Mails sent", align: "center" },
                        { key: "incompleteMailLastSent" as const, label: locale === "es" ? "Último mail" : "Last mail", align: "left" },
                      ] as { key: "name" | "email" | "emailVerified" | "createdAt" | "incompleteMailCount" | "incompleteMailLastSent"; label: string; align: string }[]).map(({ key, label, align }) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          className={cn(
                            "py-2 px-3 font-pixel text-xs text-brand-cyan/60 uppercase cursor-pointer select-none",
                            "hover:text-brand-cyan transition-colors group",
                            align === "center" ? "text-center" : "text-left"
                          )}
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {sortKey === key
                              ? sortDir === "asc"
                                ? <ChevronUp size={11} className="text-brand-cyan" />
                                : <ChevronDown size={11} className="text-brand-cyan" />
                              : <ChevronsUpDown size={11} className="text-brand-cyan/20 group-hover:text-brand-cyan/50" />}
                          </span>
                        </th>
                      ))}
                      <th className="text-center py-2 px-3 font-pixel text-xs text-brand-cyan/60 uppercase">
                        {locale === "es" ? "Acción" : "Action"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-brand-cyan/5 hover:bg-brand-cyan/5 transition-colors">
                        <td className="py-3 px-3 text-white">
                          {user.name || user.surname
                            ? `${user.name ?? ""} ${user.surname ?? ""}`.trim()
                            : <span className="text-brand-cyan/30 italic">{locale === "es" ? "Sin nombre" : "No name"}</span>}
                        </td>
                        <td className="py-3 px-3 text-brand-cyan/80 text-xs">{user.email ?? "—"}</td>
                        <td className="py-3 px-3">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-pixel border",
                            user.emailVerified
                              ? "text-green-400 bg-green-500/10 border-green-500/20"
                              : "text-red-400 bg-red-500/10 border-red-500/20"
                          )}>
                            {user.emailVerified ? (locale === "es" ? "Sí" : "Yes") : (locale === "es" ? "No" : "No")}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-brand-cyan/60 text-xs">{formatDate(user.createdAt)}</td>
                        <td className="py-3 px-3 text-center">
                          {user.incompleteMailCount > 0 ? (
                            <span className="px-2 py-1 rounded-full text-xs font-pixel bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                              {user.incompleteMailCount}
                            </span>
                          ) : (
                            <span className="text-brand-cyan/30 text-xs">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-brand-cyan/50 text-xs">
                          {formatDate(user.incompleteMailLastSent)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleSendOne(user)}
                            disabled={!!sendingUser[user.id] || !user.email}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded font-pixel text-[10px] transition-colors mx-auto",
                              "bg-blue-600/20 text-blue-300 border border-blue-500/30",
                              "hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            {sendingUser[user.id]
                              ? <RefreshCw size={11} className="animate-spin" />
                              : <Mail size={11} />}
                            {sendingUser[user.id]
                              ? "..."
                              : user.incompleteMailCount > 0
                                ? (locale === "es" ? "Reenviar" : "Resend")
                                : (locale === "es" ? "Enviar" : "Send")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {sortedUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg border border-brand-cyan/10 bg-brand-cyan/5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm font-medium">
                        {user.name || user.surname
                          ? `${user.name ?? ""} ${user.surname ?? ""}`.trim()
                          : <span className="text-brand-cyan/30 italic">{locale === "es" ? "Sin nombre" : "No name"}</span>}
                      </p>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-pixel border flex-shrink-0",
                        user.emailVerified
                          ? "text-green-400 bg-green-500/10 border-green-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                      )}>
                        {user.emailVerified
                          ? (locale === "es" ? "Verificado" : "Verified")
                          : (locale === "es" ? "No verificado" : "Not verified")}
                      </span>
                    </div>
                    <p className="text-brand-cyan/60 text-xs">{user.email ?? "—"}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-brand-cyan/40 text-xs">{formatDate(user.createdAt)}</p>
                        <div className="flex items-center gap-1.5 text-xs text-brand-cyan/50">
                          <Mail size={10} />
                          <span>
                            {locale === "es" ? "Mails:" : "Mails:"}{" "}
                            <span className={user.incompleteMailCount > 0 ? "text-brand-orange font-bold" : "text-brand-cyan/40"}>
                              {user.incompleteMailCount}
                            </span>
                          </span>
                          {user.incompleteMailLastSent && (
                            <span className="text-brand-cyan/30">
                              · {locale === "es" ? "Último:" : "Last:"} {formatDate(user.incompleteMailLastSent)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendOne(user)}
                        disabled={!!sendingUser[user.id] || !user.email}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded font-pixel text-[10px] transition-colors flex-shrink-0",
                          "bg-blue-600/20 text-blue-300 border border-blue-500/30",
                          "hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {sendingUser[user.id]
                          ? <RefreshCw size={11} className="animate-spin" />
                          : <Mail size={11} />}
                        {user.incompleteMailCount > 0
                          ? (locale === "es" ? "Reenviar" : "Resend")
                          : (locale === "es" ? "Enviar" : "Send")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => loadIncompleteUsers(p)}
                totalItems={totalUsers}
                pageSize={PAGE_SIZE}
                locale={locale}
              />
            </GlassCard>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
