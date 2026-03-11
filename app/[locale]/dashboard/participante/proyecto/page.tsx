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
import { collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { Upload, X, CheckCircle2, AlertCircle, Save, MessageSquare, Ban } from "lucide-react"
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
  const { user } = useAuth()

  const [project, setProject] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [projectSubmissionsLoading, setProjectSubmissionsLoading] = useState(true)
  const [isAutoSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    githubRepoUrl: "",
    demoUrl: "",
    images: [] as string[],
    videos: [] as string[],
    status: "draft" as "draft" | "submitted" | "reviewed" | "disqualified"
  })

  // Ref to track form changes for auto-save
  const projectFormRef = useRef(projectForm)
  useEffect(() => {
    projectFormRef.current = projectForm
  }, [projectForm])

  const canEdit = projectSubmissionsEnabled && projectForm.status !== "reviewed" && projectForm.status !== "disqualified"

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
    }
  }, [db, user])

  const loadProject = useCallback(async () => {
    if (!db || !team?.id) return

    const projectDoc = await getDoc(doc(db, "projects", team.id))

    if (projectDoc.exists()) {
      const data = projectDoc.data()
      setProject({ id: projectDoc.id, ...data })
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
      // Check migration from team doc
      const teamDoc = await getDoc(doc(db, "teams", team.id))
      const teamData = teamDoc.data() as any
      if (teamData?.project) {
        const p = teamData.project
        const migratedData = {
          title: p.title || "",
          description: p.description || "",
          githubRepoUrl: p.repoUrl || "",
          demoUrl: p.demoUrl || "",
          images: p.images || [],
          videos: p.videoUrl ? [p.videoUrl] : [],
          status: "submitted",
          teamId: team.id,
          teamName: team.name || team.id,
          categoryId: team.category_1?.toString() || "",
          createdAt: p.submittedAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        setProject({ id: team.id, ...migratedData })
        setProjectForm({ ...migratedData, status: "submitted" })
        await setDoc(doc(db, "projects", team.id), migratedData)
      }
    }
  }, [db, team?.id])

  useEffect(() => {
    if (!db) return
    const loadGlobalSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          setProjectSubmissionsEnabled(settingsDoc.data()?.projectSubmissionsEnabled !== false)
        }
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

  const saveProject = useCallback(async (statusOverride?: "draft" | "submitted") => {
    if (!db || !team?.id || !canEdit) return

    setIsSaving(true)
    try {
      const status = statusOverride || projectFormRef.current.status
      const payload = {
        ...projectFormRef.current,
        status,
        teamId: team.id,
        teamName: team.name || team.id,
        categoryId: team.category_1?.toString() || "",
        updatedAt: serverTimestamp(),
        createdAt: project?.createdAt || serverTimestamp(),
      }

      await setDoc(doc(db, "projects", team.id), payload, { merge: true })
      setLastSaved(new Date())
      if (statusOverride) {
        setProjectForm(prev => ({ ...prev, status }))
        setProject((prev: any) => ({ ...prev, ...payload, status }))
      }
    } finally {
      setIsSaving(false)
    }
  }, [db, team, projectSubmissionsEnabled, project?.createdAt])

  // Auto-save logic
  useEffect(() => {
    if (!canEdit || !team?.id) return
    const timer = setTimeout(() => {
      if (projectForm.status === "draft") saveProject()
    }, 3000)
    return () => clearTimeout(timer)
  }, [projectForm, projectSubmissionsEnabled, team?.id, saveProject])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (projectFormRef.current.status === "draft") saveProject()
    }
  }, [saveProject])

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

  const submitProject = async () => {
    const requiredMissing = !projectForm.title.trim() || !projectForm.description.trim() || !projectForm.githubRepoUrl.trim()
    if (requiredMissing) {
      toast({
        title: t.dashboard.participant.toasts.missingFields.title,
        description: t.dashboard.participant.toasts.missingFields.description,
        variant: "destructive",
      })
      return
    }
    await saveProject("submitted")
    toast({
      title: locale === "es" ? "¡Proyecto enviado!" : "Project submitted!",
      description: locale === "es" ? "El jurado ya puede ver tu trabajo." : "Judges can now see your work.",
    })
  }

  const deleteProject = async () => {
    if (!db || !team?.id) return
    await deleteDoc(doc(db, "projects", team.id))
    setProject(null)
    setProjectForm({ title: "", description: "", githubRepoUrl: "", demoUrl: "", images: [], videos: [], status: "draft" })
    toast({ title: locale === "es" ? "Proyecto eliminado" : "Project deleted" })
  }

  if (!user?.team) {
    return (
      <ProtectedRoute allowedRoles={["participant"]}>
        <DashboardLayout title={t.dashboard.sidebar.myProject}>
          <GlassCard className="p-8 text-center">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-2 px-3 rounded-full border text-xs font-pixel",
              projectForm.status === "reviewed" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                projectForm.status === "disqualified" ? "bg-red-500/10 border-red-500/30 text-red-500" :
                  projectForm.status === "submitted" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                    "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
            )}>
              {projectForm.status === "reviewed" ? <CheckCircle2 size={12} className="text-blue-400" /> :
                projectForm.status === "disqualified" ? <Ban size={12} className="text-red-500" /> :
                  projectForm.status === "submitted" ? <CheckCircle2 size={12} /> :
                    <AlertCircle size={12} />}

              {projectForm.status === "reviewed" ? (locale === "es" ? "Revisado" : "Reviewed") :
                projectForm.status === "disqualified" ? (locale === "es" ? "Descalificado" : "Disqualified") :
                  projectForm.status === "submitted" ? t.dashboard.participant.project.submitted :
                    t.dashboard.participant.project.draft}
            </div>
            {lastSaved && projectForm.status === "draft" && (
              <span className="text-xs text-brand-cyan/40 flex items-center gap-1">
                <Save size={10} />
                {t.dashboard.participant.project.autoSaved} {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          {(project?.reviewComment) && (
            <GlassCard className="border-brand-cyan/20 bg-brand-cyan/5">
              <div className="flex gap-3">
                <MessageSquare className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-pixel text-xs text-brand-cyan uppercase">Reviewer Feedback</p>
                  <p className="text-sm text-brand-cyan/80 whitespace-pre-wrap">{project.reviewComment}</p>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <div className="space-y-4">
              <div>
                <Label className="text-brand-cyan">
                  {t.dashboard.participant.project.title} <span className="text-red-500">{t.dashboard.participant.project.required}</span>
                </Label>
                <Input
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                  required
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label className="text-brand-cyan">
                  {t.dashboard.participant.project.description} <span className="text-red-500">{t.dashboard.participant.project.required}</span>
                </Label>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan min-h-[120px]"
                  required
                  disabled={!canEdit}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-brand-cyan">
                    {t.dashboard.participant.project.repoUrl} <span className="text-red-500">{t.dashboard.participant.project.required}</span>
                  </Label>
                  <Input
                    value={projectForm.githubRepoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, githubRepoUrl: e.target.value })}
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder={t.dashboard.participant.project.repoPlaceholder}
                    required
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-brand-cyan">{t.dashboard.participant.project.demoUrl}</Label>
                  <Input
                    value={projectForm.demoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder={t.dashboard.participant.project.demoPlaceholder}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-brand-cyan mb-2 block">{t.dashboard.participant.project.uploadImages}</Label>
                  <div className="flex flex-wrap gap-2">
                    {projectForm.images.map((url, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img src={url} alt="" className="w-full h-full object-cover rounded border border-brand-cyan/20" />
                        {canEdit && (
                          <button onClick={() => setProjectForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={10} /></button>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-brand-cyan/20 rounded hover:border-brand-cyan/40 cursor-pointer">
                        <Upload size={16} className="text-brand-cyan/40" />
                        <Input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          for (const file of files) {
                            const url = await handleFileUpload(file)
                            setProjectForm(prev => ({ ...prev, images: [...prev.images, url] }))
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-brand-cyan mb-2 block">{t.dashboard.participant.project.uploadVideo}</Label>
                  {projectForm.videos.length > 0 ? (
                    <div className="relative group">
                      <video src={projectForm.videos[0]} controls className="w-full max-h-32 rounded border border-brand-cyan/20" />
                      {canEdit && (
                        <button onClick={() => setProjectForm(prev => ({ ...prev, videos: [] }))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={10} /></button>
                      )}
                    </div>
                  ) : canEdit && (
                    <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-brand-cyan/20 rounded hover:border-brand-cyan/40 cursor-pointer">
                      <Upload size={20} className="text-brand-cyan/40" />
                      <span className="text-[10px] text-brand-cyan/40 mt-1">Upload Video</span>
                      <Input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const url = await handleFileUpload(file)
                          setProjectForm(prev => ({ ...prev, videos: [url] }))
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              {!projectSubmissionsEnabled && <p className="text-brand-orange text-xs font-pixel">{t.dashboard.participant.project.submissionsDisabled}</p>}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-brand-cyan/10">
                {projectSubmissionsEnabled && (
                  <>
                    <PixelButton onClick={() => saveProject()} variant="outline" size="sm" disabled={isAutoSaving || uploading}>
                      <Save size={16} className="mr-2" />
                      {isAutoSaving ? "Saving..." : "Save Draft"}
                    </PixelButton>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <PixelButton variant="outline" size="sm" disabled={uploading || projectSubmissionsLoading || !canEdit}>
                          {projectForm.status === "submitted" ? t.dashboard.participant.project.update : t.dashboard.participant.project.submit}
                        </PixelButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-pixel text-brand-yellow">{t.dashboard.participant.project.confirmSubmitTitle}</AlertDialogTitle>
                          <AlertDialogDescription className="text-brand-cyan/80">{t.dashboard.participant.project.confirmSubmitDescription}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild><PixelButton variant="outline" size="sm">{t.dashboard.participant.project.cancel}</PixelButton></AlertDialogCancel>
                          <AlertDialogAction asChild><PixelButton onClick={submitProject} size="sm">{t.dashboard.participant.project.submitConfirmation}</PixelButton></AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* {project && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <PixelButton variant="primary" size="sm" className="ml-auto text-red-500 border-red-500/30">
                            {t.dashboard.participant.project.delete}
                          </PixelButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-pixel text-brand-yellow">{t.dashboard.participant.deleteDialog.title}</AlertDialogTitle>
                            <AlertDialogDescription className="text-brand-cyan/80">{t.dashboard.participant.deleteDialog.description}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild><PixelButton variant="outline" size="sm">Cancel</PixelButton></AlertDialogCancel>
                            <AlertDialogAction asChild><PixelButton onClick={deleteProject} size="sm" className="bg-red-600 text-white">Delete</PixelButton></AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )} */}
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
