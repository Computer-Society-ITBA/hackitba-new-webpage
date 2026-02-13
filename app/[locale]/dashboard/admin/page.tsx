"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient, getAuthClient } from "@/lib/firebase/client-config"
import { Pencil, Trash2, Plus, Upload, Users as UsersIcon } from "lucide-react"

export default function AdminDashboard() {
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

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    location: "",
    status: "draft",
  })

  const [sponsorForm, setSponsorForm] = useState({
    name: "",
    logo: "",
    website: "",
    tier: "bronze",
    order: 0,
  })

  const [speakerForm, setSpeakerForm] = useState({
    name: "",
    title: "",
    company: "",
    bio: "",
    avatar: "",
    linkedin: "",
    order: 0,
  })

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
    details: "",
    order: 0,
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
    }
  }, [authReady])

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
      alert("Por favor selecciona un equipo")
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
        alert("Participante aprobado y asignado exitosamente")
        loadPendingParticipants()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error approving participant:", error)
      alert("Error al aprobar participante")
    } finally {
      setProcessing(null)
    }
  }

  const rejectParticipant = async (userId: string) => {
    const reason = prompt("Razón del rechazo (opcional):")
    
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
        alert("Participante rechazado")
        loadPendingParticipants()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error rejecting participant:", error)
      alert("Error al rechazar participante")
    } finally {
      setProcessing(null)
    }
  }

  const openCreateTeamModal = (participantId: string) => {
    setPendingParticipantId(participantId)
    setNewTeamForm({ name: "", category: "" })
    setShowCreateTeamModal(true)
  }

  const createNewTeam = async () => {
    if (!newTeamForm.name || newTeamForm.name.trim().length < 3) {
      alert("El nombre debe tener al menos 3 caracteres")
      return
    }

    if (!newTeamForm.category) {
      alert("Debe seleccionar una categoría")
      return
    }

    if (!pendingParticipantId) return

    setProcessing(pendingParticipantId)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) return

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
          tell_why: "Equipo creado por administrador",
          category_1: newTeamForm.category,
          category_2: null,
          category_3: null,
          uid: "admin-created", // Temporal, será reemplazado por el primer participante
        }),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setShowCreateTeamModal(false)
        alert(`Equipo "${newTeamForm.name}" creado exitosamente`)
        
        // Recargar equipos
        await loadTeams()
        
        // Preseleccionar el equipo en el selector
        setTimeout(() => {
          const select = document.getElementById(`team-select-${pendingParticipantId}`) as HTMLSelectElement
          if (select) {
            select.value = newTeam.id
          }
        }, 500)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error creating team:", error)
      alert("Error al crear equipo")
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

  const createEvent = async () => {
    if (!db) {
      return
    }

    await addDoc(collection(db, "events"), {
      ...eventForm,
      startDate: new Date(eventForm.startDate),
      endDate: new Date(eventForm.endDate),
      submissionDeadline: new Date(eventForm.submissionDeadline),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    setShowEventForm(false)
    setEventForm({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      submissionDeadline: "",
      location: "",
      status: "draft",
    })
    loadData()
  }

  const createSponsor = async () => {
    if (!db) {
      return
    }

    await addDoc(collection(db, "sponsors"), {
      ...sponsorForm,
      createdAt: new Date(),
    })
    setShowSponsorForm(false)
    setSponsorForm({ name: "", logo: "", website: "", tier: "bronze", order: 0 })
    loadData()
  }

  const createSpeaker = async () => {
    if (!db) {
      return
    }

    await addDoc(collection(db, "speakers"), {
      ...speakerForm,
      createdAt: new Date(),
    })
    setShowSpeakerForm(false)
    setSpeakerForm({ name: "", title: "", company: "", bio: "", avatar: "", linkedin: "", order: 0 })
    loadData()
  }

  const createCategory = async () => {
    if (!db) {
      return
    }

    await addDoc(collection(db, "categories"), {
      ...categoryForm,
      createdAt: new Date(),
    })
    setShowCategoryForm(false)
    setCategoryForm({ name: "", description: "", icon: "", details: "", order: 0 })
    loadData()
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

  const deleteEvent = async (id: string) => {
    if (!db) {
      return
    }

    await deleteDoc(doc(db, "events", id))
    loadData()
  }

  const deleteSponsor = async (id: string) => {
    if (!db) {
      return
    }

    await deleteDoc(doc(db, "sponsors", id))
    loadData()
  }

  const deleteSpeaker = async (id: string) => {
    if (!db) {
      return
    }

    await deleteDoc(doc(db, "speakers", id))
    loadData()
  }

  const deleteCategory = async (id: string) => {
    if (!db) {
      return
    }

    await deleteDoc(doc(db, "categories", id))
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
          {/* Pending Participants Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-6 h-6 text-brand-orange" />
                <h3 className="font-pixel text-2xl text-brand-yellow">Participantes Pendientes</h3>
                <span className="bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-sm font-pixel">
                  {pendingParticipants.length}
                </span>
              </div>
            </div>

            {pendingParticipants.length === 0 ? (
              <GlassCard>
                <p className="text-brand-cyan/60 text-center py-8">
                  No hay participantes pendientes de aprobación
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
                          <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-1 rounded">
                            En Proceso
                          </span>
                        </div>
                        <div className="text-sm text-brand-cyan/80 space-y-1">
                          <p>📧 {participant.email}</p>
                          <p>🎓 {participant.university} - {participant.career}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          id={`team-select-${participant.id}`}
                          className="bg-brand-navy/80 border border-brand-cyan/30 text-brand-cyan rounded px-3 py-2 text-sm"
                          disabled={processing === participant.id}
                        >
                          <option value="">Seleccionar equipo...</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => openCreateTeamModal(participant.id)}
                          disabled={processing === participant.id}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50"
                          title="Crear nuevo equipo"
                        >
                          +
                        </button>

                        <button
                          onClick={() => {
                            const select = document.getElementById(`team-select-${participant.id}`) as HTMLSelectElement
                            const teamId = select?.value
                            if (teamId) {
                              approveParticipant(participant.id, teamId)
                            }
                          }}
                          disabled={processing === participant.id}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                        >
                          {processing === participant.id ? "..." : "✓"}
                        </button>

                        <button
                          onClick={() => rejectParticipant(participant.id)}
                          disabled={processing === participant.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50"
                        >
                          {processing === participant.id ? "..." : "✗"}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Events</h3>
              <PixelButton onClick={() => setShowEventForm(!showEventForm)} size="sm">
                <Plus size={16} className="mr-2" />
                New Event
              </PixelButton>
            </div>

            {showEventForm && (
              <GlassCard className="mb-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Title</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Description</Label>
                    <Textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-brand-cyan">Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      />
                    </div>

                    <div>
                      <Label className="text-brand-cyan">End Date</Label>
                      <Input
                        type="datetime-local"
                        value={eventForm.endDate}
                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Submission Deadline</Label>
                    <Input
                      type="datetime-local"
                      value={eventForm.submissionDeadline}
                      onChange={(e) => setEventForm({ ...eventForm, submissionDeadline: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Location</Label>
                    <Input
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <PixelButton onClick={createEvent} disabled={uploading}>
                    Create Event
                  </PixelButton>
                </div>
              </GlassCard>
            )}

            <div className="grid gap-4">
              {events.map((event) => (
                <GlassCard key={event.id} neonOnHover>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-pixel text-lg text-brand-yellow mb-2">{event.title}</h4>
                      <p className="text-brand-cyan text-sm mb-2">{event.description}</p>
                      <p className="text-brand-cyan/60 text-xs">
                        {event.location} • {event.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-brand-cyan hover:text-brand-orange transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-brand-cyan hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Categories</h3>
              <PixelButton onClick={() => setShowCategoryForm(!showCategoryForm)} size="sm">
                <Plus size={16} className="mr-2" />
                New Category
              </PixelButton>
            </div>

            {showCategoryForm && (
              <GlassCard className="mb-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Name</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Description</Label>
                    <Input
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Details</Label>
                    <Textarea
                      value={categoryForm.details}
                      onChange={(e) => setCategoryForm({ ...categoryForm, details: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Icon (lucide icon name, e.g. "Globe")</Label>
                    <Input
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Order</Label>
                    <Input
                      type="number"
                      value={categoryForm.order}
                      onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <PixelButton onClick={createCategory}>Create Category</PixelButton>
                </div>
              </GlassCard>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <GlassCard key={category.id} neonOnHover>
                  <div className="space-y-2">
                    <p className="font-pixel text-brand-yellow text-sm">{category.name}</p>
                    <p className="text-brand-cyan/60 text-xs">{category.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="text-brand-cyan hover:text-red-500 transition-colors text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
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

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Sponsors</h3>
              <PixelButton onClick={() => setShowSponsorForm(!showSponsorForm)} size="sm">
                <Plus size={16} className="mr-2" />
                New Sponsor
              </PixelButton>
            </div>

            {showSponsorForm && (
              <GlassCard className="mb-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Name</Label>
                    <Input
                      value={sponsorForm.name}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Logo URL or Upload</Label>
                    <div className="flex gap-2">
                      <Input
                        value={sponsorForm.logo}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, logo: e.target.value })}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan flex-1"
                        placeholder="https://... or upload file"
                      />
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const url = await handleFileUpload(file, "sponsors")
                              setSponsorForm({ ...sponsorForm, logo: url })
                            }
                          }}
                        />
                        <PixelButton asChild size="sm" disabled={uploading}>
                          <span>
                            <Upload size={16} />
                          </span>
                        </PixelButton>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Website</Label>
                    <Input
                      value={sponsorForm.website}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, website: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <PixelButton onClick={createSponsor} disabled={uploading}>
                    {uploading ? "Uploading..." : "Create Sponsor"}
                  </PixelButton>
                </div>
              </GlassCard>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sponsors.map((sponsor) => (
                <GlassCard key={sponsor.id} neonOnHover>
                  <div className="space-y-2">
                    <p className="font-pixel text-brand-yellow text-sm">{sponsor.name}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteSponsor(sponsor.id)}
                        className="text-brand-cyan hover:text-red-500 transition-colors text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow">Speakers / Mentors</h3>
              <PixelButton onClick={() => setShowSpeakerForm(!showSpeakerForm)} size="sm">
                <Plus size={16} className="mr-2" />
                New Speaker
              </PixelButton>
            </div>

            {showSpeakerForm && (
              <GlassCard className="mb-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-cyan">Name</Label>
                    <Input
                      value={speakerForm.name}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Title</Label>
                    <Input
                      value={speakerForm.title}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, title: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Company</Label>
                    <Input
                      value={speakerForm.company}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, company: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Bio</Label>
                    <Textarea
                      value={speakerForm.bio}
                      onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })}
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                    />
                  </div>

                  <div>
                    <Label className="text-brand-cyan">Avatar URL or Upload</Label>
                    <div className="flex gap-2">
                      <Input
                        value={speakerForm.avatar}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, avatar: e.target.value })}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan flex-1"
                      />
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const url = await handleFileUpload(file, "speakers")
                              setSpeakerForm({ ...speakerForm, avatar: url })
                            }
                          }}
                        />
                        <PixelButton asChild size="sm" disabled={uploading}>
                          <span>
                            <Upload size={16} />
                          </span>
                        </PixelButton>
                      </label>
                    </div>
                  </div>

                  <PixelButton onClick={createSpeaker} disabled={uploading}>
                    {uploading ? "Uploading..." : "Create Speaker"}
                  </PixelButton>
                </div>
              </GlassCard>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {speakers.map((speaker) => (
                <GlassCard key={speaker.id} neonOnHover>
                  <div className="space-y-2">
                    <p className="font-pixel text-brand-yellow text-sm">{speaker.name}</p>
                    <p className="text-brand-cyan/60 text-xs">{speaker.company}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteSpeaker(speaker.id)}
                        className="text-brand-cyan hover:text-red-500 transition-colors text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </div>

        {/* Create Team Modal */}
        <Dialog open={showCreateTeamModal} onOpenChange={setShowCreateTeamModal}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30">
            <DialogHeader>
              <DialogTitle className="font-pixel text-brand-yellow">Crear Nuevo Equipo</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-brand-cyan">Nombre del Equipo</Label>
                <Input
                  value={newTeamForm.name}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                  className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                  placeholder="Nombre del equipo..."
                />
              </div>

              <div>
                <Label className="text-brand-cyan">Categoría</Label>
                <select
                  value={newTeamForm.category}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, category: e.target.value })}
                  className="w-full bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded px-3 py-2"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancelar
              </button>
              <button
                onClick={createNewTeam}
                disabled={!newTeamForm.name || !newTeamForm.category}
                className="px-4 py-2 bg-brand-green hover:bg-brand-green/80 text-white rounded disabled:opacity-50"
              >
                Crear Equipo
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
