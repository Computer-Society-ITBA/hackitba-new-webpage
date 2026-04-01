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
import { Trophy, FileEdit, CheckCircle2, AlertCircle, Ban, Crown, Sparkles } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { TeamSection } from "@/components/dashboard/team-section"
import { RankingsList } from "@/components/dashboard/rankings-list"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"
import { getAuth } from "firebase/auth"
import { toast } from "@/hooks/use-toast"

export default function ParticipanteDashboard() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const { user, loading } = useAuth()

  const [projectStatus, setProjectStatus] = useState<"none" | "draft" | "submitted" | "reviewed" | "disqualified">("none")
  const [isDisqualified, setIsDisqualified] = useState(false)
  const [showWinners, setShowWinners] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [projectSubmissionsLoading, setProjectSubmissionsLoading] = useState(true)
  const [showScoresToTeams, setShowScoresToTeams] = useState(false)
  const [projectHighlights, setProjectHighlights] = useState<{ isFinalist: boolean; isWinner: boolean }>({ isFinalist: false, isWinner: false })
  const [resolvedTeamId, setResolvedTeamId] = useState<string | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [resettingSignup, setResettingSignup] = useState(false)

  // Load signup enabled setting
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

  // Check onboarding completion and redirect if needed
  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      setHasRedirected(true)
      const onboardingStep = user.onboardingStep || 0

      console.log("ParticipanteDashboard - User onboarding step:", onboardingStep, typeof onboardingStep)

      if (Number(onboardingStep) < 2) {
        if (signupEnabled) {
          console.log("Redirecting to event-signup because step < 2")
          router.replace(`/${locale}/auth/event-signup`)
        } else {
          console.log("Signup disabled, redirecting to home")
          router.replace(`/${locale}`)
        }
      }
    }
  }, [user, loading, router, locale, hasRedirected, signupEnabled])

  useEffect(() => {
    if (!db || !user?.id) return

    const resolveTeam = async () => {
      if (user.team) {
        setResolvedTeamId(user.team)
        return
      }

      // Fallback: find team by participantIds if user.team is missing
      try {
        const teamsQuery = query(collection(db, "teams"), where("participantIds", "array-contains", user.id))
        const snapshot = await getDocs(teamsQuery)
        if (!snapshot.empty) {
          setResolvedTeamId(snapshot.docs[0].id)
        } else {
          setResolvedTeamId(null)
        }
      } catch (err) {
        console.error("Error finding team:", err)
      }
    }

    resolveTeam()
  }, [db, user?.id, user?.team])

  useEffect(() => {
    if (!db || !resolvedTeamId) {
      if (!resolvedTeamId) setProjectStatus("none")
      return
    }

    const unsub = onSnapshot(doc(db, "projects", resolvedTeamId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setProjectStatus(data.disqualified ? "disqualified" : (data.status || "submitted"))
        setIsDisqualified(!!data.disqualified)
        setProjectHighlights({
          isFinalist: !!data.isFinalist,
          isWinner: Boolean(data.isWinner || data.winner),
        })
      } else {
        // Fallback 1: Try querying by teamId field (in case ID doesn't match)
        try {
          const q = query(collection(db, "projects"), where("teamId", "==", resolvedTeamId))
          const qSnap = await getDocs(q)
          if (!qSnap.empty) {
            const data = qSnap.docs[0].data()
            setProjectStatus(data.disqualified ? "disqualified" : (data.status || "submitted"))
            setIsDisqualified(!!data.disqualified)
            setProjectHighlights({
              isFinalist: !!data.isFinalist,
              isWinner: Boolean(data.isWinner || data.winner),
            })
            return
          }
        } catch (err) {
          console.error("Error querying project by teamId:", err)
        }

        // Fallback 2: check if project exists within the team document (legacy)
        try {
          const teamDoc = await getDoc(doc(db, "teams", resolvedTeamId))
          const teamData = teamDoc.data()
          if (teamData?.project) {
            setProjectStatus("submitted")
            setIsDisqualified(!!teamData.project.disqualified)
            setProjectHighlights({
              isFinalist: !!teamData.project.isFinalist,
              isWinner: Boolean(teamData.project.isWinner || teamData.project.winner),
            })
          } else {
            setProjectStatus("none")
            setProjectHighlights({ isFinalist: false, isWinner: false })
          }
        } catch (err) {
          console.error("Error checking legacy project:", err)
          setProjectStatus("none")
          setProjectHighlights({ isFinalist: false, isWinner: false })
        }
      }
    }, (error) => {
      console.error("Error listening to project:", error)
    })
    return () => unsub()
  }, [db, resolvedTeamId])

  useEffect(() => {
    // Allow an explicit env override for development/testing convenience.
    const envVal = process.env.NEXT_PUBLIC_PROJECT_SUBMISSIONS_ENABLED
    if (typeof envVal !== "undefined" && envVal !== null && envVal !== "") {
      setProjectSubmissionsEnabled(envVal === "true" || envVal === "1")
      setProjectSubmissionsLoading(false)
      return
    }

    if (!db) {
      // No DB client available (local dev). Default to enabled so the UI is testable.
      setProjectSubmissionsEnabled(true)
      setShowWinners(false)
      setProjectSubmissionsLoading(false)
      return
    }

    const loadGlobalSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setProjectSubmissionsEnabled(data?.projectSubmissionsEnabled !== false)
          setShowWinners(!!data?.showWinners)
          setShowScoresToTeams(!!data?.showScoresToTeams)
        } else {
          setProjectSubmissionsEnabled(true)
          setShowWinners(false)
        }
      } catch (error) {
        console.error("Error loading global settings:", error)
      } finally {
        setProjectSubmissionsLoading(false)
      }
    }

    loadGlobalSettings()
  }, [db])

  const hasTeam = !!resolvedTeamId

  const handleResetSignupFlow = async () => {
    if (!user?.id) return

    const confirmed = window.confirm(
      locale === "es"
        ? "Esto te hará volver al formulario de inscripción para cambiar la modalidad. Si estás solo en tu equipo, el equipo se eliminará. ¿Querés continuar?"
        : "This will send you back to event signup to change your registration mode. If you are the only member in your team, the team will be deleted. Continue?"
    )

    if (!confirmed) return

    setResettingSignup(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      const response = await fetch(`${apiUrl}/users/${user.id}/reset-event-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || (locale === "es" ? "No se pudo reiniciar la inscripción" : "Could not reset signup"))
      }

      toast({
        title: locale === "es" ? "Inscripción reiniciada" : "Signup reset",
        description: locale === "es" ? "Te redirigimos para que vuelvas a elegir la modalidad." : "Redirecting you to choose your registration mode again.",
      })

      router.replace(`/${locale}/auth/event-signup`)
    } catch (error: any) {
      toast({
        title: locale === "es" ? "Error" : "Error",
        description: error?.message || (locale === "es" ? "No se pudo completar la acción" : "Could not complete the action"),
        variant: "destructive",
      })
    } finally {
      setResettingSignup(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["participant"]}>
      <DashboardLayout title={t.dashboard.participant.title}>
        <div className="space-y-8">
          {/* Project Status Summary */}
          {hasTeam && (projectSubmissionsEnabled || projectStatus !== "none") && (
            <section>
              <h3 className="font-pixel text-xs text-brand-cyan/40 uppercase tracking-widest mb-4">
                {t.dashboard.participant.myProject}
              </h3>
              <GlassCard className="p-0 overflow-hidden border-brand-cyan/10">
                <div className="flex flex-col md:flex-row items-stretch">
                  {projectHighlights.isWinner || projectHighlights.isFinalist ? (
                    <div className={cn(
                      "relative overflow-hidden flex-1 p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-6 border border-transparent",
                      projectHighlights.isWinner
                        ? "bg-gradient-to-r from-brand-yellow/15 via-brand-orange/10 to-brand-cyan/10"
                        : "bg-gradient-to-r from-brand-cyan/15 via-brand-blue/10 to-brand-navy/90"
                    )}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_40%)] pointer-events-none" />
                      <div className={cn(
                        "w-full md:w-36 flex items-center justify-center p-6 rounded-2xl border shrink-0",
                        projectHighlights.isWinner
                          ? "bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow"
                          : "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan"
                      )}>
                        {projectHighlights.isWinner ? <Crown size={36} /> : <Sparkles size={36} />}
                      </div>

                      <div className="flex-1 text-center md:text-left space-y-2 relative">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <h4 className={cn(
                            "text-2xl font-bold leading-none",
                            projectHighlights.isWinner ? "text-brand-yellow" : "text-brand-cyan"
                          )}>
                            {projectHighlights.isWinner
                              ? (locale === "es" ? "Ganador" : "Winner")
                              : (locale === "es" ? "Finalista" : "Finalist")}
                          </h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded border text-xs font-pixel tracking-widest uppercase",
                            projectHighlights.isWinner
                              ? "bg-brand-yellow/20 border-brand-yellow/40 text-brand-yellow"
                              : "bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan"
                          )}>
                            {projectHighlights.isWinner
                              ? (locale === "es" ? "Reconocimiento final" : "Final recognition")
                              : (locale === "es" ? "Pasa a la fase final" : "Advances to final phase")}
                          </span>
                        </div>
                        <p className="text-sm text-brand-cyan/70 leading-relaxed max-w-xl">
                          {projectHighlights.isWinner
                            ? (locale === "es"
                              ? "Tu proyecto fue distinguido como ganador. Podés revisar abajo los comentarios y puntajes finales."
                              : "Your project was selected as a winner. You can review the final comments and scores below.")
                            : (locale === "es"
                              ? "Tu proyecto quedó como finalista. Los jurados revisarán la evaluación final en la pestaña de proyecto."
                              : "Your project qualified as a finalist. Judges will handle the final evaluation in the project tab.")}
                        </p>
                      </div>

                      <PixelButton onClick={() => router.push(`/${locale}/dashboard/participante/proyecto`)} className="w-full md:w-auto relative z-10">
                        {locale === "es" ? "VER DETALLES" : "VIEW DETAILS"}
                      </PixelButton>
                    </div>
                  ) : (
                    <>
                      <div className={cn(
                        "w-full md:w-32 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r transition-colors shrink-0",
                        projectStatus === "reviewed" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                          projectStatus === "disqualified" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            projectStatus === "submitted" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                              projectStatus === "draft" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                "bg-gray-500/10 border-gray-500/20 text-brand-cyan/40"
                      )}>
                        {projectStatus === "reviewed" ? <Trophy size={32} /> :
                          projectStatus === "disqualified" ? <Ban size={32} /> :
                            projectStatus === "submitted" ? <CheckCircle2 size={32} /> :
                              projectStatus === "draft" ? <LucideIcons.Clock size={32} /> :
                                <FileEdit size={32} />}
                      </div>

                      <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left space-y-2">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <h4 className="text-xl font-bold text-brand-yellow leading-none">
                              {projectStatus === "reviewed" ? (locale === "es" ? "Evaluado" : "Evaluated") :
                                projectStatus === "disqualified" ? (locale === "es" ? "Descalificado" : "Disqualified") :
                                  projectStatus === "submitted" ? t.dashboard.participant.project.submitted :
                                    projectStatus === "draft" ? t.dashboard.participant.project.draft :
                                      (locale === "es" ? "Pendiente" : "Pending")}
                            </h4>
                            {isDisqualified && (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-xs font-pixel tracking-widest uppercase">
                                Disqualified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-brand-cyan/60 leading-relaxed max-w-sm">
                            {projectStatus === "none" ?
                              (locale === "es" ? "Subí tu proyecto para que el jurado pueda evaluarlo." : "Upload your project so judges can evaluate it.") :
                              (locale === "es" ? "Revisá los detalles en la pestaña de proyecto." : "Check details in the project tab.")}
                          </p>
                        </div>

                        <PixelButton onClick={() => router.push(`/${locale}/dashboard/participante/proyecto`)} className="w-full md:w-auto">
                          {projectStatus === "none" ? t.dashboard.participant.project.submit :
                            (!projectSubmissionsEnabled || projectStatus === "reviewed" || projectStatus === "disqualified") ? (locale === "es" ? "VER DETALLES" : "VIEW DETAILS") :
                              t.dashboard.participant.project.edit}
                        </PixelButton>
                      </div>
                    </>
                  )}
                </div>
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
              userTeamLabel={resolvedTeamId}
            />
          </section>

          {/* Rankings Section */}
          <RankingsList locale={locale} />

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
