"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, query, where, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient, getAuthClient } from "@/lib/firebase/client-config"
import { Pencil, Trash2, Plus, Upload, CheckSquare, UserX, Trophy, FolderKanban } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { AdminDataExporter } from "@/components/admin/admin-data-exporter"
import { AdminManagementTables } from "@/components/admin/admin-management-tables"
import { AdminJudgesMentors } from "@/components/admin/admin-judges-mentors"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const storage = getStorageClient()
  const auth = getAuthClient()
  const [events, setEvents] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [speakers, setSpeakers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [scoringCriteria, setScoringCriteria] = useState<any[]>([])
  const [authReady, setAuthReady] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [showScoresToTeams, setShowScoresToTeams] = useState(false)
  const [judgingStage, setJudgingStage] = useState<"admin" | "judge">("admin")
  const [completeStats, setCompleteStats] = useState<{ complete: number; withTeam: number; withoutTeam: number } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [showEventForm, setShowEventForm] = useState(false)
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [showSpeakerForm, setShowSpeakerForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showScoringForm, setShowScoringForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [scoringForm, setScoringForm] = useState({
    name: "",
    description: "",
    maxScore: 10,
    weight: 1,
    order: 0,
  })

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Auth ready, user:", user.uid)
        setAuthReady(true)
      }
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    if (authReady) {
      loadData()
      loadSettings()
      loadCompleteStats()
    }
  }, [authReady])

  const loadCompleteStats = async () => {
    if (!db) return
    setLoadingStats(true)
    try {
      const completeSnap = await getDocs(
        query(collection(db, "users"), where("onboardingStep", "==", 2), where("role", "==", "participant"))
      )

      const completeParticipants = completeSnap.docs.map((participantDoc) => participantDoc.data())
      const withTeam = completeParticipants.filter((participant) => participant.hasTeam === true).length
      const withoutTeam = completeParticipants.filter((participant) => participant.hasTeam !== true).length

      setCompleteStats({ complete: completeParticipants.length, withTeam, withoutTeam })
    } catch (error) {
      console.error("Error loading complete stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadSettings = async () => {
    if (!db) return
    try {
      const settingsRef = doc(db, "settings", "global")
      const settingsDoc = await getDoc(settingsRef)
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setProjectSubmissionsEnabled(data?.projectSubmissionsEnabled !== false)
        setShowScoresToTeams(!!data?.showScoresToTeams)
        setJudgingStage(data?.judgingStage || "admin")
      } else {
        setProjectSubmissionsEnabled(true)
        setShowScoresToTeams(false)
        setJudgingStage("admin")
        await setDoc(
          settingsRef,
          { projectSubmissionsEnabled: true, showScoresToTeams: false, judgingStage: "admin", updatedAt: new Date() },
          { merge: true }
        )
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const toggleSetting = async (key: string, currentValue: any) => {
    if (!db) return
    const nextValue = !currentValue
    try {
      await setDoc(
        doc(db, "settings", "global"),
        { [key]: nextValue, updatedAt: new Date() },
        { merge: true }
      )
      if (key === "projectSubmissionsEnabled") setProjectSubmissionsEnabled(nextValue)
      if (key === "showScoresToTeams") setShowScoresToTeams(nextValue)
    } catch (error) {
      console.error(`Error updating ${key}:`, error)
      toast({ title: "Update Error", variant: 'destructive' })
    }
  }

  const updateJudgingStage = async (stage: "admin" | "judge") => {
    if (!db) return
    try {
      await setDoc(
        doc(db, "settings", "global"),
        { judgingStage: stage, updatedAt: new Date() },
        { merge: true }
      )
      setJudgingStage(stage)

      toast({
        title: stage === "judge" ? (locale === "es" ? "Fase Jueces Iniciada" : "Judge Phase Started") : (locale === "es" ? "Fase Admins Iniciada" : "Admin Phase Started")
      })
    } catch (error) {
      console.error("Error updating judging stage:", error)
      toast({ title: "Update Error", variant: 'destructive' })
    }
  }

  const loadData = async () => {
    if (!db) {
      return
    }

    const eventsSnapshot = await getDocs(collection(db, "events"))
    setEvents(eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

    const sponsorsSnapshot = await getDocs(collection(db, "sponsors"))
    setSponsors(sponsorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

    const speakersSnapshot = await getDocs(collection(db, "speakers"))
    setSpeakers(speakersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

    const categoriesSnapshot = await getDocs(collection(db, "categories"))
    setCategories(categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

    const scoringSnapshot = await getDocs(collection(db, "scoringCriteria"))
    setScoringCriteria(scoringSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
    if (!storage) {
      throw new Error("Firebase Storage is not configured")
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

  const createScoring = async () => {
    if (!db) {
      return
    }

    await addDoc(collection(db, "scoringCriteria"), {
      ...scoringForm,
      createdAt: new Date(),
    })
    setShowScoringForm(false)
    setScoringForm({ name: "", description: "", maxScore: 10, weight: 1, order: 0 })
    loadData()
  }

  const deleteScoring = async (id: string) => {
    if (!db) {
      return
    }

    await deleteDoc(doc(db, "scoringCriteria", id))
    loadData()
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Admin Dashboard">
        <div className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div onClick={() => toggleSetting("projectSubmissionsEnabled", projectSubmissionsEnabled)} className={cn("transition-transform p-3 rounded-full cursor-pointer", projectSubmissionsEnabled ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                  <LucideIcons.Power size={24} />
                </div>
                <div>
                  <p className="font-pixel text-xs">{t.admin.projectSubmissions.title}</p>
                  <p className={cn("text-xs font-bold", projectSubmissionsEnabled ? "text-green-400" : "text-red-400")}>{projectSubmissionsEnabled ? "ENABLED" : "DISABLED"}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div onClick={() => toggleSetting("showScoresToTeams", showScoresToTeams)} className={cn("transition-transform p-3 rounded-full cursor-pointer", showScoresToTeams ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                  <LucideIcons.Eye size={24} />
                </div>
                <div>
                  <p className="font-pixel text-xs">Show Scores to Teams</p>
                  <p className={cn("text-xs font-bold", showScoresToTeams ? "text-green-400" : "text-red-400")}>{showScoresToTeams ? "VISIBLE" : "HIDDEN"}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex h-full items-center gap-4">
                <div className="flex justify-center h-full flex-col gap-2">
                  <button
                    onClick={() => updateJudgingStage("admin")}
                    className={cn("px-3 py-1 rounded text-[10px] font-pixel border", judgingStage === "admin" ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan" : "border-brand-cyan/20 text-brand-cyan/40")}
                  >ADMINS</button>
                  <button
                    onClick={() => updateJudgingStage("judge")}
                    className={cn("px-3 py-1 rounded text-[10px] font-pixel border", judgingStage === "judge" ? "bg-brand-orange/20 border-brand-orange text-brand-orange" : "border-brand-orange/20 text-brand-orange/40")}
                  >JUDGES</button>
                </div>
                <div>
                  <p className="font-pixel text-xs">Judging Stage</p>
                  <p className="text-xs text-brand-cyan/60 italic">{judgingStage === "admin" ? "Phase 1: Admin Screening" : "Phase 2: Finalist Judging"}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <section>
            <div className="mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Data Export</h3>
            </div>
            <AdminDataExporter />
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <h3 className="font-pixel text-2xl text-brand-yellow">Participants & Teams</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1 rounded-full text-xs font-pixel text-brand-cyan/70">
                  {locale === "es" ? "Insc. completa" : "Complete"}
                  <span className="text-brand-cyan font-bold text-sm">
                    {loadingStats ? "—" : completeStats?.complete ?? "—"}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-xs font-pixel text-green-400/70">
                  {locale === "es" ? "Con equipo" : "With team"}
                  <span className="text-green-400 font-bold text-sm">
                    {loadingStats ? "—" : completeStats?.withTeam ?? "—"}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-xs font-pixel text-red-400/70">
                  {locale === "es" ? "Sin equipo" : "Without team"}
                  <span className="text-red-400 font-bold text-sm">
                    {loadingStats ? "—" : completeStats?.withoutTeam ?? "—"}
                  </span>
                </span>
              </div>
            </div>
            <AdminManagementTables locale={locale} translations={t} />
          </section>

          <section>
            <div className="mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">{locale === "es" ? "Jurados & Mentores" : "Judges & Mentors"}</h3>
            </div>
            <AdminJudgesMentors locale={locale} translations={t} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Scoring Criteria</h3>
              <PixelButton onClick={() => setShowScoringForm(!showScoringForm)} size="sm">
                <Plus size={16} className="mr-2" />
                New Criteria
              </PixelButton>
            </div>

            {showScoringForm && (
              <GlassCard className="mb-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Name</Label>
                    <Input
                      value={scoringForm.name}
                      onChange={(e) => setScoringForm({ ...scoringForm, name: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Description</Label>
                    <Textarea
                      value={scoringForm.description}
                      onChange={(e) => setScoringForm({ ...scoringForm, description: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-brand-cyan">Max Score (Target)</Label>
                      <Input
                        type="number"
                        value={scoringForm.maxScore}
                        onChange={(e) => setScoringForm({ ...scoringForm, maxScore: Number(e.target.value) })}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      />
                    </div>
                    <div>
                      <Label className="text-brand-cyan">Weight Factor</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={scoringForm.weight}
                        onChange={(e) => setScoringForm({ ...scoringForm, weight: Number(e.target.value) })}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Order</Label>
                    <Input
                      type="number"
                      value={scoringForm.order}
                      onChange={(e) => setScoringForm({ ...scoringForm, order: Number(e.target.value) })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <PixelButton onClick={createScoring}>Create Criteria</PixelButton>
                </div>
              </GlassCard>
            )}

            <div className="grid gap-3">
              {scoringCriteria.map((criteria) => (
                <GlassCard key={criteria.id} neonOnHover>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-pixel text-brand-yellow text-sm">{criteria.name}</p>
                      <p className="text-brand-cyan/60 text-xs">{criteria.description}</p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-brand-orange text-[10px]">Scale: 1-10</p>
                        <p className="text-brand-orange text-[10px]">Weight: {criteria.weight || 1}</p>
                        <p className="text-brand-orange text-[10px]">Points: {10 * (criteria.weight || 1)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteScoring(criteria.id)}
                      className="text-brand-cyan hover:text-red-500 transition-colors text-xs"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </div>

      </DashboardLayout>
    </ProtectedRoute>
  )
}
