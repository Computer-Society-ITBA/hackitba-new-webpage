"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { Progress } from "@/components/ui/progress"
import { Upload, X } from "lucide-react"

export default function ParticipanteDashboard() {
  const { user } = useAuth()
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [project, setProject] = useState<any>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [team, setTeam] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedVideo, setUploadedVideo] = useState<string>("")

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    repoUrl: "",
    demoUrl: "",
    categoryId: "",
  })

  const [profileForm, setProfileForm] = useState({
    company: "",
    bio: "",
    linkedin: "",
    github: "",
    twitter: "",
  })

  useEffect(() => {
    if (user) {
      setOnboardingStep(user.onboardingStep)
      setProfileForm({
        company: user.profile.company || "",
        bio: user.profile.bio || "",
        linkedin: user.profile.linkedin || "",
        github: user.profile.github || "",
        twitter: user.profile.twitter || "",
      })
      loadCategories()
      loadTeam()
      loadProject()
    }
  }, [user])

  const loadCategories = async () => {
    const categoriesSnapshot = await getDocs(collection(db, "categories"))
    const cats = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cats.sort((a, b) => a.order - b.order)
    setCategories(cats)
  }

  const loadTeam = async () => {
    if (!user) return
    const teamsQuery = query(collection(db, "teams"), where("participantIds", "array-contains", user.id))
    const teamsSnapshot = await getDocs(teamsQuery)
    if (teamsSnapshot.docs.length > 0) {
      setTeam({ id: teamsSnapshot.docs[0].id, ...teamsSnapshot.docs[0].data() })
    }
  }

  const loadProject = async () => {
    if (!user) return
    let projectsQuery
    if (team) {
      projectsQuery = query(collection(db, "projects"), where("teamId", "==", team.id))
    } else {
      projectsQuery = query(collection(db, "projects"), where("teamId", "==", user.id))
    }

    const projectsSnapshot = await getDocs(projectsQuery)
    if (projectsSnapshot.docs.length > 0) {
      const projectData = projectsSnapshot.docs[0].data()
      setProject({ id: projectsSnapshot.docs[0].id, ...projectData })
      setProjectForm({
        title: projectData.title || "",
        description: projectData.description || "",
        repoUrl: projectData.repoUrl || "",
        demoUrl: projectData.demoUrl || "",
        categoryId: projectData.categoryId || "",
      })
      setUploadedImages(projectData.images || [])
      setUploadedVideo(projectData.videoUrl || "")
    }
  }

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
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

  const completeOnboarding = async () => {
    if (!user) return

    await updateDoc(doc(db, "users", user.id), {
      onboardingStep: 3,
      profile: {
        ...user.profile,
        ...profileForm,
      },
      updatedAt: new Date(),
    })

    setOnboardingStep(3)
  }

  const submitProject = async () => {
    if (!user) return
    const teamId = team?.id || user.id

    if (project) {
      await updateDoc(doc(db, "projects", project.id), {
        ...projectForm,
        images: uploadedImages,
        videoUrl: uploadedVideo,
        updatedAt: new Date(),
      })
    } else {
      await addDoc(collection(db, "projects"), {
        teamId,
        ...projectForm,
        images: uploadedImages,
        videoUrl: uploadedVideo,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
    }

    setShowProjectForm(false)
    loadProject()
  }

  const deleteProject = async () => {
    if (!project) return
    await deleteDoc(doc(db, "projects", project.id))
    setProject(null)
    setProjectForm({ title: "", description: "", repoUrl: "", demoUrl: "", categoryId: "" })
    setUploadedImages([])
    setUploadedVideo("")
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  if (onboardingStep < 3) {
    return (
      <ProtectedRoute allowedRoles={["participante"]}>
        <DashboardLayout title="Welcome!">
          <div className="max-w-2xl mx-auto">
            <GlassCard>
              <div className="space-y-6">
                <div>
                  <h3 className="font-pixel text-2xl text-brand-yellow mb-4">Complete Your Profile</h3>
                  <Progress value={(onboardingStep / 3) * 100} className="mb-4" />
                  <p className="text-brand-cyan text-sm">Step {onboardingStep + 1} of 3</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Company/University</Label>
                    <Input
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Bio</Label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">LinkedIn</Label>
                    <Input
                      value={profileForm.linkedin}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">GitHub</Label>
                    <Input
                      value={profileForm.github}
                      onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Twitter</Label>
                    <Input
                      value={profileForm.twitter}
                      onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>

                <PixelButton onClick={completeOnboarding} className="w-full">
                  Complete Onboarding
                </PixelButton>
              </div>
            </GlassCard>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["participante"]}>
      <DashboardLayout title="Participant Dashboard">
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">My Project</h3>
              {!project && (
                <PixelButton onClick={() => setShowProjectForm(true)} size="sm">
                  Submit Project
                </PixelButton>
              )}
            </div>

            {showProjectForm || project ? (
              <GlassCard>
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Project Title</Label>
                    <Input
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      disabled={!!project && !showProjectForm}
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Category</Label>
                    <Select
                      value={projectForm.categoryId}
                      onValueChange={(value) => setProjectForm({ ...projectForm, categoryId: value })}
                      disabled={!!project && !showProjectForm}
                    >
                      <SelectTrigger className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Description</Label>
                    <Textarea
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      disabled={!!project && !showProjectForm}
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Repository URL</Label>
                    <Input
                      value={projectForm.repoUrl}
                      onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="https://github.com/..."
                      disabled={!!project && !showProjectForm}
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Demo URL (Optional)</Label>
                    <Input
                      value={projectForm.demoUrl}
                      onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      placeholder="https://..."
                      disabled={!!project && !showProjectForm}
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Project Images</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative w-24 h-24">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Project ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                          {(showProjectForm || !project) && (
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
                    {(showProjectForm || !project) && (
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || [])
                            for (const file of files) {
                              const url = await handleFileUpload(file, "projects")
                              setUploadedImages([...uploadedImages, url])
                            }
                          }}
                        />
                        <PixelButton asChild size="sm" disabled={uploading}>
                          <span>
                            <Upload size={16} className="mr-2" />
                            {uploading ? "Uploading..." : "Upload Images"}
                          </span>
                        </PixelButton>
                      </label>
                    )}
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Project Video (Optional)</Label>
                    {uploadedVideo && (
                      <div className="mb-2">
                        <video src={uploadedVideo} controls className="w-full max-h-64 rounded" />
                        {(showProjectForm || !project) && (
                          <button onClick={() => setUploadedVideo("")} className="text-red-500 text-sm mt-2">
                            Remove Video
                          </button>
                        )}
                      </div>
                    )}
                    {!uploadedVideo && (showProjectForm || !project) && (
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const url = await handleFileUpload(file, "projects")
                              setUploadedVideo(url)
                            }
                          }}
                        />
                        <PixelButton asChild size="sm" disabled={uploading}>
                          <span>
                            <Upload size={16} className="mr-2" />
                            {uploading ? "Uploading..." : "Upload Video"}
                          </span>
                        </PixelButton>
                      </label>
                    )}
                  </div>

                  {project && !showProjectForm ? (
                    <div className="flex gap-3">
                      <PixelButton onClick={() => setShowProjectForm(true)} className="flex-1">
                        Edit Project
                      </PixelButton>
                      <PixelButton onClick={deleteProject} variant="outline" className="text-red-500">
                        Delete
                      </PixelButton>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <PixelButton onClick={submitProject} className="flex-1" disabled={uploading}>
                        {project ? "Update Project" : "Submit Project"}
                      </PixelButton>
                      {project && (
                        <PixelButton onClick={() => setShowProjectForm(false)} variant="outline">
                          Cancel
                        </PixelButton>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            ) : (
              <GlassCard>
                <p className="text-brand-cyan text-center py-8">
                  You haven't submitted a project yet. Click the button above to get started!
                </p>
              </GlassCard>
            )}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
