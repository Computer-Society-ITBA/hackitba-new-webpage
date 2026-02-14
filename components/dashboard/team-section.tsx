"use client"

import { useState, useEffect, useMemo } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { Users, Crown, UserCircle, Trash2, Edit2, X, Settings, Copy, Check } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { User } from "@/lib/firebase/types"
import { PixelButton } from "@/components/ui/pixel-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAuth } from "firebase/auth"
import { useRouter, useParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"

interface TeamMember {
  id: string
  name: string
  surname: string
  email: string
  isAdmin: boolean
}

interface Team {
  id: string
  name: string
  admin_id: string
  tell_why?: string
  status?: string
  category?: number | null
  category_1?: number | null
}

interface TeamSectionProps {
  userId: string
  userTeamLabel: string | null
  teamAssignmentStatus?: "pending" | "in_process" | "accepted" | "rejected" | null
}

export function TeamSection({ userId, userTeamLabel, teamAssignmentStatus }: TeamSectionProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editForm, setEditForm] = useState({ name: "", surname: "", email: "" })
  const [editingTeam, setEditingTeam] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: "", tell_why: "" })
  const [saving, setSaving] = useState(false)
  const [rejoinCode, setRejoinCode] = useState("")
  const [rejoinError, setRejoinError] = useState("")
  const [copied, setCopied] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const db = getDbClient()
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "es"

  useEffect(() => {
    const loadTeam = async () => {
      if (!db || !userTeamLabel) {
        setLoading(false)
        return
      }

      try {
        // Get team data
        const teamDoc = await getDoc(doc(db, "teams", userTeamLabel))
        if (teamDoc.exists()) {
          const teamData = teamDoc.data() as Team
          setTeam({
            id: teamDoc.id,
            name: teamData.name,
            admin_id: teamData.admin_id,
            tell_why: teamData.tell_why,
            status: teamData.status,
            category: teamData.category,
            category_1: teamData.category_1,
          })

          // Get all team members
          const usersQuery = query(
            collection(db, "users"),
            where("team", "==", userTeamLabel)
          )
          const usersSnapshot = await getDocs(usersQuery)
          const teamMembers: TeamMember[] = usersSnapshot.docs.map((doc) => {
            const data = doc.data() as User
            return {
              id: doc.id,
              name: data.name || "",
              surname: data.surname || "",
              email: data.email || "",
              isAdmin: doc.id === teamData.admin_id,
            }
          })

          // Sort: admin first, then alphabetically
          teamMembers.sort((a, b) => {
            if (a.isAdmin) return -1
            if (b.isAdmin) return 1
            return a.name.localeCompare(b.name)
          })

          setMembers(teamMembers)
        }
      } catch (error) {
        console.error("Error loading team:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [db, userTeamLabel])

  useEffect(() => {
    const loadCategories = async () => {
      if (!db) return
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const cats = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[]
      cats.sort((a, b) => (a.order || 0) - (b.order || 0))
      setCategories(cats)
    }

    loadCategories()
  }, [db])

  useEffect(() => {
    const loadSignupSettings = async () => {
      if (!db) return
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          setSignupEnabled(data?.signupEnabled !== false)
        }
      } catch (err) {
        console.error("Error loading signup setting:", err)
      }
    }

    loadSignupSettings()
  }, [db])

  const handleRemoveMember = async (memberId: string) => {
    if (!team || !userTeamLabel) return

    if (!signupEnabled) {
      alert(locale === "es" ? "No se pueden hacer cambios al equipo mientras las inscripciones están cerradas" : "Cannot make team changes while signup is disabled")
      return
    }

    if (!confirm("¿Estás seguro de que quieres eliminar este miembro del equipo?")) {
      return
    }

    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      const response = await fetch(`${apiUrl}/teams/${userTeamLabel}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar miembro")
      }

      // Reload team members
      setMembers(members.filter(m => m.id !== memberId))
    } catch (error: any) {
      console.error("Error removing member:", error)
      alert(error.message || "Error al eliminar miembro")
    }
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setEditForm({
      name: member.name,
      surname: member.surname,
      email: member.email,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingMember || !userTeamLabel) return

    if (!signupEnabled) {
      alert(locale === "es" ? "No se pueden hacer cambios al equipo mientras las inscripciones están cerradas" : "Cannot make team changes while signup is disabled")
      return
    }

    setSaving(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      const response = await fetch(`${apiUrl}/users/${editingMember.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...editForm,
          teamLabel: userTeamLabel,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar miembro")
      }

      // Update local state
      setMembers(members.map(m =>
        m.id === editingMember.id
          ? { ...m, ...editForm }
          : m
      ))
      setEditingMember(null)
    } catch (error: any) {
      console.error("Error updating member:", error)
      alert(error.message || "Error al actualizar miembro")
    } finally {
      setSaving(false)
    }
  }

  const handleEditTeam = () => {
    if (!team) return
    setTeamForm({
      name: team.name,
      tell_why: team.tell_why || "",
    })
    setEditingTeam(true)
  }

  const handleSaveTeam = async () => {
    if (!team || !userTeamLabel) return

    if (!signupEnabled) {
      alert(locale === "es" ? "No se pueden hacer cambios al equipo mientras las inscripciones están cerradas" : "Cannot make team changes while signup is disabled")
      return
    }

    setSaving(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      const response = await fetch(`${apiUrl}/teams/${userTeamLabel}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify(teamForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar equipo")
      }

      // Update local state
      setTeam({ ...team, ...teamForm })
      setEditingTeam(false)
    } catch (error: any) {
      console.error("Error updating team:", error)
      alert(error.message || "Error al actualizar equipo")
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = team?.admin_id === userId

  const teamCategoryId = useMemo(() => {
    if (!team) return ""
    if (typeof team.category === "number" && team.category >= 0) {
      return categories[team.category]?.id || ""
    }
    if (typeof team.category_1 === "number" && team.category_1 >= 0) {
      return categories[team.category_1]?.id || ""
    }
    return ""
  }, [team, categories])

  const teamCategoryLabel = useMemo(() => {
    const fallbackLabel = locale === "es" ? "Categoria no asignada" : "Category not assigned"
    if (!teamCategoryId) return fallbackLabel
    const category = categories.find((item) => item.id === teamCategoryId)
    if (!category) return fallbackLabel
    if (locale === "es") {
      return category.spanishName || category.englishName || category.name || fallbackLabel
    }
    return category.englishName || category.spanishName || category.name || fallbackLabel
  }, [categories, teamCategoryId, locale])

  const teamCategoryIconName = useMemo(() => {
    if (!teamCategoryId) return ""
    const category = categories.find((item) => item.id === teamCategoryId)
    return category?.iconName || ""
  }, [categories, teamCategoryId])

  const handleRejoinTeam = async () => {
    if (!rejoinCode.trim()) {
      setRejoinError("Please enter a team code")
      return
    }

    if (!signupEnabled) {
      setRejoinError(locale === "es" ? "No se pueden hacer cambios al equipo mientras las inscripciones están cerradas" : "Cannot make team changes while signup is disabled")
      return
    }

    setSaving(true)
    setRejoinError("")
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      // Join team with code
      const response = await fetch(`${apiUrl}/teams/${rejoinCode}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error joining team")
      }

      // Reload page to get updated team data
      window.location.reload()
    } catch (error: any) {
      console.error("Error joining team:", error)
      setRejoinError(error.message || "Error joining team. Check the team code.")
    } finally {
      setSaving(false)
    }
  }

  const handleCopyTeamCode = async () => {
    if (!userTeamLabel) return

    try {
      await navigator.clipboard.writeText(userTeamLabel)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  if (loading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-center py-8">
          <p className="text-brand-cyan font-pixel text-xs uppercase animate-pulse">
            Loading team...
          </p>
        </div>
      </GlassCard>
    )
  }

  if (!userTeamLabel || !team) {
    const isInProcess = teamAssignmentStatus === "in_process" || teamAssignmentStatus === "pending"

    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <Users className="w-16 h-16 text-brand-orange/60" />
          <div className="text-center space-y-2 max-w-md">
            {isInProcess ? (
              <>
                <p className="text-brand-orange font-pixel text-lg">En Proceso</p>
                <p className="text-brand-cyan/90 text-sm">
                  Tu solicitud está siendo revisada por el staff. Te asignaremos un equipo pronto. Por favor espera la confirmación.
                </p>
                <div className="mt-4 p-3 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
                  <p className="text-brand-orange text-xs font-pixel">
                    ⏳ Estado: Esperando asignación de equipo
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-brand-yellow font-pixel text-lg">Without Team</p>
                <p className="text-brand-cyan/90 text-sm">
                  You are currently a solo participant. You can join an existing team using a team code or create a new team.
                </p>
              </>
            )}
          </div>
          {!isInProcess && (
            <>
              {!signupEnabled && (
                <div className="w-full max-w-sm p-3 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
                  <p className="text-brand-orange text-xs font-pixel text-center">
                    {locale === "es" ? "⚠️ Inscripciones cerradas - No se pueden hacer cambios al equipo" : "⚠️ Signup disabled - Team changes not allowed"}
                  </p>
                </div>
              )}
              <div className="w-full max-w-sm space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="text-brand-cyan text-xs font-pixel uppercase">Join Existing Team</p>
                  <div className="flex gap-2">
                    <Input
                      value={rejoinCode}
                      onChange={(e) => {
                        setRejoinCode(e.target.value)
                        setRejoinError("")
                      }}
                      disabled={!signupEnabled}
                      placeholder="Enter team code..."
                      className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan flex-1"
                      onKeyPress={(e) => e.key === "Enter" && handleRejoinTeam()}
                    />
                    <PixelButton
                      onClick={handleRejoinTeam}
                      disabled={saving || !rejoinCode.trim() || !signupEnabled}
                      size="sm"
                    >
                      {saving ? "..." : "Join"}
                    </PixelButton>
                  </div>
                  {rejoinError && (
                    <p className="text-red-400 text-xs">{rejoinError}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-brand-cyan/50 text-xs">
                  <div className="flex-1 h-px bg-brand-cyan/20"></div>
                  <span>OR</span>
                  <div className="flex-1 h-px bg-brand-cyan/20"></div>
                </div>
                <PixelButton
                  onClick={() => router.push(`/${locale}/dashboard/create-team`)}
                  disabled={!signupEnabled}
                  className="w-full"
                >
                  Create New Team
                </PixelButton>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    )
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-500/20 border-gray-500/40 text-gray-400"

    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500/20 border-green-500/40 text-green-400"
      case "finalist":
      case "finalista":
        return "bg-brand-yellow/20 border-brand-yellow/40 text-brand-yellow"
      case "on process":
      case "in progress":
        return "bg-blue-500/20 border-blue-500/40 text-blue-400"
      case "denied":
      case "rejected":
        return "bg-red-500/20 border-red-500/40 text-red-400"
      default:
        return "bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan"
    }
  }

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  return (
    <GlassCard>
      <div className="space-y-6">
        {!signupEnabled && (
          <div className="p-3 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
            <p className="text-brand-orange text-xs font-pixel text-center">
              {locale === "es" ? "⚠️ Inscripciones cerradas - No se pueden hacer cambios al equipo" : "⚠️ Signup disabled - Team changes not allowed"}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between border-b border-brand-cyan/20 pb-4">
          <div className="flex flex-col items-center gap-3 w-full">

            <div className="flex flex-row items-center justify-between gap-3 w-full">
              <div className="flex flex-row items-center gap-4">
                <Users className="w-6 h-6 text-brand-cyan" />
                <h3 className="font-pixel text-lg text-brand-yellow">{team.name}</h3>
                {isAdmin && (
                  <button
                    onClick={handleEditTeam}
                    disabled={!signupEnabled}
                    className={`p-2 rounded transition-colors ${signupEnabled ? 'hover:bg-brand-cyan/10 text-brand-cyan/70 hover:text-brand-cyan' : 'text-brand-cyan/30 cursor-not-allowed'}`}
                    title={signupEnabled ? "Edit team" : (locale === "es" ? "Inscripciones cerradas" : "Signup disabled")}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
              {team.status && (
                <div className={`flex items-center px-4 py-2 rounded-full border font-pixel text-sm ${getStatusColor(team.status)}`}>
                  {capitalizeStatus(team.status)}
                </div>
              )}

            </div>
            <div className="flex flex-row items-center gap-3 w-full justify-between">
              <div className="flex flex-row w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3 font-pixel text-sm">
                  {(() => {
                    const IconComponent = (LucideIcons as any)[teamCategoryIconName] || (LucideIcons as any).Tag
                    return <IconComponent className="h-4 w-4 text-brand-cyan/70" />
                  })()}
                  <span className="text-brand-cyan">Category: </span>
                  <span className="text-brand-cyan/70">{teamCategoryLabel}</span>
                </div>
                <button
                  onClick={handleCopyTeamCode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-brand-cyan/10 text-brand-cyan/70 hover:text-brand-cyan transition-colors border border-brand-cyan/20"
                  title={locale === "es" ? "Copiar código del equipo" : "Copy team code"}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-pixel text-green-400">
                        {locale === "es" ? "¡Copiado!" : "Copied!"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs font-pixel">
                        {locale === "es" ? "Copiar código del equipo" : "Copy team code"}
                      </span>
                    </>
                  )}
                </button>

              </div>
            </div>


          </div>

        </div>

        <div className="space-y-3">
          <h4 className="font-pixel text-sm text-brand-cyan">
            Team Members ({members.length})
          </h4>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded border ${member.id === userId
                  ? "border-brand-cyan/40 bg-brand-cyan/5"
                  : "border-brand-cyan/20 bg-brand-navy/30"
                  }`}
              >
                <div className="flex-1 flex items-center gap-3">
                  <UserCircle className="w-5 h-5 text-brand-cyan/70" />
                  <div>
                    <p className="text-brand-cyan font-medium">
                      {member.name} {member.surname}
                      {member.id === userId && (
                        <span className="text-brand-cyan/50 text-xs ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-brand-cyan/50 text-xs">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.isAdmin && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 border border-brand-yellow/40">
                      <Crown className="w-4 h-4 text-brand-yellow" />
                      <span className="text-brand-yellow font-pixel text-xs">Admin</span>
                    </div>
                  )}
                  {isAdmin && !member.isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={!signupEnabled}
                      className={`p-2 rounded transition-colors ${signupEnabled ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' : 'text-red-400/30 cursor-not-allowed'}`}
                      title={signupEnabled ? "Remove member" : (locale === "es" ? "Inscripciones cerradas" : "Signup disabled")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
          <DialogHeader>
            <DialogTitle className="font-pixel text-brand-yellow">Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-brand-cyan text-xs">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-surname" className="text-brand-cyan text-xs">Surname</Label>
              <Input
                id="edit-surname"
                value={editForm.surname}
                onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-brand-cyan text-xs">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <PixelButton
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
              </PixelButton>
              <PixelButton
                onClick={() => setEditingMember(null)}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </PixelButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editingTeam} onOpenChange={() => setEditingTeam(false)}>
        <DialogContent className="bg-brand-navy border-brand-cyan/30 text-brand-cyan">
          <DialogHeader>
            <DialogTitle className="font-pixel text-brand-yellow">Edit Team Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="team-name" className="text-brand-cyan text-xs">Team Name</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-cyan text-xs">Why this team?</Label>
              <div className="bg-brand-navy/50 border border-brand-cyan/30 rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto text-brand-cyan text-sm">
                {teamForm.tell_why || "No description provided"}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <PixelButton
                onClick={handleSaveTeam}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
              </PixelButton>
              <PixelButton
                onClick={() => setEditingTeam(false)}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </PixelButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  )
}
