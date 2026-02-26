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
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient, getAuthClient } from "@/lib/firebase/client-config"
import { Pencil, Trash2, Plus, Upload } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import { toast } from "@/hooks/use-toast"
import { AdminDataExporter } from "@/components/admin/admin-data-exporter"
import type { Locale } from "@/lib/i18n/config"

export default function AdminDashboard() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "en"
  const translations = getTranslations(locale)
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
    }
  }, [authReady])

  const loadSettings = async () => {
    if (!db) return
    try {
      const settingsRef = doc(db, "settings", "global")
      const settingsDoc = await getDoc(settingsRef)
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setProjectSubmissionsEnabled(data?.projectSubmissionsEnabled !== false)
      } else {
        setProjectSubmissionsEnabled(true)
        await setDoc(
          settingsRef,
          { projectSubmissionsEnabled: true, updatedAt: new Date() },
          { merge: true }
        )
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const toggleProjectSubmissions = async () => {
    if (!db) return
    const nextValue = !projectSubmissionsEnabled
    setProjectSubmissionsEnabled(nextValue)
    try {
      await setDoc(
        doc(db, "settings", "global"),
        { projectSubmissionsEnabled: nextValue, updatedAt: new Date() },
        { merge: true }
      )
    } catch (error) {
      console.error("Error updating project submissions setting:", error)
      setProjectSubmissionsEnabled(!nextValue)
      toast({ title: translations.admin.projectSubmissions.updateError, variant: 'destructive' })
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
    setScoringForm({ name: "", description: "", maxScore: 10, order: 0 })
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

          <section>
            <div className="mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Data Export</h3>
            </div>
            <AdminDataExporter />
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

                  <div>
                    <Label className="text-brand-cyan">Max Score</Label>
                    <Input
                      type="number"
                      value={scoringForm.maxScore}
                      onChange={(e) => setScoringForm({ ...scoringForm, maxScore: Number(e.target.value) })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
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
                      <p className="text-brand-orange text-xs mt-1">Max: {criteria.maxScore}</p>
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
