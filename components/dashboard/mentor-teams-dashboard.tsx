"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { GlassCard } from "@/components/ui/glass-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { getDbClient } from "@/lib/firebase/client-config"
import type { Locale } from "@/lib/i18n/config"
import { toast } from "@/hooks/use-toast"
import { Search, School, Users, UserCircle2, Mail, GraduationCap, Hash } from "lucide-react"

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
  authorRole: "mentor" | "judge" | "admin"
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
  const [noteText, setNoteText] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [myNotesOpen, setMyNotesOpen] = useState(false)
  const [myNotesLoading, setMyNotesLoading] = useState(false)
  const [myNotes, setMyNotes] = useState<TeamNote[]>([])
  const [myNotesPage, setMyNotesPage] = useState(1)
  const [myNotesTotalPages, setMyNotesTotalPages] = useState(1)
  const [myNotesTotalItems, setMyNotesTotalItems] = useState(0)

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

        // Fallback for legacy data where user.team may be missing but team.participantIds is present.
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

  const filteredTeams = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return teams

    return teams.filter((team) => {
      return [
        team.name || "",
        team.id,
        team.assignedRoom || "",
        team.status || "",
      ].some((value) => value.toLowerCase().includes(term))
    })
  }, [teams, search])

  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null
    return teams.find((team) => team.id === selectedTeamId) || null
  }, [teams, selectedTeamId])

  const selectedParticipants = selectedTeam ? participantsByTeam[selectedTeam.id] || [] : []

  const handleCreateNote = async () => {
    if (!selectedTeam) return

    const trimmedText = noteText.trim()
    if (!trimmedText) {
      toast({
        title: locale === "es" ? "Nota vacia" : "Empty note",
        description: locale === "es" ? "Escribe un texto para guardar la nota." : "Write some text before saving the note.",
        variant: "destructive",
      })
      return
    }

    setSavingNote(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error(locale === "es" ? "No se pudo obtener sesion autenticada" : "Could not get authenticated session")
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/teams/${selectedTeam.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text: trimmedText }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || (locale === "es" ? "No se pudo crear la nota" : "Could not create note"))
      }

      setNoteText("")
      toast({
        title: locale === "es" ? "Nota guardada" : "Note saved",
        description: locale === "es" ? "La nota se guardo correctamente." : "The note was saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: locale === "es" ? "Error al guardar nota" : "Error saving note",
        description: error?.message || (locale === "es" ? "Ocurrio un error inesperado." : "Unexpected error."),
        variant: "destructive",
      })
    } finally {
      setSavingNote(false)
    }
  }

  const loadMyNotes = async (targetPage: number) => {
    if (!selectedTeam) return

    setMyNotesLoading(true)
    try {
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        throw new Error(locale === "es" ? "No se pudo obtener sesion autenticada" : "Could not get authenticated session")
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
      const response = await fetch(`${apiUrl}/teams/${selectedTeam.id}/notes/mine?page=${targetPage}&pageSize=10`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || (locale === "es" ? "No se pudieron cargar tus notas" : "Could not load your notes"))
      }

      const payload = await response.json()
      const notes = Array.isArray(payload?.notes) ? payload.notes : []
      setMyNotes(notes)
      setMyNotesPage(typeof payload?.page === "number" ? payload.page : targetPage)
      setMyNotesTotalPages(typeof payload?.totalPages === "number" ? payload.totalPages : 1)
      setMyNotesTotalItems(typeof payload?.count === "number" ? payload.count : 0)
    } catch (error: any) {
      setMyNotes([])
      setMyNotesPage(1)
      setMyNotesTotalPages(1)
      setMyNotesTotalItems(0)
      toast({
        title: locale === "es" ? "Error al cargar notas" : "Error loading notes",
        description: error?.message || (locale === "es" ? "Ocurrio un error inesperado." : "Unexpected error."),
        variant: "destructive",
      })
    } finally {
      setMyNotesLoading(false)
    }
  }

  const openMyNotesModal = async () => {
    setMyNotesOpen(true)
    await loadMyNotes(1)
  }

  const formatNoteDate = (value: string | null) => {
    if (!value) return locale === "es" ? "Sin fecha" : "No date"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(locale === "es" ? "es-AR" : "en-US")
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h3 className="font-pixel text-brand-yellow text-lg mb-1">
              {locale === "es" ? "Listado de equipos" : "Teams list"}
            </h3>
            <p className="text-sm text-brand-cyan/70">
              {locale === "es"
                ? "Selecciona un equipo para ver sus participantes."
                : "Select a team to view its participants."}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/50" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "es" ? "Buscar por equipo, aula o estado" : "Search by team, room or status"}
              className="pl-9 bg-brand-navy/30 border-brand-cyan/30"
            />
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-6">
          <p className="font-pixel text-brand-cyan">{locale === "es" ? "Cargando equipos..." : "Loading teams..."}</p>
        </GlassCard>
      ) : filteredTeams.length === 0 ? (
        <GlassCard className="p-6">
          <p className="text-brand-cyan/80">{locale === "es" ? "No se encontraron equipos." : "No teams found."}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTeams.map((team) => {
            const membersCount = (participantsByTeam[team.id] || []).length
            const isSelected = team.id === selectedTeamId

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className="text-left h-full"
              >
                <GlassCard
                  className={`p-4 transition-colors border h-full min-h-[142px] ${isSelected ? "border-brand-yellow/60" : "border-brand-cyan/20 hover:border-brand-cyan/40"}`}
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4
                          className="font-pixel text-brand-cyan text-base leading-tight"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {team.name || team.id}
                        </h4>
                        <p className="text-[11px] text-brand-cyan/50 mt-1 truncate">ID: {team.id}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-pixel px-2 py-1 rounded-sm bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan flex-shrink-0">
                        <Users className="w-3 h-3" />
                        {membersCount}
                      </span>
                    </div>

                    <div className="mt-auto pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-brand-yellow">
                        <School className="w-3.5 h-3.5" />
                        <span>{locale === "es" ? "Aula:" : "Room:"} {team.assignedRoom || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-cyan/80">
                        <Hash className="w-3.5 h-3.5" />
                        <span>{locale === "es" ? "Estado:" : "Status:"} {team.status || "-"}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </button>
            )
          })}
        </div>
      )}

      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeamId(null)}>
        <DialogContent className="bg-brand-navy border-brand-yellow/30 text-brand-cyan max-w-4xl">
          {selectedTeam && (
            <>
              <DialogHeader>
                <DialogTitle className="font-pixel text-brand-yellow text-lg">
                  {locale === "es" ? "Participantes del equipo" : "Team participants"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <p className="text-sm text-brand-cyan/70">
                  {(selectedTeam.name || selectedTeam.id)} · {locale === "es" ? "Aula" : "Room"}: {selectedTeam.assignedRoom || "-"}
                </p>
                <span className="text-sm text-brand-cyan/80 font-pixel">
                  {selectedParticipants.length} {locale === "es" ? "participantes" : "participants"}
                </span>
              </div>

              <div className="rounded-lg border border-brand-yellow/30 bg-brand-navy/40 p-3 mb-4 space-y-2">
                <p className="text-sm font-pixel text-brand-yellow">
                  Add note
                </p>
                <Textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder={locale === "es" ? "Escribe una nota del equipo..." : "Write a team note..."}
                  className="min-h-20 bg-brand-navy/30 border-brand-cyan/30 text-brand-cyan"
                  disabled={savingNote}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openMyNotesModal}
                    className="mr-2 px-3 py-2 text-xs font-pixel rounded border border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
                  >
                    {locale === "es" ? "Ver mis notas" : "View my notes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    disabled={savingNote}
                    className="px-3 py-2 text-xs font-pixel rounded border border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20 disabled:opacity-50"
                  >
                    {savingNote
                      ? locale === "es" ? "Guardando..." : "Saving..."
                      : locale === "es" ? "Guardar nota" : "Save note"}
                  </button>
                </div>
              </div>

              {selectedParticipants.length === 0 ? (
                <p className="text-brand-cyan/70 text-sm">
                  {locale === "es"
                    ? "Este equipo todavia no tiene participantes vinculados."
                    : "This team has no linked participants yet."}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedParticipants.map((participant) => (
                    <div key={participant.id} className="rounded-lg border border-brand-cyan/20 bg-brand-navy/30 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 text-brand-cyan">
                          <UserCircle2 className="w-4 h-4" />
                          <p className="font-semibold">
                            {[participant.name, participant.surname].filter(Boolean).join(" ") || participant.id}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-brand-cyan/80 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {participant.email || "-"}
                      </p>

                      <p className="text-sm text-brand-cyan/80 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {[participant.university, participant.career].filter(Boolean).join(" · ") || (locale === "es" ? "Sin datos academicos" : "No academic details")}
                      </p>

                      <p className="text-xs text-brand-cyan/60">Age: {participant.age ?? "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={myNotesOpen} onOpenChange={setMyNotesOpen}>
        <DialogContent className="bg-brand-navy border-brand-yellow/30 text-brand-cyan max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-pixel text-brand-yellow text-lg">
              {locale === "es" ? "Mis notas" : "My notes"}
            </DialogTitle>
          </DialogHeader>

          {myNotesLoading ? (
            <p className="text-sm text-brand-cyan/70">{locale === "es" ? "Cargando notas..." : "Loading notes..."}</p>
          ) : myNotes.length === 0 ? (
            <p className="text-sm text-brand-cyan/70">{locale === "es" ? "No hiciste notas para este equipo aun." : "You have not created notes for this team yet."}</p>
          ) : (
            <>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {myNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-brand-cyan/20 bg-brand-navy/40 p-3">
                    <p className="text-sm text-brand-cyan whitespace-pre-wrap">{note.text}</p>
                    <p className="text-xs text-brand-cyan/60 mt-2">{formatNoteDate(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <PaginationControls
            page={myNotesPage}
            totalPages={myNotesTotalPages}
            onPageChange={(nextPage) => {
              if (myNotesLoading) return
              void loadMyNotes(nextPage)
            }}
            totalItems={myNotesTotalItems}
            pageSize={10}
            locale={locale}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
