"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { collection, getDocs, query, where } from "firebase/firestore"
import { getDbClient, getAuthClient } from "@/lib/firebase/client-config"
import { Plus, Users as UsersIcon, ArrowLeft, Search, ChevronUp, ChevronDown } from "lucide-react"
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

  const [noTeamUsers, setNoTeamUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users")
  const [searchTerm, setSearchTerm] = useState("")
  const [noTeamPage, setNoTeamPage] = useState(1)
  const [sortField, setSortField] = useState<"name" | "email" | "age" | "university">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
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

  const NO_TEAM_PAGE_SIZE = 20
  const TEAMS_TABLE_PAGE_SIZE = 20
  const [teamsPage, setTeamsPage] = useState(1)
  const [teamSearchTerm, setTeamSearchTerm] = useState("")
  const [teamSortField, setTeamSortField] = useState<"name" | "members" | "category">("name")
  const [teamSortOrder, setTeamSortOrder] = useState<"asc" | "desc">("asc")
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [membersViewTeam, setMembersViewTeam] = useState<any | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true)
      }
    })
    return () => unsubscribe()
  }, [auth])

  const getTeamMemberCount = (teamId: string) => allUsers.filter(u => u.team === teamId).length

  const getCategoryName = (idx: any) => {
    if (idx === null || idx === undefined) return "-"
    const cat = categories[parseInt(idx)]
    if (!cat) return "-"
    return locale === "es" ? (cat.spanishName || cat.englishName) : (cat.englishName || cat.spanishName)
  }

  const getTeamCategoryIndex = (team: any) => {
    if (team?.category !== null && team?.category !== undefined) return team.category
    if (team?.category_1 !== null && team?.category_1 !== undefined) return team.category_1
    return null
  }

  const handleTeamSort = (field: "name" | "members" | "category") => {
    if (teamSortField === field) {
      setTeamSortOrder(teamSortOrder === "asc" ? "desc" : "asc")
    } else {
      setTeamSortField(field)
      setTeamSortOrder("asc")
    }
    setTeamsPage(1)
  }

  const handleSort = (field: "name" | "email" | "age" | "university") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setNoTeamPage(1)
  }

  const filteredNoTeamUsers = useMemo(() => {
    let data = [...noTeamUsers]
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      data = data.filter(u => {
        const name = `${u.name || ""} ${u.surname || ""}`.toLowerCase()
        const email = (u.email || "").toLowerCase()
        const university = (u.university || "").toLowerCase()
        const age = String(u.age ?? "")
        return name.includes(lower) || email.includes(lower) || university.includes(lower) || age.includes(lower)
      })
    }
    data.sort((a, b) => {
      let valA: any
      let valB: any
      if (sortField === "name") {
        valA = `${a.name || ""} ${a.surname || ""}`.toLowerCase()
        valB = `${b.name || ""} ${b.surname || ""}`.toLowerCase()
      } else if (sortField === "email") {
        valA = (a.email || "").toLowerCase()
        valB = (b.email || "").toLowerCase()
      } else if (sortField === "age") {
        valA = Number(a.age ?? 0)
        valB = Number(b.age ?? 0)
      } else {
        valA = (a.university || "").toLowerCase()
        valB = (b.university || "").toLowerCase()
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1
      if (valA > valB) return sortOrder === "asc" ? 1 : -1
      return 0
    })
    return data
  }, [noTeamUsers, searchTerm, sortField, sortOrder])

  const noTeamTotalPages = Math.max(1, Math.ceil(filteredNoTeamUsers.length / NO_TEAM_PAGE_SIZE))

  const pagedNoTeamUsers = useMemo(() => {
    const start = (noTeamPage - 1) * NO_TEAM_PAGE_SIZE
    return filteredNoTeamUsers.slice(start, start + NO_TEAM_PAGE_SIZE)
  }, [filteredNoTeamUsers, noTeamPage])

  const filteredPendingTeams = useMemo(() => {
    let data = [...pendingTeams]
    if (teamSearchTerm) {
      const lower = teamSearchTerm.toLowerCase()
      data = data.filter(t => (t.name || "").toLowerCase().includes(lower))
    }
    data.sort((a, b) => {
      let valA: any
      let valB: any
      if (teamSortField === "name") {
        valA = (a.name || "").toLowerCase()
        valB = (b.name || "").toLowerCase()
      } else if (teamSortField === "members") {
        valA = getTeamMemberCount(a.id)
        valB = getTeamMemberCount(b.id)
      } else {
        valA = getCategoryName(getTeamCategoryIndex(a)).toLowerCase()
        valB = getCategoryName(getTeamCategoryIndex(b)).toLowerCase()
      }
      if (valA < valB) return teamSortOrder === "asc" ? -1 : 1
      if (valA > valB) return teamSortOrder === "asc" ? 1 : -1
      return 0
    })
    return data
  }, [pendingTeams, teamSearchTerm, teamSortField, teamSortOrder, allUsers, categories])

  const teamTotalPages = Math.max(1, Math.ceil(filteredPendingTeams.length / TEAMS_TABLE_PAGE_SIZE))

  const pagedPendingTeams = useMemo(() => {
    const start = (teamsPage - 1) * TEAMS_TABLE_PAGE_SIZE
    return filteredPendingTeams.slice(start, start + TEAMS_TABLE_PAGE_SIZE)
  }, [filteredPendingTeams, teamsPage])

  useEffect(() => {
    if (authReady) {
      loadNoTeamUsers()
      loadTeams()
      loadPendingTeams()
      loadCategories()
      loadAllUsers()
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

  const loadNoTeamUsers = async () => {
    if (!db) return
    try {
      const snap = await getDocs(
        query(collection(db, "users"),
          where("role", "==", "participant"),
          where("onboardingStep", "==", 2),
          where("team", "==", null)
        )
      )
      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.status !== "accepted")
      setNoTeamUsers(users)
    } catch (error) {
      console.error("Error loading no-team users:", error)
    }
  }

  const loadTeams = async () => {
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/teams/admin-created`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      } else {
        console.error("Error loading admin teams")
      }
    } catch (error) {
      console.error("Error loading teams:", error)
    }
  }

  const loadPendingTeams = async () => {
    if (!db) return
    try {
      const snap = await getDocs(query(collection(db, "teams"), where("status", "==", "registered")))
      const allTeams = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((t: any) => !t.is_created_by_admin)
      setPendingTeams(allTeams)
    } catch (error) {
      console.error("Error loading pending teams:", error)
    }
  }

  const loadAllUsers = async () => {
    if (!db) return
    try {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "==", "participant"), where("onboardingStep", "==", 2))
      )
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error loading all users:", error)
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
        await loadAllUsers()
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
        loadNoTeamUsers()
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
        loadNoTeamUsers()
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

    const categoryIndex = Number.parseInt(newTeamForm.category, 10)
    if (Number.isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
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
          tell_why: (translations.admin.createTeam.defaultReason || "Team created by administrator for assignment").padEnd(20, "."),
          category: categoryIndex,
          category_1: null,
          category_2: null,
          category_3: null,
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-7 h-7 text-brand-orange" />
                <h2 className="font-pixel text-3xl text-brand-yellow">
                  {locale === "es" ? "Aprobaciones" : "Approvals"}
                </h2>
              </div>
              <div className="flex gap-2 p-1 bg-brand-navy/40 border border-brand-cyan/20 rounded-lg">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 rounded font-pixel text-xs transition-all flex items-center gap-1.5 ${
                    activeTab === "users" ? "bg-brand-orange text-brand-navy" : "text-brand-cyan hover:bg-brand-cyan/10"
                  }`}
                >
                  {locale === "es" ? "Participantes" : "Participants"}
                </button>
                <button
                  onClick={() => setActiveTab("teams")}
                  className={`px-4 py-2 rounded font-pixel text-xs transition-all flex items-center gap-1.5 ${
                    activeTab === "teams" ? "bg-brand-orange text-brand-navy" : "text-brand-cyan hover:bg-brand-cyan/10"
                  }`}
                >
                  {locale === "es" ? "Equipos" : "Teams"}
                </button>
              </div>
              <span className="flex items-center gap-1.5 bg-brand-orange/10 border border-brand-orange/20 px-3 py-1 rounded-full text-xs font-pixel text-brand-orange/70">
                {locale === "es" ? "Pendientes" : "Pending"}
                <span className="text-brand-orange font-bold text-sm">
                  {activeTab === "users" ? filteredNoTeamUsers.length : filteredPendingTeams.length}
                </span>
              </span>
            </div>
            <PixelButton onClick={() => openCreateTeamModal(null)} size="sm" variant="outline">
              <Plus size={16} className="mr-2" />
              {translations.admin.pendingParticipants.createTeam}
            </PixelButton>
          </div>

          {/* No-team Users Table */}
          {activeTab === "users" && (
            <section>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/40" />
              <Input
                placeholder={locale === "es" ? "Buscar por nombre o email..." : "Search by name or email..."}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setNoTeamPage(1) }}
                className="pl-10 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan h-9"
              />
            </div>

            <GlassCard className="overflow-hidden border-brand-cyan/10">
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-full">
                  <Table>
                    <TableHeader className="bg-brand-navy/60">
                      <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                        <TableHead className="h-8 py-1 text-[10px] w-[90px]">
                          {locale === "es" ? "Acciones" : "Actions"}
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("name")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            {locale === "es" ? "Nombre" : "Name"}
                            {sortField === "name" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("email")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            Email
                            {sortField === "email" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("age")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            {locale === "es" ? "Edad" : "Age"}
                            {sortField === "age" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("university")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            {locale === "es" ? "Universidad" : "University"}
                            {sortField === "university" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedNoTeamUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-brand-cyan/40">
                            {locale === "es" ? "No se encontraron usuarios sin equipo" : "No teamless users found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedNoTeamUsers.map((user) => (
                          <TableRow key={user.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5">
                            <TableCell className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedParticipant(user)
                                  setSelectedParticipantTeamId("")
                                  setParticipantRejectReason("")
                                }}
                                className="text-[11px] px-2.5 py-0.5 bg-brand-orange/20 text-brand-orange border border-brand-orange/30 rounded hover:bg-brand-orange/30 transition-colors font-pixel whitespace-nowrap"
                              >
                                {locale === "es" ? "Revisar" : "Review"}
                              </button>
                            </TableCell>
                            <TableCell className="text-brand-yellow text-[11px] py-1 font-medium">
                              {user.name} {user.surname}
                            </TableCell>
                            <TableCell className="text-brand-cyan/80 text-[11px] py-1">
                              {user.email}
                            </TableCell>
                            <TableCell className="text-brand-cyan/80 text-[11px] py-1">
                              {user.age || "-"}
                            </TableCell>
                            <TableCell className="text-brand-cyan/80 text-[11px] py-1 max-w-[140px] truncate">
                              {user.university || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              <PaginationControls
                page={noTeamPage}
                totalPages={noTeamTotalPages}
                onPageChange={setNoTeamPage}
                totalItems={filteredNoTeamUsers.length}
                pageSize={NO_TEAM_PAGE_SIZE}
                locale={locale}
              />
            </GlassCard>
          </section>
          )}

          {/* Pending Teams */}
          {activeTab === "teams" && (
          <section>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/40" />
              <Input
                placeholder={locale === "es" ? "Buscar por nombre..." : "Search by name..."}
                value={teamSearchTerm}
                onChange={(e) => { setTeamSearchTerm(e.target.value); setTeamsPage(1) }}
                className="pl-10 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan h-9"
              />
            </div>

            <GlassCard className="overflow-hidden border-brand-cyan/10">
              <ScrollArea className="overflow-x-auto">
                <div className="min-w-full">
                  <Table>
                    <TableHeader className="bg-brand-navy/60">
                      <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                        <TableHead className="h-8 py-1 text-[10px] w-[90px]">
                          {locale === "es" ? "Acciones" : "Actions"}
                        </TableHead>
                        <TableHead
                          onClick={() => handleTeamSort("name")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            {locale === "es" ? "Nombre" : "Name"}
                            {teamSortField === "name" ? (teamSortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => handleTeamSort("members")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            {locale === "es" ? "Miembros" : "Members"}
                            {teamSortField === "members" ? (teamSortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => handleTeamSort("category")}
                          className="h-8 py-1 text-[10px] cursor-pointer hover:text-brand-orange select-none"
                        >
                          <span className="flex items-center gap-1">
                            {locale === "es" ? "Categoría" : "Category"}
                            {teamSortField === "category" ? (teamSortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronUp className="w-3 h-3 opacity-20" />}
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedPendingTeams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-brand-cyan/40">
                            {locale === "es" ? "No hay equipos pendientes de aprobación" : "No teams pending approval"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedPendingTeams.map((team) => (
                          <TableRow key={team.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5">
                            <TableCell className="py-1">
                              <button
                                onClick={() => openTeamDetail(team)}
                                className="text-[11px] px-2.5 py-0.5 bg-brand-orange/20 text-brand-orange border border-brand-orange/30 rounded hover:bg-brand-orange/30 transition-colors font-pixel whitespace-nowrap"
                              >
                                {locale === "es" ? "Revisar" : "Review"}
                              </button>
                            </TableCell>
                            <TableCell className="text-brand-yellow text-[11px] py-1 font-medium">
                              {team.name}
                            </TableCell>
                            <TableCell className="text-brand-cyan/80 text-[11px] py-1">
                              <button
                                onClick={() => setMembersViewTeam(team)}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
                              >
                                <UsersIcon size={12} />
                                {getTeamMemberCount(team.id)}
                              </button>
                            </TableCell>
                            <TableCell className="text-brand-cyan/80 text-[11px] py-1">
                              {getCategoryName(getTeamCategoryIndex(team))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              <PaginationControls
                page={teamsPage}
                totalPages={teamTotalPages}
                onPageChange={setTeamsPage}
                totalItems={filteredPendingTeams.length}
                pageSize={TEAMS_TABLE_PAGE_SIZE}
                locale={locale}
              />
            </GlassCard>
          </section>
          )}
        </div>

        {/* Participant Detail Modal */}
        <Dialog open={!!selectedParticipant} onOpenChange={(open) => { if (!open) { setSelectedParticipant(null); setSelectedParticipantTeamId(""); setParticipantRejectReason("") } }}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30 px-5 py-4 max-w-md">
            <DialogHeader className="pb-1">
              <DialogTitle className="font-pixel text-brand-yellow text-base">
                {selectedParticipant?.name} {selectedParticipant?.surname}
              </DialogTitle>
            </DialogHeader>
            {selectedParticipant && (
              <div className="space-y-2 pt-1 pb-2">
                {/* Compact info grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-3 rounded-lg bg-brand-cyan/5 border border-brand-cyan/10">
                  <div>
                    <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase">Email</p>
                    <p className="text-brand-cyan text-xs break-all">{selectedParticipant.email}</p>
                  </div>
                  {selectedParticipant.university && (
                    <div>
                      <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase">{locale === "es" ? "Universidad" : "University"}</p>
                      <p className="text-brand-cyan text-xs truncate">{selectedParticipant.university}</p>
                    </div>
                  )}
                  {selectedParticipant.career && (
                    <div>
                      <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase">{locale === "es" ? "Carrera" : "Degree"}</p>
                      <p className="text-brand-cyan text-xs truncate">{selectedParticipant.career}</p>
                    </div>
                  )}
                  {selectedParticipant.age && (
                    <div>
                      <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase">{locale === "es" ? "Edad" : "Age"}</p>
                      <p className="text-brand-cyan text-xs">{selectedParticipant.age}</p>
                    </div>
                  )}
                  {selectedParticipant.food_preference && (
                    <div>
                      <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase">{locale === "es" ? "Alimentación" : "Food"}</p>
                      <p className="text-brand-cyan text-xs">{selectedParticipant.food_preference}</p>
                    </div>
                  )}
                </div>

                {/* Category preferences */}
                {[selectedParticipant?.category_1, selectedParticipant?.category_2, selectedParticipant?.category_3].some(v => v !== null && v !== undefined) && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-1.5">
                    {[selectedParticipant?.category_1, selectedParticipant?.category_2, selectedParticipant?.category_3].map((idx, i) => {
                      if (idx === null || idx === undefined) return null
                      const cat = categories[idx]
                      if (!cat) return null
                      const name = locale === "es" ? (cat.spanishName || cat.englishName) : (cat.englishName || cat.spanishName)
                      const Icon = (LucideIcons as any)[cat.iconName] || LucideIcons.Tag
                      return (
                        <span key={i} className="flex items-center gap-1 text-[10px] text-brand-cyan/70 bg-brand-cyan/5 border border-brand-cyan/10 rounded px-2 py-0.5">
                          <span className="text-brand-orange font-pixel">{i + 1}.</span>
                          <Icon className="w-3 h-3" />
                          {name}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Team selector */}
                <div>
                  <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase mb-1">{translations.admin.pendingParticipants.selectTeam}</p>
                  <select
                    value={selectedParticipantTeamId}
                    onChange={(e) => setSelectedParticipantTeamId(e.target.value)}
                    className="w-full bg-brand-navy/80 border border-brand-cyan/40 text-brand-cyan rounded px-2 py-1.5 text-xs"
                  >
                    <option value="">{translations.admin.pendingParticipants.selectTeam}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rejection reason */}
                <div>
                  <p className="text-brand-cyan/50 text-[9px] font-pixel uppercase mb-1">{locale === "es" ? "Motivo de rechazo (opcional)" : "Rejection reason (optional)"}</p>
                  <textarea
                    value={participantRejectReason}
                    onChange={(e) => setParticipantRejectReason(e.target.value)}
                    rows={2}
                    className="w-full bg-brand-navy/80 border border-brand-cyan/40 text-brand-cyan rounded px-2 py-1.5 text-xs resize-none"
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
          <DialogContent className="bg-brand-navy border-brand-cyan/30 px-6 py-5 max-h-[85vh] overflow-y-auto">
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
                    <p className="text-brand-cyan text-sm whitespace-pre-wrap break-words [hyphens:auto]">
                      {selectedTeam.tell_why}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-brand-cyan/60 text-xs font-pixel">Status</p>
                  <p className="text-brand-cyan text-sm">{selectedTeam.status}</p>
                </div>
                {selectedTeam.link_github && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">GitHub</p>
                    <a href={selectedTeam.link_github} target="_blank" rel="noopener noreferrer" className="text-brand-orange text-sm underline break-all">{selectedTeam.link_github}</a>
                  </div>
                )}
                {selectedTeam.link_deploy && (
                  <div>
                    <p className="text-brand-cyan/60 text-xs font-pixel">Deploy</p>
                    <a href={selectedTeam.link_deploy} target="_blank" rel="noopener noreferrer" className="text-brand-orange text-sm underline break-all">{selectedTeam.link_deploy}</a>
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
                          <span className="text-brand-cyan/40 text-xs break-all">({m.email})</span>
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
                  {categories.map((category, index) => {
                    const displayName = locale === "es" ? category.spanishName : category.englishName
                    return (
                      <option key={category.id || index} value={String(index)}>
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

        {/* Team Members View Modal */}
        <Dialog open={!!membersViewTeam} onOpenChange={(open) => { if (!open) setMembersViewTeam(null) }}>
          <DialogContent className="bg-brand-navy border-brand-cyan/30 max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-pixel text-brand-yellow flex items-center gap-2">
                <UsersIcon size={16} />
                {membersViewTeam?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {allUsers.filter(u => u.team === membersViewTeam?.id).length === 0 ? (
                <p className="text-brand-cyan/40 text-sm text-center py-4">
                  {locale === "es" ? "Sin miembros" : "No members"}
                </p>
              ) : (
                allUsers.filter(u => u.team === membersViewTeam?.id).map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded bg-brand-navy/60 border border-brand-cyan/10">
                    <div>
                      <p className="text-brand-yellow text-xs font-medium">{m.name} {m.surname}</p>
                      <p className="text-brand-cyan/50 text-[10px]">{m.email}</p>
                    </div>
                    {m.isLeader && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-brand-orange/20 text-brand-orange border border-brand-orange/30 rounded font-pixel">
                        {locale === "es" ? "Líder" : "Leader"}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
