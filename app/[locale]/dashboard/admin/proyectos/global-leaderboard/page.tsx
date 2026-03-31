"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { collection, onSnapshot } from "firebase/firestore"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getDbClient } from "@/lib/firebase/client-config"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { useCategories } from "@/hooks/use-categories"
import { getCategoryByLegacyIndex } from "@/lib/categories/legacy-category-mapping"

export default function GlobalLeaderboardPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const { categories } = useCategories(locale)

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) return

    const unsub = onSnapshot(collection(db, "projects"), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [db])

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "-"
    const category = getCategoryByLegacyIndex(categories, categoryId)
    return category ? (locale === "es" ? category.spanishName : category.englishName) : "-"
  }

  const rankedData = useMemo(() => {
    const reviewed = projects.filter(p => !p.disqualified && p.status === "reviewed")

    const finalists = reviewed
      .filter(p => p.isFinalist)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

    const rest = reviewed
      .filter(p => !p.isFinalist)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

    return { finalists, rest }
  }, [projects])

  const totalRows = rankedData.finalists.length + rankedData.rest.length

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title={locale === "es" ? "Global Leaderboard" : "Global Leaderboard"}>
        <div className="space-y-6 w-full max-w-full">
          <GlassCard className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-pixel text-lg text-brand-yellow">
                {locale === "es" ? "Global Leaderboard" : "Global Leaderboard"}
              </h3>
              <p className="text-xs text-brand-cyan/50 font-pixel">
                {locale === "es"
                  ? "Finalistas primero, luego el resto de equipos por puntaje."
                  : "Finalists first, then all remaining teams by score."}
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs font-pixel text-brand-cyan animate-pulse">LOADING GLOBAL LEADERBOARD...</div>
            ) : totalRows === 0 ? (
              <div className="p-10 text-center text-xs font-pixel text-brand-cyan/40">
                {locale === "es" ? "No hay proyectos revisados aún." : "No reviewed projects yet."}
              </div>
            ) : (
              <div className="rounded-md border border-brand-cyan/20 overflow-x-auto bg-black/20 w-full max-w-full">
                <Table className="w-full min-w-[700px]">
                  <TableHeader>
                    <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                      <TableHead className="text-brand-cyan w-12 text-center">#</TableHead>
                      <TableHead className="text-brand-cyan">Project</TableHead>
                      <TableHead className="text-brand-cyan">Team</TableHead>
                      <TableHead className="text-brand-cyan">Category</TableHead>
                      <TableHead className="text-brand-orange text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedData.finalists.map((p, index) => (
                      <TableRow key={`f-${p.id}`} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                        <TableCell className="text-brand-cyan/60 text-center font-bold">{index + 1}</TableCell>
                        <TableCell className="font-medium text-brand-cyan max-w-0">
                          <span
                            className="block truncate max-w-[140px] sm:max-w-[260px] md:max-w-[360px]"
                            title={p.title || "Untitled"}
                          >
                            {p.title || "Untitled"}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80 max-w-0">
                          <span
                            className="block truncate max-w-[120px] sm:max-w-[220px] md:max-w-[300px]"
                            title={p.teamName || "-"}
                          >
                            {p.teamName || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">{getCategoryName(p.categoryId)}</TableCell>
                        <TableCell className="text-right font-bold text-brand-orange">{Math.round(p.totalScore || 0)}</TableCell>
                      </TableRow>
                    ))}

                    {rankedData.finalists.length > 0 && rankedData.rest.length > 0 && (
                      <TableRow className="border-brand-cyan/20 bg-brand-navy/40 hover:bg-brand-navy/40">
                        <TableCell colSpan={5} className="py-2">
                          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-brand-cyan/50 font-pixel">
                            <span className="h-px flex-1 bg-brand-cyan/20" />
                            <span>{locale === "es" ? "Resto de equipos" : "Remaining teams"}</span>
                            <span className="h-px flex-1 bg-brand-cyan/20" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {rankedData.rest.map((p, index) => (
                      <TableRow key={`r-${p.id}`} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                        <TableCell className="text-brand-cyan/60 text-center font-bold">{rankedData.finalists.length + index + 1}</TableCell>
                        <TableCell className="font-medium text-brand-cyan max-w-0">
                          <span
                            className="block truncate max-w-[140px] sm:max-w-[260px] md:max-w-[360px]"
                            title={p.title || "Untitled"}
                          >
                            {p.title || "Untitled"}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80 max-w-0">
                          <span
                            className="block truncate max-w-[120px] sm:max-w-[220px] md:max-w-[300px]"
                            title={p.teamName || "-"}
                          >
                            {p.teamName || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">{getCategoryName(p.categoryId)}</TableCell>
                        <TableCell className="text-right font-bold text-brand-orange">{Math.round(p.totalScore || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
