"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { getDbClient } from "@/lib/firebase/client-config"
import type { Locale } from "@/lib/i18n/config"
import { toast } from "@/hooks/use-toast"
import { Search, School, Users, UserCircle2, Mail, GraduationCap, ArrowLeft, PlusCircle, MessageSquare } from "lucide-react"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PixelButton } from "@/components/ui/pixel-button"
import Image from "next/image"

interface TeamDoc {
  id: string
  name?: string
  assignedRoom?: string
  status?: string
  participantIds?: string[]
}

interface ParticipantDoc {
  id: string
  name?: string
  surname?: string
  email?: string
  team?: string | null
  university?: string
  career?: string
  age?: number
}

interface TeamNote {
  id: string
  text: string
  createdAt: string | null
  updatedAt?: string | null
  authorRole: "mentor" | "judge" | "admin"
  author?: {
    name?: string
    surname?: string
    id: string
  }
}

interface MentorTeamsDashboardProps {
  locale: Locale
}

export function MentorTeamsDashboard({ locale }: MentorTeamsDashboardProps) {
  const db = getDbClient()

  const [teams, setTeams] = useState<TeamDoc[]>([])
  const [participantsByTeam, setParticipantsByTeam] = useState<Record<string, ParticipantDoc[]>>({})
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Note creation state
  const [noteText, setNoteText] = useState("")
  const [savingNote, setSavingNote] = useState(false)

  // Note history state
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesPage, setNotesPage] = useState(1)
  const [notesTotalPages, setNotesTotalPages] = useState(1)
  const [notesTotalItems, setNotesTotalItems] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      if (!db) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [teamsSnap, participantsSnap] = await Promise.all([
          getDocs(collection(db, "teams")),
          getDocs(query(collection(db, "users"), where("role", "==", "participant"))),
        ])

        const teamsData: TeamDoc[] = teamsSnap.docs.map((teamDoc) => {
          const data = teamDoc.data() as Omit<TeamDoc, "id">
          return {
            id: teamDoc.id,
            ...data,
          }
        })

        const participantsData: ParticipantDoc[] = participantsSnap.docs.map((participantDoc) => {
          const data = participantDoc.data() as Omit<ParticipantDoc, "id">
          return {
            id: participantDoc.id,
            ...data,
          }
        })

        const participantsById = new Map(participantsData.map((p) => [p.id, p]))
        const grouped: Record<string, ParticipantDoc[]> = {}

        for (const participant of participantsData) {
          const teamId = participant.team || ""
          if (!teamId) continue
          grouped[teamId] = grouped[teamId] || []
          grouped[teamId].push(participant)
        }

        // Fallback for legacy data
        for (const team of teamsData) {
          if (grouped[team.id]?.length) continue
          if (!Array.isArray(team.participantIds) || team.participantIds.length === 0) continue

          const members = team.participantIds
            .map((participantId) => participantsById.get(participantId))
            .filter((participant): participant is ParticipantDoc => Boolean(participant))

          if (members.length > 0) {
            grouped[team.id] = members
          }
        }

        for (const teamId of Object.keys(grouped)) {
          grouped[teamId].sort((a, b) => {
            const aName = `${a.name || ""} ${a.surname || ""}`.trim().toLowerCase()
            const bName = `${b.name || ""} ${b.surname || ""}`.trim().toLowerCase()
            return aName.localeCompare(bName)
          })
        }

        teamsData.sort((a, b) => {
          const roomA = (a.assignedRoom || "").toLowerCase()
          const roomB = (b.assignedRoom || "").toLowerCase()
          if (roomA !== roomB) return roomA.localeCompare(roomB)
          return (a.name || a.id).toLowerCase().localeCompare((b.name || b.id).toLowerCase())
        })

        setTeams(teamsData)
        setParticipantsByTeam(grouped)
      } catch (error) {
        console.error("Error loading mentor teams:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [db])

  const loadTeamNotes = async (teamId: string, page: number) => {
    setNotesLoading(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error("No id token")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const res = await fetch(`${apiUrl}/teams/${teamId}/notes?page=${page}&pageSize=10`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      })

      if (!res.ok) throw new Error("Could not load notes")

      const payload = await res.json()
      setTeamNotes(payload.notes || [])
      setNotesPage(payload.page || page)
      setNotesTotalPages(payload.totalPages || 1)
      setNotesTotalItems(payload.count || 0)
    } catch (error) {
      console.error("Error loading notes:", error)
      setTeamNotes([])
    } finally {
      setNotesLoading(false)
    }
  }

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamNotes(selectedTeamId, 1)
      setNoteText("")
    }
  }, [selectedTeamId])

  const handleCreateNote = async () => {
    if (!selectedTeamId) return

    const trimmedText = noteText.trim()
    if (!trimmedText) return

    setSavingNote(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error("No id token")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const res = await fetch(`${apiUrl}/teams/${selectedTeamId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text: trimmedText }),
      })

      if (!res.ok) throw new Error("Failed to save note")

      setNoteText("")
      toast({ title: locale === "es" ? "Nota guardada" : "Note saved" })
      loadTeamNotes(selectedTeamId, 1)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSavingNote(false)
    }
  }

  const filteredTeams = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return teams

    return teams.filter((team) => {
      return (team.name || "").toLowerCase().includes(term) ||
        (team.assignedRoom || "").toLowerCase().includes(term)
    })
  }, [teams, search])

  const selectedTeam = useMemo(() => {
    return teams.find(t => t.id === selectedTeamId) || null
  }, [teams, selectedTeamId])

  const selectedParticipants = selectedTeamId ? participantsByTeam[selectedTeamId] || [] : []

  if (selectedTeam) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-cyan/10">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-3xl font-bold text-brand-yellow font-pixel truncate">
              {selectedTeam.name || selectedTeam.id}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-orange/5 border border-brand-orange/20 rounded-md text-sm">
              <School className="w-4 h-4 text-brand-orange/60" />
              <span className="text-brand-orange/60 font-pixel uppercase text-xs">{locale === "es" ? "Aula" : "Room"}</span>
              <span className="text-brand-orange font-pixel font-bold">{selectedTeam.assignedRoom || "-"}</span>
            </div>

            <button
              onClick={() => setSelectedTeamId(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-cyan/20 text-brand-cyan/60 hover:bg-brand-cyan/10 hover:text-brand-cyan transition-all text-sm"
            >
              <div className={`relative w-4 h-4 rotate-90 flex-shrink-0`}>
                <Image src="/images/flecha-abajo.png" alt="Arrow" fill className="object-contain" />
              </div>
              <span className="text-xs font-pixel tracking-wider">{locale === "es" ? "Volver" : "Back"}</span>
            </button>
          </div>
        </div>

        <div >
          {/* Main: Notes and Participants */}
          <div className="space-y-6">

            <GlassCard className="p-6 border-brand-cyan/30 bg-brand-navy/60">
              <h3 className="font-pixel text-brand-yellow text-xl mb-6 flex items-center gap-4">
                <Users className="w-5 h-5" />
                {locale === "es" ? "Participantes" : "Participants"}
              </h3>

              <div className="overflow-hidden rounded-lg border border-brand-cyan/10">
                <Table>
                  <TableHeader className="bg-brand-navy/80">
                    <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                      <TableHead className="text-brand-yellow font-pixel text-xs">{locale === "es" ? "Nombre" : "Name"}</TableHead>
                      <TableHead className="text-brand-yellow font-pixel text-xs">{locale === "es" ? "Universidad / Escuela" : "University / School"}</TableHead>
                      <TableHead className="text-brand-yellow font-pixel text-xs">{locale === "es" ? "Email" : "Email"}</TableHead>
                      <TableHead className="text-brand-yellow font-pixel text-xs text-right">{locale === "es" ? "Edad" : "Age"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedParticipants.map(participant => (
                      <TableRow key={participant.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                        <TableCell className="font-semibold text-brand-cyan">
                          {participant.name} {participant.surname}
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">
                          {participant.university || "-"}
                        </TableCell>
                        <TableCell className="text-brand-cyan/80 font-mono text-xs">
                          {participant.email}
                        </TableCell>
                        <TableCell className="text-brand-cyan/80 text-right">
                          {participant.age || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-brand-yellow/30 bg-brand-navy/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-pixel text-brand-yellow text-xl flex items-center gap-4">
                  <MessageSquare className="w-5 h-5" />
                  {locale === "es" ? "Notas del Equipo" : "Team Notes"}
                </h3>
              </div>

              <div className="space-y-4">
                <MarkdownEditor
                  value={noteText}
                  onChange={setNoteText}
                  placeholder={locale === "es" ? "Escribe una nueva nota..." : "Write a new note..."}
                  disabled={savingNote}
                  className="min-h-40"
                />
                <div className="flex justify-end">
                  <PixelButton onClick={handleCreateNote} disabled={savingNote || !noteText.trim()}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {savingNote ? (locale === "es" ? "Guardando..." : "Saving...") : (locale === "es" ? "Agregar Nota" : "Add Note")}
                  </PixelButton>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-brand-cyan/20 space-y-6">
                <h4 className="font-pixel text-brand-cyan text-lg uppercase tracking-wider">
                  {locale === "es" ? "Historial de Notas" : "Note History"}
                </h4>

                {notesLoading ? (
                  <div className="py-10 text-center animate-pulse text-brand-cyan/50">{locale === "es" ? "Cargando notas..." : "Loading notes..."}</div>
                ) : teamNotes.length === 0 ? (
                  <div className="py-10 text-center text-brand-cyan/30 italic">{locale === "es" ? "No hay notas aún." : "No notes yet."}</div>
                ) : (
                  <div className="space-y-4">
                    {teamNotes.map(note => {
                      const authorLabel = note.author?.name ? `${note.author.name} ${note.author.surname || ""}` : note.authorRole
                      return (
                        <div key={note.id} className="rounded-lg border border-brand-cyan/10 bg-black/30 overflow-hidden">
                          <div className="p-4 overflow-hidden break-words">
                            <MarkdownRenderer content={note.text} />
                          </div>
                          <div className="px-4 py-2 bg-brand-cyan/5 border-t border-brand-cyan/5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-xs font-bold text-brand-cyan/70 uppercase">{authorLabel}</span>
                            <span className="h-1 w-1 rounded-full bg-brand-cyan/20 shrink-0" />
                            <span className="text-xs font-pixel text-brand-cyan/40 uppercase tracking-wide">
                              {note.authorRole}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-brand-cyan/20 shrink-0" />
                            <span className="text-xs text-brand-cyan/40">
                              {note.createdAt ? new Date(note.createdAt).toLocaleString(locale === "es" ? "es-AR" : "en-US") : ""}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {notesTotalPages > 1 && (
                      <PaginationControls
                        page={notesPage}
                        totalPages={notesTotalPages}
                        onPageChange={p => loadTeamNotes(selectedTeamId!, p)}
                        totalItems={notesTotalItems}
                        pageSize={10}
                        locale={locale}
                      />
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/50" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={locale === "es" ? "Buscar por nombre o aula..." : "Search by name or room..."}
            className="pl-9 bg-brand-navy/60 border-brand-cyan/20 h-10 text-sm"
          />
        </div>
      </div>

      <GlassCard className="overflow-hidden border-brand-cyan/20 bg-brand-navy/40 shadow-2xl">
        {loading ? (
          <div className="py-20 text-center font-pixel text-brand-cyan text-lg animate-pulse">
            {locale === "es" ? "Cargando equipos..." : "Loading teams..."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-brand-navy/80 hover:bg-transparent">
                <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                  <TableHead className="text-brand-cyan/50 font-bold text-xs h-10 px-4 pl-6">{locale === "es" ? "Acciones" : "Actions"}</TableHead>
                  <TableHead className="text-brand-cyan/50 font-bold text-xs h-10 px-4">{locale === "es" ? "Nombre del Equipo" : "Team Name"}</TableHead>
                  <TableHead className="text-brand-cyan/50 font-bold text-xs h-10 px-4">{locale === "es" ? "Aula" : "Room"}</TableHead>
                  <TableHead className="text-brand-cyan/50 font-bold text-xs h-10 px-4 text-center">{locale === "es" ? "Miembros" : "Members"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-brand-cyan/40 italic">
                      {locale === "es" ? "No se encontraron equipos." : "No teams found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => {
                    const membersCount = (participantsByTeam[team.id] || []).length
                    return (
                      <TableRow key={team.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5 group divide-x divide-brand-cyan/5 transition-colors">
                        <TableCell className="pl-6 py-2">
                          <PixelButton size="sm" onClick={() => setSelectedTeamId(team.id)}>
                            {locale === "es" ? "Ver Detalles" : "See Details"}
                          </PixelButton>
                        </TableCell>
                        <TableCell className="py-2">
                          <button
                            onClick={() => setSelectedTeamId(team.id)}
                            className="text-brand-yellow font-medium hover:underline transition-colors text-sm"
                          >
                            {team.name || team.id}
                          </button>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2 text-brand-cyan/80 text-sm">
                            <School className="w-3.5 h-3.5 text-brand-orange/60" />
                            {team.assignedRoom || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan text-xs font-pixel">
                              <Users className="w-3 h-3 text-brand-cyan/60" />
                              {membersCount}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
