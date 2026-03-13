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
import { getAuth } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function ParticipanteDashboard() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const { user, loading } = useAuth()

  const [projectStatus, setProjectStatus] = useState<"none" | "draft" | "submitted" | "reviewed" | "disqualified">("none")
  const [showWinners, setShowWinners] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [projectSubmissionsLoading, setProjectSubmissionsLoading] = useState(true)
  const [showScoresToTeams, setShowScoresToTeams] = useState(false)
  const [resolvedTeamId, setResolvedTeamId] = useState<string | null>(null)
  const [resettingSignup, setResettingSignup] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)

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
        setProjectStatus(snap.data().status || "submitted")
      } else {
        // Fallback 1: Try querying by teamId field (in case ID doesn't match)
        try {
          const q = query(collection(db, "projects"), where("teamId", "==", resolvedTeamId))
          const qSnap = await getDocs(q)
          if (!qSnap.empty) {
            setProjectStatus(qSnap.docs[0].data().status || "submitted")
            return
          }
        } catch (err) {
          console.error("Error querying project by teamId:", err)
        }

        // Fallback 2: check if project exists within the team document (legacy)
        try {
          const teamDoc = await getDoc(doc(db, "teams", resolvedTeamId))
          if (teamDoc.exists() && teamDoc.data().project) {
            setProjectStatus("submitted")
          } else {
            setProjectStatus("none")
          }
        } catch (err) {
          console.error("Error checking legacy project:", err)
          setProjectStatus("none")
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

  const handleOpenResetModal = () => {
    setShowResetConfirmModal(true)
  }

  const confirmResetSignup = async () => {
    if (!user?.id) return

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
      setShowResetConfirmModal(false)
    }
  }

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
                    (!projectSubmissionsEnabled || projectStatus === "reviewed" || projectStatus === "disqualified") ? (locale === "es" ? "Ver Detalles" : "View Details") :
                      t.dashboard.participant.project.edit}
                </PixelButton>
              </GlassCard>
            </section>
          )}

          {/* Team Section */}
          <section>
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6">{t.dashboard.participant.myTeam}</h3>
            <div className="mb-4 flex justify-end">
              <PixelButton onClick={handleOpenResetModal} disabled={resettingSignup} variant="outline">
                {resettingSignup
                  ? (locale === "es" ? "REINICIANDO..." : "RESETTING...")
                  : (locale === "es" ? "CAMBIAR FORMA DE INSCRIPCION" : "CHANGE REGISTRATION MODE")}
              </PixelButton>
            </div>
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

      {/* Reset Signup Confirmation Modal */}
      <Dialog open={showResetConfirmModal} onOpenChange={setShowResetConfirmModal}>
        <DialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan max-w-md">
          <DialogHeader>
            <DialogTitle className="font-pixel text-brand-yellow">
              {locale === "es" ? "Cambiar forma de inscripción" : "Change registration mode"}
            </DialogTitle>
            <DialogDescription className="text-brand-cyan/80 text-sm mt-2">
              {locale === "es"
                ? "Esto te hará volver al formulario de inscripción para cambiar la modalidad. Si estás solo en tu equipo, el equipo se eliminará. ¿Querés continuar?"
                : "This will send you back to event signup to change your registration mode. If you are the only member in your team, the team will be deleted. Continue?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <PixelButton
              onClick={confirmResetSignup}
              disabled={resettingSignup}
              className="flex-1"
            >
              {resettingSignup
                ? (locale === "es" ? "REINICIANDO..." : "RESETTING...")
                : (locale === "es" ? "CONTINUAR" : "CONTINUE")}
            </PixelButton>
            <PixelButton
              onClick={() => setShowResetConfirmModal(false)}
              variant="outline"
              disabled={resettingSignup}
              className="flex-1"
            >
              {locale === "es" ? "CANCELAR" : "CANCEL"}
            </PixelButton>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
