"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import { Pencil, Trash2, Plus, Upload } from "lucide-react"

export default function AdminDashboard() {
  const db = getDbClient()
  const storage = getStorageClient()
  const [events, setEvents] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [speakers, setSpeakers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [scoringCriteria, setScoringCriteria] = useState<any[]>([])

  const [showEventForm, setShowEventForm] = useState(false)
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [showSpeakerForm, setShowSpeakerForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showScoringForm, setShowScoringForm] = useState(false)
  const [uploading, setUploading] = useState(false)

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
    loadData()
  }, [])

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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
