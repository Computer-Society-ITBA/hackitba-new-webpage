"use client"

import { useState, useEffect, useMemo } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { Users, Crown, UserCircle, Trash2, Edit2, X, Settings, Copy, Check } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { User } from "@/lib/firebase/types"
import { PixelButton } from "@/components/ui/pixel-button"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAuth } from "firebase/auth"
import { useRouter, useParams } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { cn } from "@/lib/utils"
import { getCategoryByLegacyIndex, sortCategoriesByLegacyIndex } from "@/lib/categories/legacy-category-mapping"

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

interface TeamNote {
  id: string
  text: string
  authorId: string
  authorRole: "mentor" | "judge" | "admin"
  createdAt: string | null
  author?: {
    id: string
    name?: string
    surname?: string
  }
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
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesPage, setNotesPage] = useState(1)
  const [notesTotalPages, setNotesTotalPages] = useState(1)
  const [notesTotalItems, setNotesTotalItems] = useState(0)
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "false" && process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== "0"
  const db = getDbClient()
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "es"
  const t = getTranslations(locale)
  const isAcceptedTeam = useMemo(() => {
    const status = (team?.status || "").toLowerCase()
    return status === "accepted" || status === "approved"
  }, [team?.status])

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
      const cats = categoriesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as any[]
      setCategories(sortCategoriesByLegacyIndex(cats))
    }

    loadCategories()
  }, [db])

  useEffect(() => {
    setNotesPage(1)
  }, [userTeamLabel])

  useEffect(() => {
    const loadTeamNotes = async () => {
      if (!userTeamLabel || !isAcceptedTeam) {
        setTeamNotes([])
        setNotesTotalPages(1)
        setNotesTotalItems(0)
        return
      }

      setNotesLoading(true)
      try {
        const auth = getAuth()
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) {
          throw new Error(locale === "es" ? "No se pudo obtener sesion autenticada" : "Could not get authenticated session")
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
        const response = await fetch(`${apiUrl}/teams/${userTeamLabel}/notes?page=${notesPage}&pageSize=10`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || (locale === "es" ? "No se pudieron cargar las notas" : "Could not load notes"))
        }

        const payload = await response.json()
        setTeamNotes(Array.isArray(payload?.notes) ? payload.notes : [])
        setNotesTotalPages(typeof payload?.totalPages === "number" ? payload.totalPages : 1)
        setNotesTotalItems(typeof payload?.count === "number" ? payload.count : 0)
      } catch (error: any) {
        setTeamNotes([])
        setNotesTotalPages(1)
        setNotesTotalItems(0)
        toast({
          title: locale === "es" ? "Error al cargar notas" : "Error loading notes",
          description: error?.message || (locale === "es" ? "Ocurrio un error inesperado." : "Unexpected error."),
          variant: "destructive",
        })
      } finally {
        setNotesLoading(false)
      }
    }

    loadTeamNotes()
  }, [isAcceptedTeam, locale, notesPage, userTeamLabel])

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

  const resolveCategoryIdFromIndex = (index: number) => {
    if (index < 0) return ""
    return getCategoryByLegacyIndex(categories, index)?.id || ""
  }

  const teamCategoryId = useMemo(() => {
    if (!team) return ""
    // Only accepted/approved teams show their admin-assigned category; pending teams show nothing.
    if (isAcceptedTeam && typeof team.category === "number") {
      return resolveCategoryIdFromIndex(team.category)
    }
    return ""
  }, [team, categories, isAcceptedTeam])

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

  const formatNoteDate = (value: string | null) => {
    if (!value) return locale === "es" ? "Sin fecha" : "No date"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(locale === "es" ? "es-AR" : "en-US")
  }

  const getRoleLabel = (role: TeamNote["authorRole"]) => {
    if (role === "mentor") return locale === "es" ? "Mentor" : "Mentor"
    if (role === "judge") return locale === "es" ? "Jurado" : "Judge"
    return locale === "es" ? "Admin" : "Admin"
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
      <div className="space-y-8">
        {!signupEnabled && (
          <div className="p-3 bg-brand-orange/10 border border-brand-orange/30 rounded-lg">
            <p className="text-brand-orange text-xs font-pixel text-center uppercase tracking-wider">
              {locale === "es" ? "Inscripciones cerradas" : "Signup disabled"}
            </p>
          </div>
        )}

        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 group">
                <Users className="w-5 h-5 text-brand-cyan shrink-0" />
                <h3 className="text-2xl font-bold text-brand-yellow break-words leading-tight">
                  {team.name}
                </h3>
                <button
                  onClick={handleEditTeam}
                  disabled={!signupEnabled}
                  className={cn(
                    "p-1.5 rounded-md transition-all shrink-0",
                    signupEnabled
                      ? "hover:bg-brand-cyan/10 text-brand-cyan/40 hover:text-brand-cyan"
                      : "text-brand-cyan/10 cursor-not-allowed"
                  )}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {team.status && (
              <div className={cn(
                "px-4 py-1.5 rounded-full border text-xs font-pixel uppercase tracking-widest whitespace-nowrap self-start md:self-center",
                getStatusColor(team.status) || "border-brand-cyan/20 text-brand-cyan/60"
              )}>
                {capitalizeStatus(team.status)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {teamCategoryId ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-cyan/5 border border-brand-cyan/20 rounded-md text-xs">
                {(() => {
                  const IconComponent = (LucideIcons as any)[teamCategoryIconName] || LucideIcons.Tag
                  return <IconComponent className="h-3.5 w-3.5 text-brand-cyan/60" />
                })()}
                <span className="text-brand-cyan/60">{locale === "es" ? "Categoría:" : "Category:"}</span>
                <span className="text-brand-cyan font-medium">{teamCategoryLabel}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-cyan/5 border border-brand-cyan/10 rounded-md text-xs text-brand-cyan/40 italic">
                <LucideIcons.Clock className="h-3.5 w-3.5" />
                <span>{locale === "es" ? "Categoría pendiente" : "Category pending"}</span>
              </div>
            )}

            {(team as any)?.assignedRoom && (
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-orange/5 border border-brand-orange/20 rounded-md text-xs">
                <LucideIcons.MapPin className="h-3.5 w-3.5 text-brand-orange/60" />
                <span className="text-brand-orange/60 font-medium uppercase text-xs">{locale === "es" ? "Aula" : "Room"}</span>
                <span className="text-brand-cyan font-bold">{(team as any).assignedRoom}</span>
              </div>
            )}

            <button
              onClick={handleCopyTeamCode}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md transition-all border text-xs group",
                copied
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-brand-cyan/5 border-brand-cyan/20 text-brand-cyan/60 hover:border-brand-cyan/40 hover:text-brand-cyan"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.dashboard.participant.toasts.copyTeamCode.success.title}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.dashboard.participant.toasts.copyTeamCode.button}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-4 pt-4 border-t border-brand-cyan/10">
          <div className="flex items-center justify-between">
            <h4 className="font-pixel text-xs text-brand-cyan/40 uppercase tracking-widest">
              Team Members ({members.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  member.id === userId
                    ? "border-brand-cyan/40 bg-brand-cyan/5"
                    : "border-brand-cyan/10 bg-black/20 hover:border-brand-cyan/30"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center shrink-0">
                  {member.id === team?.admin_id ? (
                    <Crown className="w-4 h-4 text-brand-yellow" />
                  ) : (
                    <UserCircle className="w-4 h-4 text-brand-cyan/60" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-cyan truncate">
                    {member.name} {member.surname}
                    {member.id === userId && (
                      <span className="text-xs text-brand-cyan/40 ml-2">YOU</span>
                    )}
                  </p>
                  <p className="text-xs text-brand-cyan/40 truncate">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Notes */}
        {isAcceptedTeam && (
          <div className="space-y-4 pt-4 border-t border-brand-cyan/10">
            <h4 className="font-pixel text-xs text-brand-cyan/40 uppercase tracking-widest">
              {locale === "es" ? "Notas del equipo" : "Team notes"}
            </h4>

            {notesLoading ? (
              <div className="flex items-center justify-center p-8 bg-black/20 rounded-lg border border-brand-cyan/5">
                <p className="text-xs font-pixel text-brand-cyan/40 animate-pulse uppercase tracking-widest">
                  {locale === "es" ? "Cargando notas..." : "Loading notes..."}
                </p>
              </div>
            ) : teamNotes.length === 0 ? (
              <div className="p-8 bg-black/20 rounded-lg border border-brand-cyan/5 text-center">
                <p className="text-xs text-brand-cyan/40">
                  {locale === "es" ? "Aún no hay notas para este equipo." : "No notes for this team yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {teamNotes.map((note) => {
                    const fullName = [note.author?.name, note.author?.surname].filter(Boolean).join(" ")
                    const authorLabel = fullName || note.author?.id || note.authorId
                    return (
                      <div key={note.id} className="rounded-lg border border-brand-cyan/10 bg-black/30 overflow-hidden">
                        <div className="p-4 overflow-hidden break-words">
                          <MarkdownRenderer content={note.text} />
                        </div>
                        <div className="px-4 py-2 bg-brand-cyan/5 border-t border-brand-cyan/5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-xs font-bold text-brand-cyan/70 uppercase">{authorLabel}</span>
                          <span className="h-1 w-1 rounded-full bg-brand-cyan/20 shrink-0" />
                          <span className="text-xs text-brand-cyan/40 uppercase tracking-wide">
                            {getRoleLabel(note.authorRole)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-brand-cyan/20 shrink-0" />
                          <span className="text-xs text-brand-cyan/40">
                            {formatNoteDate(note.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {notesTotalPages > 1 && (
                  <div className="pt-2">
                    <PaginationControls
                      page={notesPage}
                      totalPages={notesTotalPages}
                      onPageChange={(nextPage) => {
                        if (notesLoading) return
                        setNotesPage(nextPage)
                      }}
                      totalItems={notesTotalItems}
                      pageSize={10}
                      locale={locale}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
