"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { collection, onSnapshot, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDbClient } from "@/lib/firebase/client-config"
import type { Locale } from "@/lib/i18n/config"
import { useCategories } from "@/hooks/use-categories"
import { getCategoryByLegacyIndex } from "@/lib/categories/legacy-category-mapping"
import { cn } from "@/lib/utils"
import { FileText, Play, Github, ExternalLink, Brain, Landmark, Megaphone, Eye, Linkedin } from "lucide-react"

export default function GlobalLeaderboardPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const db = getDbClient()
  const { categories } = useCategories(locale)

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [teamParticipants, setTeamParticipants] = useState<any[]>([])
  const [loadingTeamParticipants, setLoadingTeamParticipants] = useState(false)
  const [showTeamDetails, setShowTeamDetails] = useState(false)

  useEffect(() => {
    if (!db) return

    const unsub = onSnapshot(collection(db, "projects"), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [db])

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "-"
    const category = getCategoryByLegacyIndex(categories, categoryId)
    return category ? (locale === "es" ? category.spanishName : category.englishName) : "-"
  }

  const getCategoryDisplay = (categoryId: string) => {
    const fullName = getCategoryName(categoryId)
    const normalized = fullName.trim().toLowerCase()

    if (normalized.includes("ai") || normalized.includes("artificial") || normalized.includes("inteligencia")) {
      return { fullName, shortName: "AI", icon: Brain }
    }
    if (normalized.includes("fin")) {
      return { fullName, shortName: "FinTech", icon: Landmark }
    }
    if (normalized.includes("market")) {
      return { fullName, shortName: "Marketing", icon: Megaphone }
    }

    return { fullName, shortName: fullName, icon: FileText }
  }

  const abbreviateProjectName = (title: string, minChars: number = 8) => {
    if (!title) return "Untitled"
    if (title.length <= minChars * 1.2) return title
    return title.substring(0, minChars) + "..."
  }

  const abbreviateTeamName = (name: string, minChars: number = 8) => {
    if (!name) return "-"
    if (name.length <= minChars * 1.2) return name
    return name.substring(0, minChars) + "..."
  }

  const rankedData = useMemo(() => {
    const reviewed = projects.filter(p => !p.disqualified && p.status === "reviewed")

    const finalists = reviewed
      .filter(p => p.isFinalist)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

    const rest = reviewed
      .filter(p => !p.isFinalist)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

    return { finalists, rest }
  }, [projects])

  const totalRows = rankedData.finalists.length + rankedData.rest.length

  const openProjectDetails = (project: any) => {
    setSelectedProject(project)
    setShowDetails(true)
  }

  const openTeamDetails = async (project: any) => {
    if (!db) return

    const teamId = project.teamId || project.team || null
    setSelectedTeam({ id: teamId, name: project.teamName || "-" })
    setTeamParticipants([])
    setShowTeamDetails(true)

    if (!teamId) return

    setLoadingTeamParticipants(true)
    try {
      const teamDoc = await getDoc(doc(db, "teams", teamId))
      const teamData = teamDoc.exists() ? { id: teamDoc.id, ...teamDoc.data() } : { id: teamId, name: project.teamName || "-" }
      setSelectedTeam(teamData)

      const participantMap = new Map<string, any>()

      const byTeamIdSnap = await getDocs(query(collection(db, "users"), where("teamId", "==", teamId)))
      byTeamIdSnap.docs.forEach(participantDoc => {
        participantMap.set(participantDoc.id, { id: participantDoc.id, ...participantDoc.data() })
      })

      const byTeamFieldSnap = await getDocs(query(collection(db, "users"), where("team", "==", teamId)))
      byTeamFieldSnap.docs.forEach(participantDoc => {
        participantMap.set(participantDoc.id, { id: participantDoc.id, ...participantDoc.data() })
      })

      const participantIds: string[] = Array.isArray((teamData as any).participantIds)
        ? (teamData as any).participantIds
        : []

      if (participantIds.length > 0) {
        await Promise.all(participantIds.map(async participantId => {
          if (participantMap.has(participantId)) return
          const participantDoc = await getDoc(doc(db, "users", participantId))
          if (participantDoc.exists()) {
            participantMap.set(participantDoc.id, { id: participantDoc.id, ...participantDoc.data() })
          }
        }))
      }

      const participants = Array.from(participantMap.values())
      participants.sort((a, b) => {
        const aName = `${a?.name || ""} ${a?.surname || ""}`.trim().toLowerCase()
        const bName = `${b?.name || ""} ${b?.surname || ""}`.trim().toLowerCase()
        return aName.localeCompare(bName)
      })
      setTeamParticipants(participants)
    } catch (error) {
      console.error("Error loading team participants:", error)
      setTeamParticipants([])
    } finally {
      setLoadingTeamParticipants(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["participant"]}>
      <DashboardLayout title={locale === "es" ? "Global Leaderboard" : "Global Leaderboard"}>
        <div className="space-y-6 w-full max-w-full">
          <GlassCard className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-pixel text-lg text-brand-yellow">
                {locale === "es" ? "Global Leaderboard" : "Global Leaderboard"}
              </h3>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs font-pixel text-brand-cyan animate-pulse">LOADING GLOBAL LEADERBOARD...</div>
            ) : totalRows === 0 ? (
              <div className="p-10 text-center text-xs font-pixel text-brand-cyan/40">
                {locale === "es" ? "No hay proyectos revisados aún." : "No reviewed projects yet."}
              </div>
            ) : (
              <div className="rounded-md border border-brand-cyan/20 overflow-x-auto bg-black/20 w-full max-w-full">
                <Table className="w-full min-w-0 md:min-w-[700px] table-auto text-xs md:text-sm [&_th]:px-1 [&_td]:px-1 md:[&_th]:px-2 md:[&_td]:px-2">
                  <TableHeader>
                    <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                      <TableHead className="text-brand-cyan w-[1%] whitespace-nowrap px-1.5 text-center">#</TableHead>
                      <TableHead className="hidden md:table-cell text-brand-cyan w-[1%] whitespace-nowrap text-center">Detail</TableHead>
                      <TableHead className="text-brand-cyan w-[1%] whitespace-nowrap md:w-[34%]">Project</TableHead>
                      <TableHead className="text-brand-cyan w-[1%] whitespace-nowrap md:w-[30%]">Team</TableHead>
                      <TableHead className="text-brand-cyan w-[1%] whitespace-nowrap md:w-[18%]">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedData.finalists.map((p, index) => (
                      <TableRow key={`f-${p.id}`} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                        <TableCell className="w-[1%] whitespace-nowrap px-1.5 text-brand-cyan/60 text-center font-bold">{index + 1}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <button
                            type="button"
                            onClick={() => openProjectDetails(p)}
                            className="inline-flex items-center gap-1 rounded border border-brand-cyan/40 bg-brand-cyan/10 px-2 py-1 text-[11px] text-brand-cyan transition-colors hover:bg-brand-cyan/20"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        </TableCell>
                        <TableCell className="font-medium text-brand-cyan">
                            {/* Mobile: abbreviated */}
                            <span
                              className="block max-w-[9ch] truncate cursor-pointer hover:underline md:hidden"
                              title={p.title || "Untitled"}
                              onClick={() => openProjectDetails(p)}
                            >
                              {abbreviateProjectName(p.title)}
                            </span>
                            {/* Desktop: full name */}
                            <span
                              className="hidden md:block truncate w-full cursor-pointer hover:underline"
                              title={p.title || "Untitled"}
                              onClick={() => openProjectDetails(p)}
                            >
                              {p.title || "Untitled"}
                            </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">
                          {/* Mobile: abbreviated */}
                          <span
                            className="block max-w-[9ch] truncate hover:underline cursor-pointer md:hidden"
                            title={p.teamName || "-"}
                            onClick={() => openTeamDetails(p)}
                          >
                            {abbreviateTeamName(p.teamName)}
                          </span>
                          {/* Desktop: full name */}
                          <span
                            className="hidden md:block truncate w-full hover:underline cursor-pointer"
                            title={p.teamName || "-"}
                            onClick={() => openTeamDetails(p)}
                          >
                            {p.teamName || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">
                          {(() => {
                            const category = getCategoryDisplay(p.categoryId)
                            const CategoryIcon = category.icon

                            return (
                              <>
                                <span className="hidden md:block truncate w-full" title={category.fullName}>
                                  {category.fullName}
                                </span>
                                <span className="md:hidden inline-flex items-center gap-1.5 whitespace-nowrap" title={category.fullName}>
                                  <CategoryIcon size={12} className="shrink-0" />
                                  <span>{category.shortName}</span>
                                </span>
                              </>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}

                    {rankedData.finalists.length > 0 && rankedData.rest.length > 0 && (
                      <TableRow className="border-brand-cyan/20 bg-brand-navy/40 hover:bg-brand-navy/40">
                        <TableCell colSpan={5} className="py-2">
                          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-brand-cyan/50 font-pixel">
                            <span className="h-px flex-1 bg-brand-cyan/20" />
                            <span className="text-center">
                              <div>{locale === "es" ? "Resto de equipos" : "Remaining teams"}</div>
                              <div className="text-[8px] text-brand-cyan/30 font-normal">{locale === "es" ? "(votados por staff)" : "(voted by staff)"}</div>
                            </span>
                            <span className="h-px flex-1 bg-brand-cyan/20" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {rankedData.rest.map((p, index) => (
                      <TableRow key={`r-${p.id}`} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                        <TableCell className="w-[1%] whitespace-nowrap px-1.5 text-brand-cyan/60 text-center font-bold">{rankedData.finalists.length + index + 1}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <button
                            type="button"
                            onClick={() => openProjectDetails(p)}
                            className="inline-flex items-center gap-1 rounded border border-brand-cyan/40 bg-brand-cyan/10 px-2 py-1 text-[11px] text-brand-cyan transition-colors hover:bg-brand-cyan/20"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        </TableCell>
                        <TableCell className="font-medium text-brand-cyan">
                            {/* Mobile: abbreviated */}
                            <span
                              className="block max-w-[9ch] truncate cursor-pointer hover:underline md:hidden"
                              title={p.title || "Untitled"}
                              onClick={() => openProjectDetails(p)}
                            >
                              {abbreviateProjectName(p.title)}
                            </span>
                            {/* Desktop: full name */}
                            <span
                              className="hidden md:block truncate w-full cursor-pointer hover:underline"
                              title={p.title || "Untitled"}
                              onClick={() => openProjectDetails(p)}
                            >
                              {p.title || "Untitled"}
                            </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">
                          {/* Mobile: abbreviated */}
                          <span
                            className="block max-w-[9ch] truncate hover:underline cursor-pointer md:hidden"
                            title={p.teamName || "-"}
                            onClick={() => openTeamDetails(p)}
                          >
                            {abbreviateTeamName(p.teamName)}
                          </span>
                          {/* Desktop: full name */}
                          <span
                            className="hidden md:block truncate w-full hover:underline cursor-pointer"
                            title={p.teamName || "-"}
                            onClick={() => openTeamDetails(p)}
                          >
                            {p.teamName || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-brand-cyan/80">
                          {(() => {
                            const category = getCategoryDisplay(p.categoryId)
                            const CategoryIcon = category.icon

                            return (
                              <>
                                <span className="hidden md:block truncate w-full" title={category.fullName}>
                                  {category.fullName}
                                </span>
                                <span className="md:hidden inline-flex items-center gap-1.5 whitespace-nowrap" title={category.fullName}>
                                  <CategoryIcon size={12} className="shrink-0" />
                                  <span>{category.shortName}</span>
                                </span>
                              </>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>
        </div>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="glass-effect border-brand-cyan/30 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="font-pixel text-brand-yellow flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <FileText size={18} />
                  <p className="text-regular font-pixel break-all leading-snug">{selectedProject?.title}</p>
                </div>
                <span className={cn(
                  "text-sm px-2 py-0.5 rounded uppercase self-start shrink-0",
                  selectedProject?.status === "submitted" ? "bg-green-500/20 text-green-400" :
                    selectedProject?.status === "reviewed" ? "bg-blue-500/20 text-blue-400" :
                      selectedProject?.status === "disqualified" ? "bg-red-500/20 text-red-500" :
                        "bg-yellow-500/20 text-yellow-400"
                )}>{selectedProject?.status}</span>
              </DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-brand-navy/60 border border-brand-cyan/10">
                    <p className="text-xs text-brand-cyan/60 uppercase mb-1">Team</p>
                    <p className="text-brand-yellow text-sm font-pixel break-all">{selectedProject.teamName}</p>
                  </div>
                  <div className="p-3 rounded bg-brand-navy/60 border border-brand-cyan/10">
                    <p className="text-xs text-brand-cyan/60 uppercase mb-1">Category</p>
                    <p className="text-brand-cyan text-sm break-words">{getCategoryName(selectedProject.categoryId)}</p>
                  </div>
                </div>

                <div className="p-4 rounded bg-black/40 border border-brand-cyan/10">
                  <p className="text-xs text-brand-cyan/60 uppercase mb-2">Description</p>
                  <p className="text-brand-cyan/80 text-sm whitespace-pre-wrap break-all">{selectedProject.description || "-"}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {selectedProject.githubRepoUrl && (
                    <a
                      href={selectedProject.githubRepoUrl.startsWith("http") ? selectedProject.githubRepoUrl : `https://${selectedProject.githubRepoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"
                    >
                      <Github size={14} /> GitHub
                    </a>
                  )}
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl.startsWith("http") ? selectedProject.demoUrl : `https://${selectedProject.demoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"
                    >
                      <ExternalLink size={14} /> Demo
                    </a>
                  )}
                  {selectedProject.videos?.map((vid: string, i: number) => (
                    <a
                      key={i}
                      href={vid.startsWith("http") ? vid : `https://${vid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"
                    >
                      <Play size={14} /> {selectedProject.videos.length > 1 ? `Video ${i + 1}` : "Video"}
                    </a>
                  ))}
                </div>

                {selectedProject.images?.length > 0 && (
                  <div>
                    <p className="text-xs text-brand-cyan/60 uppercase mb-2">Images</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProject.images.map((img: string, i: number) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="block group">
                          <img
                            src={img}
                            alt={`Project image ${i + 1}`}
                            className="w-full h-40 object-cover rounded border border-brand-cyan/20 group-hover:border-brand-cyan/40 transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.problematic?.length > 0 && (
                  <div className="p-4 rounded bg-brand-orange/10 border border-brand-orange/20">
                    <p className="text-xs text-brand-orange/80 uppercase mb-2">Problematic</p>
                    <ul className="space-y-2">
                      {selectedProject.problematic.map((item: any, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-brand-cyan/80">
                          <span className="text-brand-orange mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProject.technologies?.length > 0 && (
                  <div className="p-4 rounded bg-brand-cyan/5 border border-brand-cyan/10">
                    <p className="text-xs text-brand-cyan/60 uppercase mb-2">Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded bg-brand-cyan/10 text-brand-cyan text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.links?.length > 0 && (
                  <div className="p-4 rounded bg-brand-cyan/5 border border-brand-cyan/10">
                    <p className="text-xs text-brand-cyan/60 uppercase mb-2">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.links.map((link: string, i: number) => (
                        <a
                          key={i}
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-cyan/10 text-brand-cyan text-xs hover:bg-brand-cyan/20"
                        >
                          <ExternalLink size={12} /> Link {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showTeamDetails} onOpenChange={setShowTeamDetails}>
          <DialogContent className="glass-effect border-brand-cyan/30 w-[95vw] max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden pt-10">
            <DialogHeader>
              <DialogTitle className="font-pixel text-brand-yellow">
                {selectedTeam?.name || "-"}
              </DialogTitle>
            </DialogHeader>
            {loadingTeamParticipants ? (
              <div className="p-6 text-center text-xs font-pixel text-brand-cyan animate-pulse">
                {locale === "es" ? "CARGANDO PARTICIPANTES..." : "LOADING PARTICIPANTS..."}
              </div>
            ) : teamParticipants.length === 0 ? (
              <div className="p-4 text-center text-xs text-brand-cyan/50 font-pixel">
                {locale === "es" ? "No se encontraron participantes para este equipo." : "No participants were found for this team."}
              </div>
            ) : (
              <div className="space-y-2">
                {teamParticipants.map((participant) => (
                  <div key={participant.id} className="p-3 rounded bg-brand-navy/50 border border-brand-cyan/15 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-brand-cyan text-xs font-pixel md:truncate">
                        {[participant.name, participant.surname].filter(Boolean).join(" ") || (locale === "es" ? "Sin nombre" : "Unnamed participant")}
                      </p>
                      {(participant.career || participant.university) && (
                        <>
                          {/* Desktop: side by side con separador */}
                          <p className="text-[11px] text-brand-cyan/60 mt-0.5 hidden md:block truncate">
                            {[participant.career, participant.university].filter(Boolean).join(" • ")}
                          </p>
                          {/* Mobile: stack vertical */}
                          <div className="text-[11px] text-brand-cyan/60 mt-0.5 space-y-0.5 md:hidden">
                            {participant.career && <p className="break-words">{participant.career}</p>}
                            {participant.university && <p className="break-words">{participant.university}</p>}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {participant.linkedin && (
                        <a
                          href={participant.linkedin.startsWith("http") ? participant.linkedin : `https://${participant.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={locale === "es" ? "Abrir LinkedIn" : "Open LinkedIn"}
                          className="p-1.5 rounded border border-brand-cyan/20 text-brand-cyan/70 hover:text-brand-cyan hover:border-brand-cyan/40 transition-colors"
                        >
                          <Linkedin size={14} />
                        </a>
                      )}
                      {participant.role && String(participant.role).toLowerCase() !== "participant" && (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-brand-cyan/20 text-brand-cyan/60">
                          {participant.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
