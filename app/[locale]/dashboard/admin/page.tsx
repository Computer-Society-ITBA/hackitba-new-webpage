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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient, getAuthClient } from "@/lib/firebase/client-config"
import { Pencil, Trash2, Plus, Upload, Users as UsersIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
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
  const [pendingParticipants, setPendingParticipants] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [projectSubmissionsEnabled, setProjectSubmissionsEnabled] = useState(true)
  const [signupEnabled, setSignupEnabled] = useState(true)

  const [showEventForm, setShowEventForm] = useState(false)
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [showSpeakerForm, setShowSpeakerForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showScoringForm, setShowScoringForm] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [pendingParticipantId, setPendingParticipantId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [newTeamForm, setNewTeamForm] = useState({
    name: "",
    category: "",
  })

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
      loadPendingParticipants()
      loadTeams()
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
        setSignupEnabled(data?.signupEnabled !== false)
      } else {
        setProjectSubmissionsEnabled(true)
        setSignupEnabled(true)
        await setDoc(
          settingsRef,
          { projectSubmissionsEnabled: true, signupEnabled: true, updatedAt: new Date() },
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
      alert(translations.admin.projectSubmissions.updateError)
    }
  }

  const toggleSignupEnabled = async () => {
    if (!db) return
    const nextValue = !signupEnabled
    setSignupEnabled(nextValue)
    try {
      await setDoc(
        doc(db, "settings", "global"),
        { signupEnabled: nextValue, updatedAt: new Date() },
        { merge: true }
      )
    } catch (error) {
      console.error("Error updating signup setting:", error)
      setSignupEnabled(!nextValue)
      alert(translations.admin.signup.updateError)
    }
  }

  const loadPendingParticipants = async () => {
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) {
        console.error("No auth token available")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      console.log("Fetching pending participants from:", `${apiUrl}/users/pending-participants`)
      
      const response = await fetch(`${apiUrl}/users/pending-participants`, {
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      })

      console.log("Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Pending participants data:", data)
        setPendingParticipants(data.participants || [])
      } else {
        const errorData = await response.text()
        console.error("Error response:", errorData)
      }
    } catch (error) {
      console.error("Error loading pending participants:", error)
    }
  }

  const loadTeams = async () => {
    if (!db) return
    
    try {
      const teamsSnapshot = await getDocs(collection(db, "teams"))
      setTeams(teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Error loading teams:", error)
    }
  }

  const approveParticipant = async (userId: string, teamId: string) => {
    if (!teamId) {
      alert(translations.admin.pendingParticipants.selectTeamError)
      return
    }

    setProcessing(userId)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/users/approve-and-assign-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId,
          teamCode: teamId,
          status: "accepted",
        }),
      })

      if (response.ok) {
        alert(translations.admin.pendingParticipants.approveSuccess)
        loadPendingParticipants()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error approving participant:", error)
      alert(translations.admin.pendingParticipants.approveError)
    } finally {
      setProcessing(null)
    }
  }

  const rejectParticipant = async (userId: string) => {
    const reason = prompt(translations.admin.pendingParticipants.rejectPrompt)
    
    setProcessing(userId)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) return

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/users/approve-and-assign-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId,
          status: "rejected",
          reason: reason || undefined,
        }),
      })

      if (response.ok) {
        alert(translations.admin.pendingParticipants.rejectSuccess)
        loadPendingParticipants()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error rejecting participant:", error)
      alert(translations.admin.pendingParticipants.rejectError)
    } finally {
      setProcessing(null)
    }
  }

  const openCreateTeamModal = (participantId: string | null) => {
    setPendingParticipantId(participantId)
    setNewTeamForm({ name: "", category: "" })
    setShowCreateTeamModal(true)
  }

  const createNewTeam = async () => {
    if (!newTeamForm.name || newTeamForm.name.trim().length < 3) {
      alert(translations.admin.createTeam.nameLengthError)
      return
    }

    if (!newTeamForm.category) {
      alert(translations.admin.createTeam.categoryRequired)
      return
    }

    const categoryIndex = categories.findIndex((category) => category.id === newTeamForm.category)
    if (categoryIndex === -1) {
      alert(translations.admin.createTeam.invalidCategory)
      return
    }

    setProcessing(pendingParticipantId || "team-creation")
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) {
        alert(translations.admin.createTeam.sessionError)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      
      // Crear el equipo vacío (sin admin_id inicial)
      const response = await fetch(`${apiUrl}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: newTeamForm.name.trim(),
          tell_why: translations.admin.createTeam.defaultReason,
          category_1: categoryIndex,
          category_2: null,
          category_3: null,
        }),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setShowCreateTeamModal(false)
        alert(`${translations.admin.createTeam.create} "${newTeamForm.name}" ${translations.admin.createTeam.createSuccess}`)
        
        // Recargar equipos
        await loadTeams()
        
        // Preseleccionar el equipo en el selector si hay participante específico
        if (pendingParticipantId) {
          setTimeout(() => {
            const select = document.getElementById(`team-select-${pendingParticipantId}`) as HTMLSelectElement
            if (select) {
              select.value = newTeam.id
            }
          }, 500)
        }
      } else {
        let errorMessage = translations.admin.createTeam.createError
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText
          }
        }
        alert(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error creating team:", error)
      alert(translations.admin.createTeam.createError)
    } finally {
      setProcessing(null)
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">{translations.admin.projectSubmissions.title}</h3>
            </div>
            <GlassCard>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-brand-cyan font-pixel text-sm">{translations.admin.projectSubmissions.label}</p>
                  <p className="text-brand-cyan/60 text-xs">{translations.admin.projectSubmissions.description}</p>
                </div>
                <button
                  onClick={toggleProjectSubmissions}
                  className={`px-4 py-2 rounded border font-pixel text-xs transition-colors ${
                    projectSubmissionsEnabled
                      ? "border-brand-cyan/60 text-brand-cyan bg-brand-cyan/10"
                      : "border-brand-orange/50 text-brand-orange bg-brand-orange/10"
                  }`}
                >
                  {projectSubmissionsEnabled ? translations.admin.projectSubmissions.enabled : translations.admin.projectSubmissions.disabled}
                </button>
              </div>
            </GlassCard>
            <GlassCard className="mt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-brand-cyan font-pixel text-sm">{translations.admin.signup.label}</p>
                  <p className="text-brand-cyan/60 text-xs">{translations.admin.signup.description}</p>
                </div>
                <button
                  onClick={toggleSignupEnabled}
                  className={`px-4 py-2 rounded border font-pixel text-xs transition-colors ${
                    signupEnabled
                      ? "border-brand-cyan/60 text-brand-cyan bg-brand-cyan/10"
                      : "border-brand-orange/50 text-brand-orange bg-brand-orange/10"
                  }`}
                >
                  {signupEnabled ? translations.admin.projectSubmissions.enabled : translations.admin.projectSubmissions.disabled}
                </button>
              </div>
            </GlassCard>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-6 h-6 text-brand-orange" />
                <h3 className="font-pixel text-2xl text-brand-yellow">{translations.admin.pendingParticipants.title}</h3>
                <span className="bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-sm font-pixel">
                  {pendingParticipants.length}
                </span>
              </div>
              <PixelButton onClick={() => openCreateTeamModal(null)} size="sm" variant="outline">
                <Plus size={16} className="mr-2" />
                {translations.admin.pendingParticipants.createTeam}
              </PixelButton>
            </div>

            {pendingParticipants.length === 0 ? (
              <GlassCard>
                <p className="text-brand-cyan/60 text-center py-8">
                  {translations.admin.pendingParticipants.noParticipants}
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {pendingParticipants.map((participant) => (
                  <GlassCard key={participant.id} neonOnHover>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-pixel text-brand-yellow">
                            {participant.name} {participant.surname}
                          </p>
                        </div>
                        <div className="text-sm text-brand-cyan/80 space-y-1">
                          <p>📧 {participant.email}</p>
                          <p>🎓 {participant.university} - {participant.career}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          id={`team-select-${participant.id}`}
                          className="pixel-select bg-brand-navy/80 border border-brand-cyan/80 text-brand-cyan/80 rounded px-3 py-2"
                          disabled={processing === participant.id}
                        >
                          <option value="">{translations.admin.pendingParticipants.selectTeam}</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>

                        <PixelButton
                          onClick={() => {
                            const select = document.getElementById(`team-select-${participant.id}`) as HTMLSelectElement
                            const teamId = select?.value
                            if (teamId) {
                              approveParticipant(participant.id, teamId)
                            }
                          }}
                          disabled={processing === participant.id}
                          size="sm"
                          variant="primary"
                        >
                          ✓
                        </PixelButton>

                        <PixelButton
                          onClick={() => rejectParticipant(participant.id)}
                          disabled={processing === participant.id}
                          size="sm"
                          variant="primary"
                        >
                          ✗
                        </PixelButton>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
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

        {/* Create Team Modal */}
        <Dialog open={showCreateTeamModal} onOpenChange={setShowCreateTeamModal}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30 px-6 py-5">
            <DialogHeader className="pb-2">
              <DialogTitle className="font-pixel text-brand-yellow">{translations.admin.createTeam.modalTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-2 pb-4">
              <div>
                <Label className="text-brand-cyan">{translations.admin.createTeam.teamName}</Label>
                <Input
                  value={newTeamForm.name}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                  className="mt-2 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                  placeholder={translations.admin.createTeam.teamNamePlaceholder}
                />
              </div>

              <div>
                <Label className="text-brand-cyan">{translations.admin.createTeam.category}</Label>
                <select
                  value={newTeamForm.category}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, category: e.target.value })}
                  className="pixel-select mt-2 w-full bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded px-3 py-2"
                >
                  <option value="">{translations.admin.createTeam.selectCategory}</option>
                  {categories.map((category) => {
                    const displayName = locale === "es" ? category.spanishName : category.englishName
                    return (
                      <option key={category.id} value={category.id}>
                        {displayName}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <PixelButton
                onClick={() => setShowCreateTeamModal(false)}
                variant="outline"
                size="sm"
              >
                {translations.admin.createTeam.cancel}
              </PixelButton>
              <PixelButton
                onClick={createNewTeam}
                disabled={!newTeamForm.name || !newTeamForm.category}
                size="sm"
              >
                {translations.admin.createTeam.create}
              </PixelButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
