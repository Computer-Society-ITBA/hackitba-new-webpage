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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { collection, getDocs, query, where } from "firebase/firestore"
import { getDbClient, getAuthClient } from "@/lib/firebase/client-config"
import { Plus, Users as UsersIcon, ArrowLeft } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { getTranslations } from "@/lib/i18n/get-translations"
import { toast } from "@/hooks/use-toast"
import type { Locale } from "@/lib/i18n/config"

export default function ApprovalsPage() {
  const params = useParams()
  const locale = (params?.locale as Locale) || "en"
  const translations = getTranslations(locale)
  const db = getDbClient()
  const auth = getAuthClient()

  const [pendingParticipants, setPendingParticipants] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [pendingTeams, setPendingTeams] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [pendingParticipantId, setPendingParticipantId] = useState<string | null>(null)
  const [newTeamForm, setNewTeamForm] = useState({ name: "", category: "" })
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [selectedApprovalCategory, setSelectedApprovalCategory] = useState<string>("")
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null)
  const [selectedParticipantTeamId, setSelectedParticipantTeamId] = useState<string>("")
  const [participantRejectReason, setParticipantRejectReason] = useState<string>("")

  const PARTICIPANTS_PAGE_SIZE = 5
  const TEAMS_PAGE_SIZE = 5
  const [participantsPage, setParticipantsPage] = useState(1)
  const [teamsPage, setTeamsPage] = useState(1)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true)
      }
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    if (authReady) {
      loadPendingParticipants()
      loadTeams()
      loadPendingTeams()
      loadCategories()
    }
  }, [authReady])

  const loadCategories = async () => {
    if (!db) return
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      setCategories(categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Error loading categories:", error)
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
      const response = await fetch(`${apiUrl}/users/pending-participants`, {
        headers: { "Authorization": `Bearer ${idToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPendingParticipants(data.participants || [])
        setParticipantsPage(1)
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
      const teamsQuery = query(collection(db, "teams"), where("is_created_by_admin", "==", true))
      const teamsSnapshot = await getDocs(teamsQuery)
      setTeams(teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error("Error loading teams:", error)
    }
  }

  const loadPendingTeams = async () => {
    if (!db) return
    try {
      const teamsQuery = query(collection(db, "teams"), where("status", "==", "registered"))
      const teamsSnapshot = await getDocs(teamsQuery)
      setPendingTeams(
        teamsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((t: any) => !t.is_created_by_admin)
      )
      setTeamsPage(1)
    } catch (error) {
      console.error("Error loading pending teams:", error)
    }
  }

  const approveTeam = async (teamId: string, categoryId?: string) => {
    setProcessing(teamId)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      // Map category ID to its sorted index
      let categoryIndex: number | null = null
      if (categoryId) {
        const idx = categories.findIndex((c) => c.id === categoryId)
        if (idx !== -1) categoryIndex = idx
      }

      const body: any = { status: "approved" }
      if (categoryIndex !== null) body.category = categoryIndex

      const response = await fetch(`${apiUrl}/teams/${teamId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        await loadPendingTeams()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error("Error approving team:", error)
    } finally {
      setProcessing(null)
    }
  }

  const rejectTeam = async (teamId: string) => {
    setProcessing(teamId)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/teams/${teamId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ status: "rejected" }),
      })
      if (response.ok) {
        await loadPendingTeams()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error("Error rejecting team:", error)
    } finally {
      setProcessing(null)
    }
  }

  const approveParticipant = async (userId: string, teamId: string) => {
    if (!teamId) {
      toast({ title: translations.admin.pendingParticipants.selectTeamError, variant: 'destructive' })
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
        toast({ title: translations.admin.pendingParticipants.approveSuccess })
        loadPendingParticipants()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error("Error approving participant:", error)
      toast({ title: translations.admin.pendingParticipants.approveError, variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  const rejectParticipant = async (userId: string, reason?: string) => {
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
        toast({ title: translations.admin.pendingParticipants.rejectSuccess })
        loadPendingParticipants()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error("Error rejecting participant:", error)
      toast({ title: translations.admin.pendingParticipants.rejectError, variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  const openTeamDetail = async (team: any) => {
    setSelectedTeam(team)
    setTeamMembers([])
    setSelectedApprovalCategory("")
    if (!db) return
    try {
      const membersQuery = query(collection(db, "users"), where("team", "==", team.id))
      const snap = await getDocs(membersQuery)
      setTeamMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const openCreateTeamModal = (participantId: string | null) => {
    setPendingParticipantId(participantId)
    setNewTeamForm({ name: "", category: "" })
    setShowCreateTeamModal(true)
  }

  const createNewTeam = async () => {
    if (!newTeamForm.name || newTeamForm.name.trim().length < 3) {
      toast({ title: translations.admin.createTeam.nameLengthError, variant: 'destructive' })
      return
    }

    if (!newTeamForm.category) {
      toast({ title: translations.admin.createTeam.categoryRequired, variant: 'destructive' })
      return
    }

    const categoryIndex = categories.findIndex((category) => category.id === newTeamForm.category)
    if (categoryIndex === -1) {
      toast({ title: translations.admin.createTeam.invalidCategory, variant: 'destructive' })
      return
    }

    setProcessing(pendingParticipantId || "team-creation")
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) {
        toast({ title: translations.admin.createTeam.sessionError, variant: 'destructive' })
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

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
          is_created_by_admin: true,
        }),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setShowCreateTeamModal(false)
        toast({ title: `${translations.admin.createTeam.create} "${newTeamForm.name}" ${translations.admin.createTeam.createSuccess}` })

        await loadTeams()

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
        toast({ title: "Error", description: errorMessage, variant: 'destructive' })
      }
    } catch (error) {
      console.error("Error creating team:", error)
      toast({ title: translations.admin.createTeam.createError, variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title={locale === "es" ? "Aprobaciones" : "Approvals"}>
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <UsersIcon className="w-7 h-7 text-brand-orange" />
            <h2 className="font-pixel text-3xl text-brand-yellow">
              {locale === "es" ? "Aprobaciones" : "Approvals"}
            </h2>
          </div>

          {/* Pending Participants */}
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
            ) : (() => {
              const totalParticipantPages = Math.ceil(pendingParticipants.length / PARTICIPANTS_PAGE_SIZE)
              const pagedParticipants = pendingParticipants.slice(
                (participantsPage - 1) * PARTICIPANTS_PAGE_SIZE,
                participantsPage * PARTICIPANTS_PAGE_SIZE
              )
              return (
                <GlassCard className="p-4">
                  <div className="space-y-3">
                    {pagedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="p-4 rounded-lg border border-brand-cyan/10 bg-brand-cyan/5 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedParticipant(participant)
                          setSelectedParticipantTeamId("")
                          setParticipantRejectReason("")
                        }}
                      >
                        <p className="font-pixel text-brand-yellow text-sm">
                          {participant.name} {participant.surname}
                        </p>
                        <div className="text-xs text-brand-cyan/70 space-y-0.5 mt-1">
                          <p>{participant.email}</p>
                          <p>{[participant.university, participant.career].filter(Boolean).join(" - ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <PaginationControls
                    page={participantsPage}
                    totalPages={totalParticipantPages}
                    onPageChange={setParticipantsPage}
                    totalItems={pendingParticipants.length}
                    pageSize={PARTICIPANTS_PAGE_SIZE}
                    locale={locale}
                  />
                </GlassCard>
              )
            })()}
          </section>

          {/* Pending Teams */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-6 h-6 text-brand-cyan" />
                <h3 className="font-pixel text-2xl text-brand-yellow">
                  {locale === "es" ? "Equipos Pendientes de Aprobación" : "Teams Pending Approval"}
                </h3>
                <span className="bg-brand-cyan/20 text-brand-cyan px-3 py-1 rounded-full text-sm font-pixel">
                  {pendingTeams.length}
                </span>
              </div>
            </div>

            {pendingTeams.length === 0 ? (
              <GlassCard>
                <p className="text-brand-cyan/60 text-center py-8">
                  {locale === "es" ? "No hay equipos pendientes de aprobación" : "No teams pending approval"}
                </p>
              </GlassCard>
            ) : (() => {
              const totalTeamPages = Math.ceil(pendingTeams.length / TEAMS_PAGE_SIZE)
              const pagedTeams = pendingTeams.slice(
                (teamsPage - 1) * TEAMS_PAGE_SIZE,
                teamsPage * TEAMS_PAGE_SIZE
              )
              return (
                <GlassCard className="p-4">
                  <div className="space-y-3">
                    {pagedTeams.map((team) => (
                      <div
                        key={team.id}
                        className="p-4 rounded-lg border border-brand-cyan/10 bg-brand-cyan/5 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-colors cursor-pointer"
                        onClick={() => openTeamDetail(team)}
                      >
                        <p className="font-pixel text-brand-yellow text-sm mb-1">{team.name}</p>
                        <p className="text-brand-cyan/50 text-xs">{team.id}</p>
                      </div>
                    ))}
                  </div>
                  <PaginationControls
                    page={teamsPage}
                    totalPages={totalTeamPages}
                    onPageChange={setTeamsPage}
                    totalItems={pendingTeams.length}
                    pageSize={TEAMS_PAGE_SIZE}
                    locale={locale}
                  />
                </GlassCard>
              )
            })()}
          </section>
        </div>

        {/* Participant Detail Modal */}
        <Dialog open={!!selectedParticipant} onOpenChange={(open) => { if (!open) { setSelectedParticipant(null); setSelectedParticipantTeamId(""); setParticipantRejectReason("") } }}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30 px-6 py-5">
            <DialogHeader className="pb-2">
              <DialogTitle className="font-pixel text-brand-yellow">
                {selectedParticipant?.name} {selectedParticipant?.surname}
              </DialogTitle>
            </DialogHeader>
            {selectedParticipant && (
              <div className="space-y-3 pt-2 pb-4">
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Nombre" : "Name"}</p>
                  <p className="text-brand-cyan text-sm">{selectedParticipant.name} {selectedParticipant.surname}</p>
                </div>
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">Email</p>
                  <p className="text-brand-cyan text-sm break-all">{selectedParticipant.email}</p>
                </div>
                {selectedParticipant.university && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Universidad" : "University"}</p>
                    <p className="text-brand-cyan text-sm">{selectedParticipant.university}</p>
                  </div>
                )}
                {selectedParticipant.career && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Carrera" : "Career"}</p>
                    <p className="text-brand-cyan text-sm">{selectedParticipant.career}</p>
                  </div>
                )}
                {selectedParticipant.age && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Edad" : "Age"}</p>
                    <p className="text-brand-cyan text-sm">{selectedParticipant.age}</p>
                  </div>
                )}
                {selectedParticipant.food_preference && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Preferencia alimentaria" : "Food preference"}</p>
                    <p className="text-brand-cyan text-sm">{selectedParticipant.food_preference}</p>
                  </div>
                )}
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel mb-1">{locale === "es" ? "Preferencias de categoría" : "Category preferences"}</p>
                  <div className="space-y-1">
                    {[selectedParticipant?.category_1, selectedParticipant?.category_2, selectedParticipant?.category_3].map((idx, i) => {
                      if (idx === null || idx === undefined) return null
                      const cat = categories[idx]
                      if (!cat) return null
                      const name = locale === "es" ? (cat.spanishName || cat.englishName) : (cat.englishName || cat.spanishName)
                      const Icon = (LucideIcons as any)[cat.iconName] || LucideIcons.Tag
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs text-brand-cyan/70">
                          <span className="text-brand-orange font-pixel">{i + 1}.</span>
                          <Icon className="w-3 h-3" />
                          <span>{name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel mb-1">{translations.admin.pendingParticipants.selectTeam}</p>
                  <select
                    value={selectedParticipantTeamId}
                    onChange={(e) => setSelectedParticipantTeamId(e.target.value)}
                    className="w-full bg-brand-navy/80 border border-brand-cyan/40 text-brand-cyan rounded px-3 py-2 text-sm"
                  >
                    <option value="">{translations.admin.pendingParticipants.selectTeam}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel mb-1">{locale === "es" ? "Motivo de rechazo (opcional)" : "Rejection reason (optional)"}</p>
                  <textarea
                    value={participantRejectReason}
                    onChange={(e) => setParticipantRejectReason(e.target.value)}
                    rows={2}
                    className="w-full bg-brand-navy/80 border border-brand-cyan/40 text-brand-cyan rounded px-3 py-2 text-sm resize-none"
                    placeholder={locale === "es" ? "Razón..." : "Reason..."}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <PixelButton
                    onClick={() => {
                      if (!selectedParticipantTeamId) {
                        toast({ title: translations.admin.pendingParticipants.selectTeamError, variant: 'destructive' })
                        return
                      }
                      approveParticipant(selectedParticipant.id, selectedParticipantTeamId)
                      setSelectedParticipant(null)
                    }}
                    disabled={processing === selectedParticipant.id}
                    size="sm"
                    variant="primary"
                  >
                    {locale === "es" ? "Aprobar" : "Approve"}
                  </PixelButton>
                  <PixelButton
                    onClick={() => {
                      rejectParticipant(selectedParticipant.id, participantRejectReason || undefined)
                      setSelectedParticipant(null)
                    }}
                    disabled={processing === selectedParticipant.id}
                    size="sm"
                    variant="outline"
                  >
                    {locale === "es" ? "Rechazar" : "Reject"}
                  </PixelButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Team Detail Modal */}
        <Dialog open={!!selectedTeam} onOpenChange={(open) => { if (!open) { setSelectedTeam(null); setTeamMembers([]); setSelectedApprovalCategory("") } }}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30 px-6 py-5">
            <DialogHeader className="pb-2">
              <DialogTitle className="font-pixel text-brand-yellow">{selectedTeam?.name}</DialogTitle>
            </DialogHeader>
            {selectedTeam && (
              <div className="space-y-3 pt-2 pb-4 overflow-hidden">
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Código" : "Code"}</p>
                  <p className="text-brand-cyan text-sm break-all">{selectedTeam.id}</p>
                </div>
                {selectedTeam.tell_why && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Motivación" : "Motivation"}</p>
                    <p className="text-brand-cyan text-sm break-words">{selectedTeam.tell_why}</p>
                  </div>
                )}
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">Status</p>
                  <p className="text-brand-cyan text-sm">{selectedTeam.status}</p>
                </div>
                {selectedTeam.link_github && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">GitHub</p>
                    <a href={selectedTeam.link_github} target="_blank" rel="noopener noreferrer" className="text-brand-orange text-sm underline">{selectedTeam.link_github}</a>
                  </div>
                )}
                {selectedTeam.link_deploy && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">Deploy</p>
                    <a href={selectedTeam.link_deploy} target="_blank" rel="noopener noreferrer" className="text-brand-orange text-sm underline">{selectedTeam.link_deploy}</a>
                  </div>
                )}
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel mb-1">{locale === "es" ? "Miembros" : "Members"}</p>
                  {teamMembers.length === 0 ? (
                    <p className="text-brand-cyan/40 text-sm">{locale === "es" ? "Sin miembros" : "No members"}</p>
                  ) : (
                    <ul className="space-y-1">
                      {teamMembers.map((m) => (
                        <li
                          key={m.id}
                          className="text-brand-cyan text-sm flex items-center gap-2 cursor-pointer hover:bg-brand-cyan/10 rounded px-2 py-1 transition-colors"
                          onClick={() => setSelectedMember(m)}
                        >
                          <span>{m.name} {m.surname}</span>
                          <span className="text-brand-cyan/40 text-xs">({m.email})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel mb-1">{locale === "es" ? "Preferencias del equipo" : "Team preferences"}</p>
                  <div className="space-y-1">
                    {[selectedTeam?.category_1, selectedTeam?.category_2, selectedTeam?.category_3].map((idx, i) => {
                      if (idx === null || idx === undefined) return null
                      const cat = categories[idx]
                      if (!cat) return null
                      const name = locale === "es" ? (cat.spanishName || cat.englishName) : (cat.englishName || cat.spanishName)
                      const Icon = (LucideIcons as any)[cat.iconName] || LucideIcons.Tag
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs text-brand-cyan/70">
                          <span className="text-brand-orange font-pixel">{i + 1}.</span>
                          <Icon className="w-3 h-3" />
                          <span>{name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel mb-1">{locale === "es" ? "Categoría final" : "Final category"}</p>
                  <select
                    value={selectedApprovalCategory}
                    onChange={(e) => setSelectedApprovalCategory(e.target.value)}
                    className="w-full bg-brand-navy/80 border border-brand-cyan/40 text-brand-cyan rounded px-3 py-2 text-sm"
                  >
                    <option value="">{locale === "es" ? "— Sin asignar —" : "— Not assigned —"}</option>
                    {categories.map((cat) => {
                      const name = locale === "es" ? (cat.spanishName || cat.englishName) : (cat.englishName || cat.spanishName)
                      return <option key={cat.id} value={cat.id}>{name}</option>
                    })}
                  </select>
                </div>
                <div className="flex gap-2 pt-3">
                  <PixelButton
                    onClick={() => { approveTeam(selectedTeam.id, selectedApprovalCategory || undefined); setSelectedTeam(null) }}
                    disabled={processing === selectedTeam.id}
                    size="sm"
                    variant="primary"
                  >
                    {locale === "es" ? "Aprobar" : "Approve"}
                  </PixelButton>
                  <PixelButton
                    onClick={() => { rejectTeam(selectedTeam.id); setSelectedTeam(null) }}
                    disabled={processing === selectedTeam.id}
                    size="sm"
                    variant="outline"
                  >
                    {locale === "es" ? "Rechazar" : "Reject"}
                  </PixelButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Member Detail Modal */}
        <Dialog open={!!selectedMember} onOpenChange={(open) => { if (!open) setSelectedMember(null) }}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30 px-6 py-5">
            <DialogHeader className="pb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-brand-cyan hover:text-brand-yellow transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <DialogTitle className="font-pixel text-brand-yellow">
                  {selectedMember?.name} {selectedMember?.surname}
                </DialogTitle>
              </div>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-3 pt-2 pb-4">
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Nombre" : "Name"}</p>
                  <p className="text-brand-cyan text-sm">{selectedMember.name} {selectedMember.surname}</p>
                </div>
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">Email</p>
                  <p className="text-brand-cyan text-sm break-all">{selectedMember.email}</p>
                </div>
                {selectedMember.university && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Universidad" : "University"}</p>
                    <p className="text-brand-cyan text-sm">{selectedMember.university}</p>
                  </div>
                )}
                {selectedMember.career && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Carrera" : "Career"}</p>
                    <p className="text-brand-cyan text-sm">{selectedMember.career}</p>
                  </div>
                )}
                {selectedMember.age && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Edad" : "Age"}</p>
                    <p className="text-brand-cyan text-sm">{selectedMember.age}</p>
                  </div>
                )}
                {selectedMember.food_preference && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">{locale === "es" ? "Preferencia alimentaria" : "Food preference"}</p>
                    <p className="text-brand-cyan text-sm">{selectedMember.food_preference}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

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
