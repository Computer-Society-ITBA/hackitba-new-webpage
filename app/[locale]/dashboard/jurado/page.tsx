"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { GanttChart, Star, ClipboardCheck } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

export default function JuradoDashboard() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const { user } = useAuth()

  const [stats, setStats] = useState({ total: 0, scored: 0 })

  useEffect(() => {
    if (!db || !user?.id) return

    // Listen to total finalists
    const totalQuery = query(collection(db, "projects"), where("isFinalist", "==", true))
    const unsubTotal = onSnapshot(totalQuery, (snap) => {
      setStats(prev => ({ ...prev, total: snap.size }))
    })

    // Listen to projects scored by this judge (as judge role)
    const scoredQuery = query(
      collection(db, "projectReviews"),
      where("reviewerId", "==", user.id),
      where("reviewerRole", "==", "judge")
    )
    const unsubScored = onSnapshot(scoredQuery, (snap) => {
      // We want to count unique projects reviewed by this judge
      const uniqueProjects = new Set(snap.docs.map(doc => doc.data().projectId))
      setStats(prev => ({ ...prev, scored: uniqueProjects.size }))
    })

    return () => {
      unsubTotal()
      unsubScored()
    }
  }, [db, user?.id])

  return (
    <ProtectedRoute allowedRoles={["judge", "admin"]}>
      <DashboardLayout title={t.judge.title}>
        <div className="space-y-8">
          <section>
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6">
              {locale === "es" ? `Bienvenido, ${user?.name}` : `Welcome, ${user?.name}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan">
                    <GanttChart size={24} />
                  </div>
                  <div>
                    <h4 className="font-pixel text-lg text-white">{t.dashboard.sidebar.projects}</h4>
                    <p className="text-xs text-brand-cyan/60">
                      {locale === "es" ? "Accedé a la lista completa de proyectos enviados." : "Access the full list of submitted projects."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-brand-cyan/10">
                  <span className="text-sm text-brand-cyan/80 font-pixel">{stats.total} {locale === "es" ? "Proyectos totales" : "Total Projects"}</span>
                  <PixelButton onClick={() => router.push(`/${locale}/dashboard/jurado/proyectos`)} size="sm">
                    {locale === "es" ? "IR A PROYECTOS" : "GO TO PROJECTS"}
                  </PixelButton>
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange">
                    <Star size={24} />
                  </div>
                  <div>
                    <h4 className="font-pixel text-lg text-white">{t.judge.myScores}</h4>
                    <p className="text-xs text-brand-cyan/60">
                      {locale === "es" ? "Revisá y editá tus puntuaciones." : "Review and edit your scores."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-brand-cyan/10 font-pixel text-brand-cyan">
                  <div className="flex flex-col">
                    <span className="text-xs font-pixel">{stats.scored} {locale === "es" ? "Evaluados" : "Scored"}</span>
                    {stats.scored > 0 && (
                      <span className="text-xs font-pixel text-green-400">
                        {Math.round((stats.scored / (stats.total || 1)) * 100)}% COMPLETE
                      </span>
                    )}
                  </div>
                  <PixelButton onClick={() => router.push(`/${locale}/dashboard/jurado/puntajes`)} size="sm">
                    {locale === "es" ? "VER PUNTAJES" : "GO TO SCORES"}
                  </PixelButton>
                </div>
              </GlassCard>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
