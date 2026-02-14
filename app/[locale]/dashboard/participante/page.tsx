"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
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
import { collection, getDocs, query, where, updateDoc, doc, getDoc, deleteField } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { Progress } from "@/components/ui/progress"
import { Upload, X } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { TeamSection } from "@/components/dashboard/team-section"
import { toast } from "@/hooks/use-toast"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

export default function ParticipanteDashboard() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const storage = getStorageClient()
  const { user } = useAuth()
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [project, setProject] = useState<any>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [team, setTeam] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedVideo, setUploadedVideo] = useState<string>("")
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [projectSubmissionsLoading, setProjectSubmissionsLoading] = useState(true)
  const hasProjectContent = !!project || uploadedImages.length > 0 || !!uploadedVideo

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    repoUrl: "",
    demoUrl: "",
  })

  const loadCategories = useCallback(async () => {
    if (!db) {
      return
    }

    const categoriesSnapshot = await getDocs(collection(db, "categories"))
    const cats = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[]
    cats.sort((a, b) => (a.order || 0) - (b.order || 0))
    setCategories(cats)
  }, [db])

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
    const teamDoc = await getDoc(doc(db, "teams", team.id))
    if (!teamDoc.exists()) return

    const teamData = teamDoc.data() as any

    const projectData = teamData.project
    if (!projectData) {
      setProject(null)
      setProjectForm({ title: "", description: "", repoUrl: "", demoUrl: "" })
      setUploadedImages([])
      setUploadedVideo("")
      return
    }

    setProject({ id: teamDoc.id, ...projectData })
    setProjectForm({
      title: projectData.title || "",
      description: projectData.description || "",
      repoUrl: projectData.repoUrl || "",
      demoUrl: projectData.demoUrl || "",
    })
    setUploadedImages(projectData.images || [])
    setUploadedVideo(projectData.videoUrl || "")
  }, [db, team?.id])

  const teamCategoryId = useMemo(() => {
    console.log("Calculating team category ID with team data:", team)
    if (!team) return ""
    if (typeof team.category === "number" && team.category >= 0) {
      console.log("Team category from team document:", team.category)
      const category = categories[team.category]
      return category?.id || ""
    }
    return team.categoryId || ""
  }, [team, categories])

  const teamCategoryLabel = useMemo(() => {
    const fallbackLabel = t.dashboard.participant.categoryNotAssigned
    if (!teamCategoryId) return fallbackLabel
    const category = categories.find((item) => item.id === teamCategoryId)
    if (!category) return fallbackLabel
    if (locale === "es") {
      return category.spanishName || category.englishName || category.name || fallbackLabel
    }
    return category.englishName || category.spanishName || category.name || fallbackLabel
  }, [categories, teamCategoryId, t])

  const teamCategoryIconName = useMemo(() => {
    if (!teamCategoryId) return ""
    const category = categories.find((item) => item.id === teamCategoryId)
    return category?.iconName || ""
  }, [categories, teamCategoryId])

  const deleteTitle = t.dashboard.participant.deleteDialog.title
  const deleteDescription = t.dashboard.participant.deleteDialog.description

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (!db) return
    const loadProjectSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setProjectSubmissionsEnabled(data?.projectSubmissionsEnabled !== false)
        } else {
          setProjectSubmissionsEnabled(true)
        }
      } catch (error) {
        console.error("Error loading project submissions setting:", error)
      } finally {
        setProjectSubmissionsLoading(false)
      }
    }

    loadProjectSettings()
  }, [db])

  useEffect(() => {
    if (user && db) {
      loadTeam()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, db])

  useEffect(() => {
    if (team?.id && db) {
      loadProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, db])

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
    if (!storage) {
      throw new Error(t.dashboard.participant.errors.storageNotConfigured)
    }

    setUploading(true)
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      return url
    } finally {
      setUploading(false)
    }
  }

  const submitProject = async () => {
    if (!db || !user) return
    if (!projectSubmissionsEnabled) {
      const { dismiss } = toast({
        title: t.dashboard.participant.toasts.submissionsDisabled.title,
        description: t.dashboard.participant.toasts.submissionsDisabled.description,
        variant: "destructive",
      })
      setTimeout(dismiss, 4000)
      return
    }
    const requiredMissing =
      !projectForm.title.trim() || !projectForm.description.trim() || !projectForm.repoUrl.trim()
    if (requiredMissing) {
      const { dismiss } = toast({
        title: t.dashboard.participant.toasts.missingFields.title,
        description: t.dashboard.participant.toasts.missingFields.description,
        variant: "destructive",
      })
      setTimeout(dismiss, 4000)
      return
    }
    if (!team?.id) {
      const { dismiss } = toast({
        title: t.dashboard.participant.toasts.teamRequired.title,
        description: t.dashboard.participant.toasts.teamRequired.description,
        variant: "destructive",
      })
      setTimeout(dismiss, 4000)
      return
    }

    const now = new Date()
    const submittedAt = project?.submittedAt || team?.project?.submittedAt || now

    await updateDoc(doc(db, "teams", team.id), {
      project: {
        ...projectForm,
        images: uploadedImages,
        videoUrl: uploadedVideo,
        submittedAt,
        updatedAt: now,
      },
      updatedAt: now,
    })

    setShowProjectForm(false)
    loadProject()
  }

  const deleteProject = async () => {
    if (!db || !team?.id) return
    await updateDoc(doc(db, "teams", team.id), {
      project: deleteField(),
      updatedAt: new Date(),
    })
    setProject(null)
    setProjectForm({ title: "", description: "", repoUrl: "", demoUrl: "" })
    setUploadedImages([])
    setUploadedVideo("")
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  const hasTeam = user?.hasTeam === true && user?.team

  return (
    <ProtectedRoute allowedRoles={["participant"]}>
      <DashboardLayout title={t.dashboard.participant.title}>
        <div className="space-y-8">
          {/* Team Section */}
          <section>
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6">{t.dashboard.participant.myTeam}</h3>
            {!hasTeam && user?.teamAssignmentStatus === "in_process" && (
              <div className="mb-6 p-4 border-2 border-brand-orange rounded-lg bg-brand-orange/5">
                <p className="text-brand-orange font-pixel font-bold mb-2">{t.dashboard.participant.teamStatus.inProcess}</p>
                <p className="text-brand-cyan text-sm mb-4">
                  {t.dashboard.participant.teamStatus.inProcessDescription}
                </p>
              </div>
            )}
            {!hasTeam && !user?.teamAssignmentStatus && (
              <div className="mb-6 p-4 border-2 border-brand-orange rounded-lg bg-brand-orange/5">
                <p className="text-brand-orange font-pixel font-bold mb-2">{t.dashboard.participant.teamStatus.noTeam}</p>
                <p className="text-brand-cyan text-sm mb-4">
                  {t.dashboard.participant.teamStatus.noTeamDescription}
                </p>
              </div>
            )}
            <TeamSection 
              userId={user?.id || ""} 
              userTeamLabel={user?.team || null}
              teamAssignmentStatus={user?.teamAssignmentStatus || null}
            />
          </section>

          {(projectSubmissionsEnabled || hasProjectContent) && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">{t.dashboard.participant.myProject}</h3>
            </div>
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
                    disabled={!projectSubmissionsEnabled || (!!project && !showProjectForm)}
                  />
                </div>

                <div>
                  <Label className="text-brand-cyan">
                    {t.dashboard.participant.project.description} <span className="text-red-500">{t.dashboard.participant.project.required}</span>
                  </Label>
                  <Textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    required
                    disabled={!projectSubmissionsEnabled || (!!project && !showProjectForm)}
                  />
                </div>

                <div>
                  <Label className="text-brand-cyan">
                    {t.dashboard.participant.project.repoUrl} <span className="text-red-500">{t.dashboard.participant.project.required}</span>
                  </Label>
                  <Input
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder={t.dashboard.participant.project.repoPlaceholder}
                    required
                    disabled={!projectSubmissionsEnabled || (!!project && !showProjectForm)}
                  />
                </div>

                <div>
                  <Label className="text-brand-cyan">{t.dashboard.participant.project.demoUrl}</Label>
                  <Input
                    value={projectForm.demoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                    className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    placeholder={t.dashboard.participant.project.demoPlaceholder}
                    disabled={!projectSubmissionsEnabled || (!!project && !showProjectForm)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative w-24 h-24">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Project ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                          {projectSubmissionsEnabled && (showProjectForm || !project) && (
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {uploadedVideo && (
                      <div className="mb-2">
                        <video src={uploadedVideo} controls className="w-full max-h-64 rounded" />
                        {projectSubmissionsEnabled && (showProjectForm || !project) && (
                          <button onClick={() => setUploadedVideo("")} className="text-red-500 text-sm mt-2">
                            {t.dashboard.participant.project.removeVideo}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!projectSubmissionsEnabled && (
                  <p className="text-brand-orange text-xs font-pixel">
                    {t.dashboard.participant.project.submissionsDisabled}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {projectSubmissionsEnabled && (showProjectForm || !project) && (
                    <label className="cursor-pointer inline-block">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={!projectSubmissionsEnabled}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          for (const file of files) {
                            const url = await handleFileUpload(file, "projects")
                            setUploadedImages([...uploadedImages, url])
                          }
                        }}
                      />
                      <PixelButton asChild size="sm" disabled={uploading || !projectSubmissionsEnabled}>
                        <span>
                          <Upload size={16} className="mr-2" />
                          {uploading ? t.dashboard.participant.project.uploading : t.dashboard.participant.project.uploadImages}
                        </span>
                      </PixelButton>
                    </label>
                  )}
                  {projectSubmissionsEnabled && !uploadedVideo && (showProjectForm || !project) && (
                    <label className="cursor-pointer inline-block">
                      <Input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={!projectSubmissionsEnabled}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const url = await handleFileUpload(file, "projects")
                            setUploadedVideo(url)
                          }
                        }}
                      />
                      <PixelButton asChild size="sm" disabled={uploading || !projectSubmissionsEnabled}>
                        <span>
                          <Upload size={16} className="mr-2" />
                          {uploading ? t.dashboard.participant.project.uploading : t.dashboard.participant.project.uploadVideo}
                        </span>
                      </PixelButton>
                    </label>
                  )}
                  {!project && (
                    <PixelButton
                      onClick={submitProject}
                      className="ml-auto px-6"
                      disabled={uploading || projectSubmissionsLoading || !projectSubmissionsEnabled}
                    >
                      {t.dashboard.participant.project.submit}
                    </PixelButton>
                  )}
                </div>

                {projectSubmissionsEnabled && project && !showProjectForm ? (
                  <div className="flex w-full justify-end gap-3">
                    <PixelButton onClick={() => setShowProjectForm(true)} className="min-w-[140px] px-4">
                      {t.dashboard.participant.project.edit}
                    </PixelButton>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <PixelButton variant="outline" className="min-w-[120px] px-4 text-red-500">
                          {t.dashboard.participant.project.delete}
                        </PixelButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-pixel text-brand-yellow">
                            {deleteTitle}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-brand-cyan/80">
                            {deleteDescription}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3 items-center justify-center sm:flex-row">
                          <AlertDialogCancel asChild>
                            <PixelButton variant="outline" size="sm">
                              {t.dashboard.participant.project.cancel}
                            </PixelButton>
                          </AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <PixelButton onClick={deleteProject} size="sm" className="bg-red-600 text-white">
                              {t.dashboard.participant.project.delete}
                            </PixelButton>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : null}

                {projectSubmissionsEnabled && project && showProjectForm ? (
                  <div className="flex gap-3">
                    <PixelButton onClick={() => setShowProjectForm(false)} variant="outline">
                      {t.dashboard.participant.project.cancel}
                    </PixelButton>
                    <PixelButton
                      onClick={submitProject}
                      className="px-6"
                      disabled={uploading || projectSubmissionsLoading}
                    >
                      {t.dashboard.participant.project.update}
                    </PixelButton>
                  </div>
                ) : null}
              </div>
            </GlassCard>
          </section>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
