"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { Upload, X, CheckCircle2, AlertCircle, Save, MessageSquare, Ban, Trophy, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export default function ParticipanteProyectoPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const storage = getStorageClient()
  const { user, loading } = useAuth()

  const [project, setProject] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [projectSubmissionsLoading, setProjectSubmissionsLoading] = useState(true)
  const [showScoresToTeams, setShowScoresToTeams] = useState(false)
  const [isAutoSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [scoringCriteria, setScoringCriteria] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const router = useRouter()

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    githubRepoUrl: "",
    demoUrl: "",
    images: [] as string[],
    videos: [] as string[],
    status: "draft" as "draft" | "submitted" | "reviewed" | "disqualified"
  })
  const [stageLocks, setStageLocks] = useState({ stage1: false, stage2: false })

  const projectFormRef = useRef(projectForm)
  useEffect(() => {
    projectFormRef.current = projectForm
  }, [projectForm])

  const reviewLocked = projectForm.status === "reviewed" || projectForm.status === "disqualified"
  const stage1Incomplete = !!project?.stage1Incomplete
  const canEditStage1 = projectSubmissionsEnabled && !reviewLocked && !stageLocks.stage1
  const canEditStage2 = projectSubmissionsEnabled && !reviewLocked && !stageLocks.stage2 && !stage1Incomplete
  const canEditAnyStage = canEditStage1 || canEditStage2

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

  // Check onboarding completion
  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      setHasRedirected(true)
      const onboardingStep = user.onboardingStep || 0
      if (Number(onboardingStep) < 2) {
        if (signupEnabled) {
          router.replace(`/${locale}/auth/event-signup`)
        } else {
          router.replace(`/${locale}`)
        }
      }
    }
  }, [user, loading, router, locale, hasRedirected, signupEnabled])

  const loadTeam = useCallback(async () => {
    if (!db || !user) return
    if (user.team) {
      const teamDoc = await getDoc(doc(db, "teams", user.team))
      if (teamDoc.exists()) {
        setTeam({ id: teamDoc.id, ...teamDoc.data() })
      }
      return
    }

    const teamsQuery = query(collection(db, "teams"), where("participantIds", "array-contains", user.id))
    const teamsSnapshot = await getDocs(teamsQuery)
    if (teamsSnapshot.docs.length > 0) {
      setTeam({ id: teamsSnapshot.docs[0].id, ...teamsSnapshot.docs[0].data() })
    } else {
      setLoadingProject(false)
    }
  }, [db, user])

  const loadProject = useCallback(async () => {
    if (!db || !team?.id) return

    const projectDoc = await getDoc(doc(db, "projects", team.id))

    if (projectDoc.exists()) {
      const data = projectDoc.data()
      setProject({ id: projectDoc.id, ...data })
      setStageLocks({ stage1: !!data.stage1Locked, stage2: !!data.stage2Locked })
      setProjectForm({
        title: data.title || "",
        description: data.description || "",
        githubRepoUrl: data.githubRepoUrl || data.repoUrl || "",
        demoUrl: data.demoUrl || "",
        images: data.images || [],
        videos: data.videos || (data.videoUrl ? [data.videoUrl] : []),
        status: data.status || "submitted"
      })
    } else {
      const q = query(collection(db, "projects"), where("teamId", "==", team.id))
      const qSnap = await getDocs(q)
      if (!qSnap.empty) {
        const pDoc = qSnap.docs[0]
        const data = pDoc.data()
        setProject({ id: pDoc.id, ...data })
        setStageLocks({ stage1: !!data.stage1Locked, stage2: !!data.stage2Locked })
        setProjectForm({
          title: data.title || "",
          description: data.description || "",
          githubRepoUrl: data.githubRepoUrl || data.repoUrl || "",
          demoUrl: data.demoUrl || "",
          images: data.images || [],
          videos: data.videos || (data.videoUrl ? [data.videoUrl] : []),
          status: data.status || "submitted"
        })
      }
    }
    setLoadingProject(false)
  }, [db, team?.id])

  useEffect(() => {
    if (!db) return
    const loadGlobalSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setProjectSubmissionsEnabled(data?.projectSubmissionsEnabled !== false)
          setShowScoresToTeams(!!data?.showScoresToTeams)
        }
        const criteriaSnap = await getDocs(query(collection(db, "scoringCriteria")))
        setScoringCriteria(criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } finally {
        setProjectSubmissionsLoading(false)
      }
    }
    loadGlobalSettings()
  }, [db])

  useEffect(() => {
    if (user && db) loadTeam()
  }, [user?.id, db, loadTeam])

  useEffect(() => {
    if (team?.id && db) loadProject()
  }, [team?.id, db, loadProject])

  useEffect(() => {
    if (!db || !team?.id) return
    const qReviews = query(collection(db, "projectReviews"), where("projectId", "==", team.id))
    const unsub = onSnapshot(qReviews, (snap) => {
      setReviews(snap.docs.map(d => d.data()))
    })
    return () => unsub()
  }, [db, team?.id])

  const saveProject = useCallback(async (
    statusOverride?: "draft" | "submitted",
    extraFields?: Record<string, any>
  ) => {
    const isSubmitting = statusOverride === "submitted"
    if (!db || !team?.id || (!canEditAnyStage && !isSubmitting) || loadingProject) return false

    setIsSaving(true)
    try {
      const status = statusOverride || projectFormRef.current.status
      const currentForm = projectFormRef.current

      const payload: any = {
        updatedAt: serverTimestamp(),
        teamId: team.id,
        teamName: team.name || team.id,
        categoryId: team.category_1?.toString() || "",
        status
      }

      if (currentForm.title.trim()) payload.title = currentForm.title
      if (currentForm.description.trim()) payload.description = currentForm.description
      if (currentForm.githubRepoUrl.trim()) payload.githubRepoUrl = currentForm.githubRepoUrl
      if (currentForm.demoUrl.trim()) payload.demoUrl = currentForm.demoUrl
      if (currentForm.images.length > 0) payload.images = currentForm.images
      if (currentForm.videos.length > 0) payload.videos = currentForm.videos

      if (project?.createdAt) {
        payload.createdAt = project.createdAt
      } else {
        payload.createdAt = serverTimestamp()
      }

      if (extraFields) {
        Object.assign(payload, extraFields)
      }

      await setDoc(doc(db, "projects", team.id), payload, { merge: true })

      setProject((prev: any) => ({ ...prev, ...payload, status }))

      if (typeof payload.stage1Locked === "boolean" || typeof payload.stage2Locked === "boolean") {
        setStageLocks((prev) => ({
          stage1: typeof payload.stage1Locked === "boolean" ? payload.stage1Locked : prev.stage1,
          stage2: typeof payload.stage2Locked === "boolean" ? payload.stage2Locked : prev.stage2,
        }))
      }

      setProjectForm(prev => {
        if (prev.status === status) return prev
        return { ...prev, status }
      })

      setLastSaved(new Date())
      return true
    } catch (err) {
      console.error("Error saving project:", err)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [db, team, projectSubmissionsEnabled, project?.createdAt, canEditAnyStage, loadingProject])

  useEffect(() => {
    if (!canEditAnyStage || !team?.id || loadingProject) return
    const timer = setTimeout(() => {
      if (projectForm.status === "draft") saveProject()
    }, 3000)
    return () => clearTimeout(timer)
  }, [projectForm.title, projectForm.description, projectForm.githubRepoUrl, projectForm.demoUrl, projectForm.images, projectForm.videos, projectSubmissionsEnabled, team?.id, saveProject, loadingProject, canEditAnyStage])

  const handleFileUpload = async (file: File): Promise<string> => {
    if (!storage || !team?.id) throw new Error("Upload failed")
    setUploading(true)
    try {
      const storageRef = ref(storage, `projects/${team.id}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      return await getDownloadURL(storageRef)
    } finally {
      setUploading(false)
    }
  }

  const submitStageOne = async () => {
    if (!canEditStage1) return

    const requiredMissing = !projectForm.title.trim() || !projectForm.description.trim() || !projectForm.githubRepoUrl.trim()
    if (requiredMissing) {
      toast({
        title: t.dashboard.participant.toasts.missingFields.title,
        description: t.dashboard.participant.toasts.missingFields.description,
        variant: "destructive",
      })
      return
    }
    const success = await saveProject("draft", {
      stage1Locked: true,
      stage1LockedAt: serverTimestamp(),
    })
    if (success) {
      toast({
        title: locale === "es" ? "Etapa 1 bloqueada" : "Stage 1 locked",
        description: locale === "es" ? "Los datos de la Etapa 1 quedaron enviados y bloqueados." : "Stage 1 details were submitted and locked.",
      })
    } else {
      toast({
        title: locale === "es" ? "Error al enviar" : "Submission failed",
        description: locale === "es" ? "No se pudo actualizar el estado. Intentá de nuevo." : "Could not update project status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const submitStageTwo = async () => {
    if (stage1Incomplete) {
      toast({
        title: locale === "es" ? "Etapa 2 bloqueada" : "Stage 2 blocked",
        description: locale === "es" ? "La Etapa 1 fue marcada como incompleta por admin." : "Stage 1 was marked incomplete by admin.",
        variant: "destructive",
      })
      return
    }

    if (!stageLocks.stage1) {
      toast({
        title: locale === "es" ? "Primero envia Etapa 1" : "Submit Stage 1 first",
        description: locale === "es" ? "Debes bloquear la Etapa 1 antes de enviar la Etapa 2." : "You must lock Stage 1 before submitting Stage 2.",
        variant: "destructive",
      })
      return
    }

    if (!canEditStage2) return

    if (projectForm.videos.length === 0) {
      toast({
        title: locale === "es" ? "Falta el video" : "Video is required",
        description: locale === "es" ? "Subi un video para completar la Etapa 2." : "Upload a video to complete Stage 2.",
        variant: "destructive",
      })
      return
    }

    const success = await saveProject("submitted", {
      stage2Locked: true,
      stage2LockedAt: serverTimestamp(),
    })
    if (success) {
      toast({
        title: locale === "es" ? "¡Etapa 2 enviada!" : "Stage 2 submitted!",
        description: locale === "es" ? "El video del proyecto fue enviado correctamente." : "Project video was submitted successfully.",
      })
    } else {
      toast({
        title: locale === "es" ? "Error al enviar" : "Submission failed",
        description: locale === "es" ? "No se pudo actualizar el estado. Intentá de nuevo." : "Could not update project status. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (projectSubmissionsLoading || loadingProject) {
    return (
      <ProtectedRoute allowedRoles={["participant"]}>
        <DashboardLayout title={t.dashboard.sidebar.myProject}>
          <div className="flex justify-center p-12">
            <div className="animate-pulse font-pixel text-brand-cyan text-sm">
              {locale === "es" ? "CARGANDO PROYECTO..." : "LOADING PROJECT..."}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!projectSubmissionsEnabled && !project) {
    router.replace(`/${locale}/dashboard/participante`)
    return null
  }

  if (!user?.team) {
    return (
      <ProtectedRoute allowedRoles={["participant"]}>
        <DashboardLayout title={t.dashboard.sidebar.myProject}>
          <GlassCard className="p-8 text-center text-sm">
            <p className="text-brand-cyan/60 font-pixel">
              {locale === "es" ? "Necesitás estar en un equipo para enviar un proyecto." : "You need to be on a team to submit a project."}
            </p>
          </GlassCard>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["participant"]}>
      <DashboardLayout title={t.dashboard.sidebar.myProject}>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-pixel uppercase tracking-widest self-start",
              project?.disqualified ? "bg-red-500/10 border-red-500/30 text-red-500" :
                projectForm.status === "reviewed" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                  projectForm.status === "submitted" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                    "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
            )}>
              {project?.disqualified ? <Ban size={14} /> :
                projectForm.status === "reviewed" ? <Trophy size={14} /> :
                  projectForm.status === "submitted" ? <CheckCircle2 size={14} /> :
                    <Clock size={14} />}

              {project?.disqualified ? (locale === "es" ? "Descalificado" : "Disqualified") :
                projectForm.status === "reviewed" ? (locale === "es" ? "Evaluado" : "Evaluated") :
                  projectForm.status === "submitted" ? t.dashboard.participant.project.submitted :
                    t.dashboard.participant.project.draft}
            </div>
            {lastSaved && projectForm.status === "draft" && (
              <span className="text-xs font-pixel text-brand-cyan/40 uppercase tracking-wider flex items-center gap-2">
                <Save size={14} />
                {t.dashboard.participant.project.autoSaved} {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          {showScoresToTeams && reviews.length > 0 && (
            <div className="space-y-6">
              {scoringCriteria.length > 0 && (() => {
                const relevantPhaseReviews = reviews.filter(r =>
                  (project?.isFinalist ? r.reviewerRole === "judge" : r.reviewerRole === "admin") && !r.disqualified
                )
                if (relevantPhaseReviews.length === 0) return null

                return (
                  <GlassCard className="border-brand-yellow/20 bg-brand-yellow/5">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-pixel text-sm text-brand-yellow uppercase flex items-center gap-2">
                          <Trophy size={16} /> {locale === "es" ? "Puntajes del Jurado" : "Judging Scores"}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {scoringCriteria.map((c) => {
                          const avgRaw = relevantPhaseReviews.reduce((sum, r) => sum + (r.rawScores?.[c.id] || 0), 0) / relevantPhaseReviews.length
                          return (
                            <div key={c.id} className="flex flex-col gap-1 bg-black/20 p-3 rounded border border-white/5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-brand-cyan">{c.name}</span>
                                <span className="text-sm font-bold text-brand-yellow">{Math.round(avgRaw * 10) / 10} / 10</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-brand-yellow shadow-[0_0_8px_rgba(250,211,153,0.5)]"
                                  style={{ width: `${(avgRaw / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}

                        <div className="mt-4 pt-4 border-t border-brand-yellow/20 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-pixel text-brand-yellow uppercase">{locale === "es" ? "Puntaje Final" : "Final Score"}</span>
                            <span className="text-xs text-brand-cyan/40">Calculated from {relevantPhaseReviews.length} reviews</span>
                          </div>
                          <div className="text-3xl font-bold text-brand-yellow font-pixel">
                            {Math.round(relevantPhaseReviews.reduce((sum, r) => sum + (r.totalScore || 0), 0) / relevantPhaseReviews.length)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )
              })()}

              {(() => {
                const phaseComments = reviews
                  .filter(r => (project?.isFinalist ? r.reviewerRole === "judge" : r.reviewerRole === "admin"))
                  .map(r => r.comment)
                  .filter(c => c && c.trim())
                if (phaseComments.length === 0) return null

                return (
                  <div className="space-y-3">
                    <h4 className="font-pixel text-xs text-brand-cyan/40 uppercase tracking-widest px-1">
                      {locale === "es" ? "Comentarios de Revisión" : "Reviewer Comments"}
                    </h4>
                    <div className="space-y-4">
                      {phaseComments.map((comment, i) => (
                        <GlassCard key={i} className="border-brand-cyan/20 bg-brand-cyan/5 p-4">
                          <div className="flex gap-4">
                            <MessageSquare className="w-5 h-5 text-brand-cyan/40 shrink-0 mt-1" />
                            <p className="text-sm text-brand-cyan/80 leading-relaxed whitespace-pre-wrap">{comment}</p>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <GlassCard className="p-6">
            <div className="space-y-6">
              <p className="text-xs text-brand-cyan/60 font-pixel uppercase tracking-wider border-b border-brand-cyan/10 pb-4">
                {locale === "es" ? "Etapa 1: Datos del Proyecto" : "Stage 1: Project Details"}
              </p>
              {stageLocks.stage1 && (
                <p className="text-xs text-brand-yellow font-pixel uppercase tracking-wider">
                  {locale === "es" ? "Etapa 1 bloqueada" : "Stage 1 locked"}
                </p>
              )}

              <div>
                <Label className="text-brand-cyan text-sm block mb-2">
                  {t.dashboard.participant.project.title} <span className="text-red-500 font-bold">*</span>
                </Label>
                <Input
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan text-sm"
                  required
                  disabled={!canEditStage1}
                />
              </div>

              <div>
                <Label className="text-brand-cyan text-sm block mb-2">
                  {t.dashboard.participant.project.description} <span className="text-red-500 font-bold">*</span>
                </Label>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan text-sm min-h-[120px] leading-relaxed"
                  required
                  disabled={!canEditStage1}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label className="text-brand-cyan text-sm block mb-2">
                    {t.dashboard.participant.project.repoUrl} <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    value={projectForm.githubRepoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, githubRepoUrl: e.target.value })}
                    className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan text-sm"
                    placeholder={t.dashboard.participant.project.repoPlaceholder}
                    required
                    disabled={!canEditStage1}
                  />
                </div>
                <div>
                  <Label className="text-brand-cyan text-sm block mb-2">{t.dashboard.participant.project.demoUrl}</Label>
                  <Input
                    value={projectForm.demoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                    className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan text-sm"
                    placeholder={t.dashboard.participant.project.demoPlaceholder}
                    disabled={!canEditStage1}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-brand-cyan text-sm block">{t.dashboard.participant.project.uploadImages}</Label>
                <div className="flex flex-wrap gap-3">
                  {projectForm.images.map((url, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-brand-cyan/20" />
                      {canEditStage1 && (
                        <button onClick={() => setProjectForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  {canEditStage1 && (
                    <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-brand-cyan/20 rounded-lg hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-all cursor-pointer">
                      <Upload size={20} className="text-brand-cyan/40" />
                      <span className="text-xs uppercase font-pixel text-brand-cyan/40 mt-1">Add Img</span>
                      <Input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        for (const file of files) {
                          try {
                            const url = await handleFileUpload(file)
                            setProjectForm(prev => ({ ...prev, images: [...prev.images, url] }))
                          } catch (error) {
                            toast({ title: "Upload failed", variant: "destructive" })
                          }
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              {!projectSubmissionsEnabled && <p className="text-brand-orange text-sm font-pixel text-center py-2">{t.dashboard.participant.project.submissionsDisabled}</p>}

              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-brand-cyan/10">
                {projectSubmissionsEnabled && (
                  <>
                    {canEditStage1 && (
                      <PixelButton onClick={() => saveProject()} variant="outline" size="sm" disabled={isAutoSaving || uploading}>
                        <Save size={18} className="mr-2" />
                        {isAutoSaving ? "Saving..." : "Save Draft"}
                      </PixelButton>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <PixelButton variant="primary" size="sm" disabled={uploading || projectSubmissionsLoading || !canEditStage1} className="ml-auto">
                          {locale === "es" ? "Enviar Etapa 1" : "Submit Stage 1"}
                        </PixelButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-pixel text-brand-yellow text-xl">{locale === "es" ? "Enviar Etapa 1" : "Submit Stage 1"}</AlertDialogTitle>
                          <AlertDialogDescription className="text-brand-cyan/80 text-sm leading-relaxed">
                            {locale === "es"
                              ? "Se enviaran titulo, descripcion, repositorio, demo e imagenes."
                              : "Title, description, repository, demo and images will be submitted."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 flex gap-3">
                          <AlertDialogCancel asChild><PixelButton variant="outline" size="sm" className="w-full sm:w-auto">{t.dashboard.participant.project.cancel}</PixelButton></AlertDialogCancel>
                          <AlertDialogAction asChild><PixelButton variant="primary" onClick={submitStageOne} size="sm" className="w-full sm:w-auto">{locale === "es" ? "Confirmar Etapa 1" : "Confirm Stage 1"}</PixelButton></AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="space-y-6">
              <p className="text-xs text-brand-cyan/60 font-pixel uppercase tracking-wider border-b border-brand-cyan/10 pb-4">
                {locale === "es" ? "Etapa 2: Video del Proyecto" : "Stage 2: Project Video"}
              </p>
              {stage1Incomplete && (
                <p className="text-xs text-red-400 font-pixel uppercase tracking-wider">
                  {locale === "es" ? "Etapa 1 incompleta: carga de video bloqueada" : "Stage 1 incomplete: video upload blocked"}
                </p>
              )}
              {stageLocks.stage2 && (
                <p className="text-xs text-brand-yellow font-pixel uppercase tracking-wider">
                  {locale === "es" ? "Etapa 2 bloqueada" : "Stage 2 locked"}
                </p>
              )}

              <div className="space-y-3">
                <Label className="text-brand-cyan text-sm block">{t.dashboard.participant.project.uploadVideo}</Label>
                {projectForm.videos.length > 0 ? (
                  <div className="relative group rounded-lg overflow-hidden border border-brand-cyan/20">
                    <video src={projectForm.videos[0]} controls className="w-full max-h-64 bg-black" />
                    {canEditStage2 && (
                      <button onClick={() => setProjectForm(prev => ({ ...prev, videos: [] }))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    )}
                  </div>
                ) : canEditStage2 && (
                  <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-brand-cyan/20 rounded-lg hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-all cursor-pointer">
                    <Upload size={20} className="text-brand-cyan/40" />
                    <span className="text-xs text-brand-cyan/40 mt-1 uppercase font-pixel">Upload Video</span>
                    <Input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          const url = await handleFileUpload(file)
                          setProjectForm(prev => ({ ...prev, videos: [url] }))
                        } catch (error) {
                          toast({ title: "Upload failed", variant: "destructive" })
                        }
                      }
                    }} />
                  </label>
                )}
              </div>

              {!projectSubmissionsEnabled && <p className="text-brand-orange text-sm font-pixel text-center py-2">{t.dashboard.participant.project.submissionsDisabled}</p>}

              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-brand-cyan/10">
                {projectSubmissionsEnabled && (
                  <>
                    {canEditStage2 && (
                      <PixelButton onClick={() => saveProject()} variant="outline" size="sm" disabled={isAutoSaving || uploading}>
                        <Save size={18} className="mr-2" />
                        {isAutoSaving ? "Saving..." : "Save Draft"}
                      </PixelButton>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <PixelButton variant="primary" size="sm" disabled={uploading || projectSubmissionsLoading || !canEditStage2 || !stageLocks.stage1} className="ml-auto">
                          {locale === "es" ? "Enviar Etapa 2" : "Submit Stage 2"}
                        </PixelButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-pixel text-brand-yellow text-xl">{locale === "es" ? "Enviar Etapa 2" : "Submit Stage 2"}</AlertDialogTitle>
                          <AlertDialogDescription className="text-brand-cyan/80 text-sm leading-relaxed">
                            {locale === "es" ? "Se enviara el video del proyecto." : "Project video will be submitted."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 flex gap-3">
                          <AlertDialogCancel asChild><PixelButton variant="outline" size="sm" className="w-full sm:w-auto">{t.dashboard.participant.project.cancel}</PixelButton></AlertDialogCancel>
                          <AlertDialogAction asChild><PixelButton variant="primary" onClick={submitStageTwo} size="sm" className="w-full sm:w-auto">{locale === "es" ? "Confirmar Etapa 2" : "Confirm Stage 2"}</PixelButton></AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
