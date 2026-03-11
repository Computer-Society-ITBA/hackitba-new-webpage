"use client"

import { useState, useEffect, useMemo } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { Users, Crown, UserCircle, Trash2, Edit2, X, Settings, Copy, Check } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { User } from "@/lib/firebase/types"
import { PixelButton } from "@/components/ui/pixel-button"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAuth } from "firebase/auth"
import { useRouter, useParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"

interface TeamMember {
  id: string
  name: string
  surname: string
  email: string
}

interface Team {
  id: string
  name: string
  tell_why?: string
  status?: string
  category?: number | null
  category_1?: number | null
  admin_id?: string
  assignedRoom?: string
  participantIds?: string[]
}

interface TeamSectionProps {
  userId: string
  userTeamLabel: string | null
}

export function TeamSection({ userId, userTeamLabel }: TeamSectionProps) {
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
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "false" && process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "0"
  const db = getDbClient()
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "es"
  const t = getTranslations(locale)

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
            tell_why: teamData.tell_why,
            status: teamData.status,
            category: teamData.category,
            category_1: teamData.category_1,
            participantIds: teamData.participantIds,
          })

          // Get all team members using participantIds if available, fallback to query
          let teamMembers: TeamMember[] = []
          if (teamData.participantIds && teamData.participantIds.length > 0) {
            const memberDocs = await Promise.all(
              teamData.participantIds.map(id => getDoc(doc(db, "users", id)))
            )
            teamMembers = memberDocs
              .filter(d => d.exists())
              .map(d => {
                const data = d.data() as User
                return {
                  id: d.id,
                  name: data.name || "",
                  surname: data.surname || "",
                  email: data.email || "",
                }
              })
          } else {
            const usersQuery = query(
              collection(db, "users"),
              where("team", "==", userTeamLabel)
            )
            const usersSnapshot = await getDocs(usersQuery)
            teamMembers = usersSnapshot.docs.map((doc) => {
              const data = doc.data() as User
              return {
                id: doc.id,
                name: data.name || "",
                surname: data.surname || "",
                email: data.email || "",
              }
            })
          }

          // Sort alphabetically
          teamMembers.sort((a, b) => a.name.localeCompare(b.name))

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

  // Eliminar miembros deshabilitado

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
      toast({
        title: t.dashboard.participant.toasts.actionNotAllowed.title,
        description: t.dashboard.participant.toasts.actionNotAllowed.description,
        variant: "destructive",
      })
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
      toast({
        title: t.dashboard.participant.toasts.updateMember.error.title,
        description: error.message || t.dashboard.participant.toasts.updateMember.error.description,
        variant: "destructive",
      })
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
      toast({
        title: t.dashboard.participant.toasts.actionNotAllowed.title,
        description: t.dashboard.participant.toasts.actionNotAllowed.description,
        variant: "destructive",
      })
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
      toast({
        title: t.dashboard.participant.toasts.updateTeam.error.title,
        description: error.message || t.dashboard.participant.toasts.updateTeam.error.description,
        variant: "destructive",
      })
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
      const enterMsg = t.dashboard.participant.toasts.rejoin.enterCode
      setRejoinError(enterMsg)
      toast({
        title: t.dashboard.participant.toasts.rejoin.error.title,
        description: enterMsg,
        variant: "destructive",
      })
      return
    }

    if (!signupEnabled) {
      const msg = t.dashboard.participant.toasts.actionNotAllowed.description
      setRejoinError(msg)
      toast({
        title: t.dashboard.participant.toasts.actionNotAllowed.title,
        description: msg,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    setRejoinError("")
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"

      // Check team capacity before attempting to join
      try {
        const checkResponse = await fetch(`${apiUrl}/teams/${rejoinCode}/members`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        })

        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          if (checkData.members && checkData.members.length >= 4) {
            const msg = locale === "es"
              ? "El equipo está lleno (4/4) — no se pueden añadir más miembros"
              : "Team is full (4/4) — cannot add more members"
            setRejoinError(msg)
            toast({
              title: t.dashboard.participant.toasts.rejoin.error.title,
              description: msg,
              variant: "destructive",
            })
            setSaving(false)
            return
          }
        }
      } catch (err) {
        // If capacity check fails for some reason, continue to attempt join and let the API handle it
        console.error("Capacity check failed:", err)
      }

      // Join team with code
      const uidToSend = userId || auth.currentUser?.uid
      if (!uidToSend) {
        const msg = locale === "es"
          ? "No se pudo determinar el usuario. Vuelve a iniciar sesión e inténtalo de nuevo."
          : "Unable to determine user. Please sign in again and try."
        setRejoinError(msg)
        toast({
          title: t.dashboard.participant.toasts.rejoin.error.title,
          description: msg,
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      const response = await fetch(`${apiUrl}/teams/${rejoinCode}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: uidToSend }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error joining team")
      }

      // Reload page to get updated team data
      window.location.reload()
    } catch (error: any) {
      console.error("Error joining team:", error)
      const msg = error.message || t.dashboard.participant.toasts.rejoin.error.description
      setRejoinError(msg)
      toast({
        title: t.dashboard.participant.toasts.rejoin.error.title,
        description: msg,
        variant: "destructive",
      })
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
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <Users className="w-16 h-16 text-brand-orange/60" />
          <div className="text-center space-y-2 max-w-md">
            <p className="text-brand-yellow font-pixel text-lg">
              {locale === "es" ? "Sin equipo asignado" : "No team assigned"}
            </p>
            <p className="text-brand-cyan/90 text-sm">
              {locale === "es"
                ? "Se te asignará un equipo próximamente. ¡Estate atento!"
                : "You will be assigned a team soon. Stay tuned!"}
            </p>
          </div>
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
        <div className="flex flex-row flex-wrap items-center justify-between border-b border-brand-cyan/20 pb-4 gap-3">
          <div className="flex flex-col items-start gap-3 w-full">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full">
              <div className="flex flex-row items-center gap-2 min-w-0 w-full mb-2 sm:mb-0">
                <Users className="w-6 h-6 text-brand-cyan" />
                <h3 className="font-pixel text-lg text-brand-yellow break-words whitespace-normal">{team.name}</h3>
                <button
                  onClick={handleEditTeam}
                  disabled={!signupEnabled}
                  className={`p-2 rounded transition-colors flex items-center ${signupEnabled ? 'hover:bg-brand-cyan/10 text-brand-cyan/70 hover:text-brand-cyan' : 'text-brand-cyan/30 cursor-not-allowed'} whitespace-nowrap`}
                  title={signupEnabled ? (isAdmin ? "Edit team" : (locale === "es" ? "Solicitar cambio de nombre" : "Request name change")) : (locale === "es" ? "Inscripciones cerradas" : "Signup disabled")}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              {team.status && (
                <div className={`flex items-center px-4 py-2 rounded-full border font-pixel text-xs sm:text-sm ${getStatusColor(team.status)} whitespace-nowrap mb-2 sm:mb-0`}>
                  {capitalizeStatus(team.status)}
                </div>
              )}

            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full justify-between"> {/* was items-center */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-2 sm:gap-4 min-w-0"> {/* was items-center */}
                {teamCategoryId ? (
                  <div className="flex items-center gap-2 font-pixel text-xs sm:text-md min-w-0 break-words whitespace-normal"> {/* was text-sm */}
                    {(() => {
                      const IconComponent = (LucideIcons as any)[teamCategoryIconName] || (LucideIcons as any).Tag
                      return <IconComponent className="h-4 w-4 text-brand-cyan/70" />
                    })()}
                    <span className="text-brand-cyan">Category: </span>
                    <span className="text-brand-cyan/70 break-words whitespace-normal">{teamCategoryLabel}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-pixel text-xs sm:text-md text-brand-cyan/40 italic"> {/* was text-sm */}
                    <LucideIcons.Clock className="h-4 w-4" />
                    <span>{locale === "es" ? "Categoría pendiente de asignación" : "Category pending assignment"}</span>
                  </div>
                )}
                {(team as any)?.assignedRoom && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded flex-row">
                    <LucideIcons.MapPin className="h-4 w-4 text-brand-orange" />
                    <span className="text-brand-orange font-pixel text-xs uppercase">{locale === "es" ? "Aula:" : "Room:"}</span>
                    <span className="text-brand-cyan font-pixel text-xs">{(team as any).assignedRoom}</span>
                  </div>
                )}
                <button
                  onClick={handleCopyTeamCode}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-brand-cyan/10 text-brand-cyan/70 hover:text-brand-cyan transition-colors border border-brand-cyan/20 break-words whitespace-normal"
                  title={locale === "es" ? "Copiar código del equipo" : "Copy team code"}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs sm:text-md font-pixel text-green-400"> {/* was text-xs */}
                        {t?.dashboard?.participant?.toasts?.copyTeamCode?.success?.title ?? (locale === "es" ? "Copiado" : "Copied")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs sm:text-md font-pixel"> {/* was text-xs */}
                        {t?.dashboard?.participant?.toasts?.copyTeamCode?.button ?? (locale === "es" ? "Copiar código del equipo" : "Copy team code")}
                      </span>
                    </>
                  )}
                </button>

              </div>
            </div>


          </div>

        </div>

        <div className="space-y-3">
          <h4 className="font-pixel text-xs text-brand-cyan"> {/* was text-sm */}
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
                  {/* Eliminar miembros y admin removidos */}
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
              <Label className="text-brand-cyan text-xs">Motivation</Label>
              <div className="bg-brand-navy/50 border border-brand-cyan/30 rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto text-brand-cyan text-sm break-words break-all whitespace-pre-wrap">
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
