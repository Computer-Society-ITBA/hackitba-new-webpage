"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { Trophy, FileEdit, CheckCircle2, AlertCircle } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { TeamSection } from "@/components/dashboard/team-section"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export default function ParticipanteDashboard() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const { user } = useAuth()

  const [projectStatus, setProjectStatus] = useState<"none" | "draft" | "submitted" | "reviewed" | "disqualified">("none")
  const [showWinners, setShowWinners] = useState(false)

  useEffect(() => {
    if (!db || !user?.team) return
    const unsub = onSnapshot(doc(db, "projects", user.team), (snap) => {
      if (snap.exists()) {
        setProjectStatus(snap.data().status || "submitted")
      } else {
        setProjectStatus("none")
      }
    })
    return () => unsub()
  }, [db, user?.team])

  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setShowWinners(!!snap.data()?.showWinners)
      }
    })
    return () => unsub()
  }, [db])

  const hasTeam = user?.hasTeam === true && user?.team

  return (
    <ProtectedRoute allowedRoles={["participant"]}>
      <DashboardLayout title={t.dashboard.participant.title}>
        <div className="space-y-8">
          {/* Project Status Summary */}
          {hasTeam && (
            <section>
              <h3 className="font-pixel text-2xl text-brand-yellow mb-6">{t.dashboard.participant.myProject}</h3>
              <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-full border",
                    projectStatus === "reviewed" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                      projectStatus === "disqualified" ? "bg-red-500/10 border-red-500/30 text-red-500" :
                        projectStatus === "submitted" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                          projectStatus === "draft" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                            "bg-gray-500/10 border-gray-500/30 text-gray-400"
                  )}>
                    {projectStatus === "reviewed" ? <Trophy size={24} className="text-blue-400" /> :
                      projectStatus === "disqualified" ? <LucideIcons.Ban size={24} className="text-red-500" /> :
                        projectStatus === "submitted" ? <CheckCircle2 size={24} /> :
                          projectStatus === "draft" ? <LucideIcons.Clock size={24} /> :
                            <FileEdit size={24} />}
                  </div>
                  <div>
                    <h4 className="font-pixel text-md text-brand-yellow">
                      {projectStatus === "reviewed" ? (locale === "es" ? "Revisado" : "Reviewed") :
                        projectStatus === "disqualified" ? (locale === "es" ? "Descalificado" : "Disqualified") :
                          projectStatus === "submitted" ? t.dashboard.participant.project.submitted :
                            projectStatus === "draft" ? t.dashboard.participant.project.draft :
                              (locale === "es" ? "Sin proyecto aún" : "No project yet")}
                    </h4>
                    <p className="text-xs text-brand-cyan/60">
                      {projectStatus === "none" ?
                        (locale === "es" ? "Comenzá a subir tu proyecto para que el jurado pueda evaluarlo." : "Start uploading your project so judges can evaluate it.") :
                        (locale === "es" ? "Podés ver los detalles de tu proyecto desde la pestaña correspondiente." : "You can view your project details from the project tab.")}
                    </p>
                  </div>
                </div>
                <PixelButton onClick={() => router.push(`/${locale}/dashboard/participante/proyecto`)}>
                  {projectStatus === "none" ? t.dashboard.participant.project.submit :
                    (projectStatus === "reviewed" || projectStatus === "disqualified") ? (locale === "es" ? "Ver Detalles" : "View Details") :
                      t.dashboard.participant.project.edit}
                </PixelButton>
              </GlassCard>
            </section>
          )}

          {/* Team Section */}
          <section>
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6">{t.dashboard.participant.myTeam}</h3>
            {user?.participationStatus === "rejected" ? (
              <div className="mb-6 p-4 border-2 border-red-500/60 rounded-lg bg-red-500/5">
                <p className="text-red-400 font-pixel font-bold mb-2">
                  {locale === "es" ? "Tu solicitud no fue aceptada" : "Your application was not accepted"}
                </p>
                <p className="text-brand-cyan/80 text-sm">
                  {locale === "es"
                    ? "Lamentablemente tu solicitud de participación fue rechazada. Si tenés alguna consulta contactanos en computersociety@itba.edu.ar"
                    : "Unfortunately your participation request was rejected. If you have any questions, contact us at computersociety@itba.edu.ar"}
                </p>
              </div>
            ) : !hasTeam ? (
              <GlassCard className="mb-6 rounded-lg">
                <p className="text-brand-yellow text-md font-pixel mb-2">
                  {t.dashboard.participant.status.soloTitle}
                </p>
                <p className="text-brand-cyan text-sm mb-4">
                  {t.dashboard.participant.status.soloReady}
                </p>
              </GlassCard>
            ) : null}
            <TeamSection
              userId={user?.id || ""}
              userTeamLabel={user?.team || null}
            />
          </section>

          {/* Winners Section */}
          {showWinners && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h3 className="font-pixel text-2xl text-brand-yellow mb-6">
                {t.dashboard.participant.winners.relive}
              </h3>
              <GlassCard className="p-8 border-brand-yellow/30 bg-brand-yellow/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity translate-x-1/4 -translate-y-1/4 pointer-events-none">
                  <LucideIcons.Trophy size={160} />
                </div>
                <div className="flex flex-col items-center text-center gap-6 relative z-10">
                  <div className="p-4 bg-brand-yellow/20 rounded-full border border-brand-yellow/40">
                    <LucideIcons.Trophy size={48} className="text-brand-yellow" />
                  </div>
                  <div>
                    <h4 className="font-pixel text-2xl text-white mb-3 tracking-wider">
                      {t.dashboard.participant.winners.here}
                    </h4>
                  </div>
                  <PixelButton onClick={() => router.push(`/${locale}/dashboard/winners-reveal`)}>
                    {t.dashboard.participant.winners.view}
                  </PixelButton>
                </div>
              </GlassCard>
            </section>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
