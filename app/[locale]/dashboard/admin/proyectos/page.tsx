"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, getDoc, where, onSnapshot } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { Search, FileText, Image as ImageIcon, Play, Github, ExternalLink, Filter, CheckCircle, Ban, Trophy } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { useCategories } from "@/hooks/use-categories"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/firebase/auth-context"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { getCategoryByLegacyIndex } from "@/lib/categories/legacy-category-mapping"

export default function AdminProyectosPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const t = getTranslations(locale)
  const db = getDbClient()
  const { categories } = useCategories(locale)

  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [scoringCriteria, setScoringCriteria] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "submitted" | "reviewed" | "disqualified">("all")
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const [reviewComment, setReviewComment] = useState("")
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({})
  const [submittingReview, setSubmittingReview] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"review" | "disqualify" | "mark_finalist" | null>(null)
  const [judgingStage, setJudgingStage] = useState<"admin" | "judge">("admin")
  const [myReviews, setMyReviews] = useState<Set<string>>(new Set())
  const [updatingStages, setUpdatingStages] = useState(false)
  const [updatingAllStages, setUpdatingAllStages] = useState(false)

  useEffect(() => {
    if (!db) return
    const fetchProjects = async () => {
      try {
        const projectsQuery = query(collection(db, "projects"), orderBy("updatedAt", "desc"))
        const projectsSnapshot = await getDocs(projectsQuery)
        setProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))

        const criteriaQuery = query(collection(db, "scoringCriteria"))
        const criteriaSnapshot = await getDocs(criteriaQuery)
        const criteria = criteriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setScoringCriteria(criteria)

        const initialScores: Record<string, number> = {}
        criteria.forEach(c => { initialScores[c.id] = 10 })
        setReviewScores(initialScores)

        const settingsDoc = await getDoc(doc(db, "settings", "global"))
        if (settingsDoc.exists()) {
          setJudgingStage(settingsDoc.data().judgingStage || "admin")
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()

    // Listen to my reviews (only judge-role reviews for the finalist phase)
    let unsubReviews = () => { }
    if (user?.id) {
      const reviewsQuery = query(
        collection(db, "projectReviews"),
        where("reviewerId", "==", user.id),
        where("reviewerRole", "==", "judge")
      )
      unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
        const reviewedIds = new Set(snapshot.docs.map(doc => doc.data().projectId))
        setMyReviews(reviewedIds)
      })
    }

    return () => {
      unsubReviews()
    }
  }, [db, user?.id])

  const handleReview = async (disqualify: boolean) => {
    if (!db || !selectedProject || !user) return
    setSubmittingReview(true)
    try {
      const isFinalist = selectedProject.isFinalist
      const reviewerRole = isFinalist ? "judge" : "admin"

      const scoresWithWeights: Record<string, number> = {}
      let totalWeightedScore = 0

      scoringCriteria.filter(c => (c.targetRole || "judge") === reviewerRole).forEach(c => {
        const score = reviewScores[c.id] || 0
        const weight = c.weight || 1
        const maxScore = c.maxScore || 10
        // (1-10 / 10) * maxPointsAtWeight
        const weighted = (score / 10) * (maxScore * weight)
        scoresWithWeights[c.id] = weighted
        totalWeightedScore += weighted
      })

      const reviewData = {
        projectId: selectedProject.id,
        reviewerId: user.id || "admin",
        reviewerRole: reviewerRole,
        rawScores: reviewScores,
        calculatedScores: scoresWithWeights,
        totalScore: totalWeightedScore,
        comment: reviewComment,
        disqualified: disqualify,
        createdAt: new Date().toISOString()
      }
      await addDoc(collection(db, "projectReviews"), reviewData)

      // Calculate new averages
      const reviewsSnap = await getDocs(query(collection(db, "projectReviews"), where("projectId", "==", selectedProject.id)))
      const allReviews = reviewsSnap.docs.map(d => d.data())

      const newStatus = disqualify ? "disqualified" : "reviewed"

      // Filter reviews based on pool:
      // If project is a finalist, ONLY include judge-role reviews (includes admins voting as judges)
      // If NOT a finalist, only include admin-role reviews (screening phase)
      const relevantReviews = allReviews.filter(r =>
        (isFinalist ? r.reviewerRole === "judge" : r.reviewerRole === "admin") && !r.disqualified
      )

      let avgTotal = 0
      let avgScores: Record<string, number> = {}
      let avgRawScores: Record<string, number> = {}

      if (relevantReviews.length > 0) {
        avgTotal = relevantReviews.reduce((sum, r: any) => sum + (r.totalScore || 0), 0) / relevantReviews.length

        scoringCriteria.filter(c => (c.targetRole || "judge") === (isFinalist ? "judge" : "admin")).forEach(c => {
          const sum = relevantReviews.reduce((s, r: any) => s + (r.calculatedScores?.[c.id] || 0), 0)
          avgScores[c.id] = sum / relevantReviews.length

          const sumRaw = relevantReviews.reduce((s, r: any) => s + (r.rawScores?.[c.id] || 0), 0)
          avgRawScores[c.id] = sumRaw / relevantReviews.length
        })
      } else {
        avgTotal = totalWeightedScore
        avgScores = scoresWithWeights
        avgRawScores = reviewScores
      }

      const anyDisqualified = relevantReviews.some(r => r.disqualified) || disqualify

      await updateDoc(doc(db, "projects", selectedProject.id), {
        status: newStatus,
        disqualified: anyDisqualified,
        totalScore: avgTotal,
        scores: avgScores,
        reviewCount: relevantReviews.length
      })

      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status: newStatus, disqualified: anyDisqualified, totalScore: avgTotal, reviewCount: relevantReviews.length } : p))
      setSelectedProject((prev: any) => ({ ...prev, status: newStatus, disqualified: anyDisqualified, totalScore: avgTotal, reviewCount: relevantReviews.length }))
      setShowDetails(false)
      setReviewComment("")
      toast({ title: locale === "es" ? "Evaluación enviada" : "Evaluation submitted" })
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const markAsFinalist = async (projectArg?: any) => {
    const targetProject = projectArg || selectedProject
    if (!db || !targetProject) return
    try {
      // When marking as finalist, the score pool switches to judges.
      // We should recalculate immediate average from judge reviews (if any exist)
      const reviewsSnap = await getDocs(query(collection(db, "projectReviews"), where("projectId", "==", targetProject.id)))
      const allReviews = reviewsSnap.docs.map(d => d.data())

      const judgeReviews = allReviews.filter(r => r.reviewerRole === "judge" && !r.disqualified)

      let avgTotal = 0
      let avgScores: Record<string, number> = {}
      let avgRawScores: Record<string, number> = {}

      if (judgeReviews.length > 0) {
        avgTotal = judgeReviews.reduce((sum, r: any) => sum + (r.totalScore || 0), 0) / judgeReviews.length
        scoringCriteria.filter(c => (c.targetRole || "judge") === "judge").forEach(c => {
          const sum = judgeReviews.reduce((s, r: any) => s + (r.calculatedScores?.[c.id] || 0), 0)
          avgScores[c.id] = sum / judgeReviews.length

          const sumRaw = judgeReviews.reduce((s, r: any) => s + (r.rawScores?.[c.id] || 0), 0)
          avgRawScores[c.id] = sumRaw / judgeReviews.length
        })
      }

      const anyDisqualified = judgeReviews.some(r => r.disqualified)

      await updateDoc(doc(db, "projects", targetProject.id), {
        isFinalist: true,
        disqualified: anyDisqualified,
        status: "reviewed",
        totalScore: avgTotal,
        scores: avgScores,
        reviewCount: judgeReviews.length
      })

      setProjects(prev => prev.map(p => p.id === targetProject.id ? { ...p, isFinalist: true, disqualified: anyDisqualified, status: "reviewed", totalScore: avgTotal, reviewCount: judgeReviews.length } : p))
      setSelectedProject((prev: any) => {
        if (!prev || prev.id !== targetProject.id) return prev
        return { ...prev, isFinalist: true, disqualified: anyDisqualified, status: "reviewed", totalScore: avgTotal, reviewCount: judgeReviews.length }
      })
      if (!projectArg) {
        setShowDetails(false)
      }
      toast({ title: locale === "es" ? "Marcado como finalista" : "Marked as finalist" })
    } catch (error) {
      console.error("Error marking finalist:", error)
    }
  }

  const updateProjectLocalState = (projectId: string, patch: Record<string, any>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...patch } : p))
    setSelectedProject((prev: any) => {
      if (!prev || prev.id !== projectId) return prev
      return { ...prev, ...patch }
    })
  }

  const setStageLock = async (stage: 1 | 2, locked: boolean, projectArg?: any) => {
    const targetProject = projectArg || selectedProject
    if (!db || !targetProject) return

    setUpdatingStages(true)
    try {
      const lockField = stage === 1 ? "stage1Locked" : "stage2Locked"
      const lockDateField = stage === 1 ? "stage1LockedAt" : "stage2LockedAt"
      const patch: Record<string, any> = {
        [lockField]: locked,
      }

      if (locked) {
        patch[lockDateField] = new Date().toISOString()
      }

      // If stage 1 is unlocked, also clear admin incomplete marker.
      if (stage === 1 && !locked) {
        patch.stage1Incomplete = false
      }

      await updateDoc(doc(db, "projects", targetProject.id), patch)
      updateProjectLocalState(targetProject.id, patch)

      toast({
        title: stage === 1
          ? (locked ? (locale === "es" ? "Etapa 1 bloqueada" : "Stage 1 locked") : (locale === "es" ? "Etapa 1 desbloqueada" : "Stage 1 unlocked"))
          : (locked ? (locale === "es" ? "Etapa 2 bloqueada" : "Stage 2 locked") : (locale === "es" ? "Etapa 2 desbloqueada" : "Stage 2 unlocked")),
      })
    } catch (error) {
      console.error("Error updating stage lock:", error)
      toast({ title: locale === "es" ? "Error al actualizar etapa" : "Error updating stage", variant: "destructive" })
    } finally {
      setUpdatingStages(false)
    }
  }

  const markStage1Incomplete = async (projectArg?: any) => {
    const targetProject = projectArg || selectedProject
    if (!db || !targetProject) return

    setUpdatingStages(true)
    try {
      const patch = {
        stage1Locked: true,
        stage1LockedAt: new Date().toISOString(),
        stage1Incomplete: true,
        stage2Locked: true,
        stage2LockedAt: new Date().toISOString(),
        totalScore: 0,
        scores: {},
        reviewCount: 0,
        status: "reviewed",
      }

      await updateDoc(doc(db, "projects", targetProject.id), patch)
      updateProjectLocalState(targetProject.id, patch)

      toast({
        title: locale === "es" ? "Etapa 1 incompleta" : "Stage 1 incomplete",
        description: locale === "es"
          ? "Se asigno puntaje 0 y se bloqueo la carga de video."
          : "Score set to 0 and video upload was blocked.",
      })
    } catch (error) {
      console.error("Error marking stage 1 incomplete:", error)
      toast({ title: locale === "es" ? "Error al marcar etapa" : "Error updating stage", variant: "destructive" })
    } finally {
      setUpdatingStages(false)
    }
  }

  const setGlobalStageMode = async (mode: "open" | "only_video" | "close") => {
    if (!db) return
    setUpdatingAllStages(true)
    try {
      const projectsSnap = await getDocs(query(collection(db, "projects")))
      const nowIso = new Date().toISOString()

      const patchByMode: Record<string, any> = {
        open: {
          stage1Locked: false,
          stage1LockedAt: null,
          stage2Locked: false,
          stage2LockedAt: null,
        },
        only_video: {
          stage1Locked: true,
          stage1LockedAt: nowIso,
          stage2Locked: false,
          stage2LockedAt: null,
        },
        close: {
          stage1Locked: true,
          stage1LockedAt: nowIso,
          stage2Locked: true,
          stage2LockedAt: nowIso,
        },
      }

      const patch = patchByMode[mode]

      for (const pDoc of projectsSnap.docs) {
        await updateDoc(doc(db, "projects", pDoc.id), patch)
      }

      setProjects(prev => prev.map((p: any) => ({ ...p, ...patch })))
      setSelectedProject((prev: any) => (prev ? { ...prev, ...patch } : prev))

      const titleByMode = {
        open: locale === "es" ? "Modo abierto aplicado" : "Open mode applied",
        only_video: locale === "es" ? "Modo solo video aplicado" : "Only video mode applied",
        close: locale === "es" ? "Modo cerrado aplicado" : "Close mode applied",
      }

      toast({ title: titleByMode[mode] })
    } catch (error) {
      console.error("Error updating global stage mode:", error)
      toast({ title: locale === "es" ? "Error al actualizar modo global" : "Error updating global mode", variant: "destructive" })
    } finally {
      setUpdatingAllStages(false)
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Judges only evaluate finalists and never disqualified ones
      // This filter is for the admin view, but if the judging stage is "judge", admins might want to see projects as judges would.
      // For now, let's apply this filter only if the judgingStage is 'judge' AND the project is not a finalist or is disqualified.
      // If judgingStage is 'admin', all projects are visible based on other filters.
      if (judgingStage === "judge" && (!p.isFinalist || p.disqualified)) return false

      const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || p.status === statusFilter

      // If judgingStage is 'judge', also filter out projects already reviewed by the current user
      if (judgingStage === "judge" && myReviews.has(p.id)) return false

      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter, judgingStage, myReviews])

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "-"
    const category = getCategoryByLegacyIndex(categories, categoryId)
    return category ? (locale === "es" ? category.spanishName : category.englishName) : "-"
  }

  const groupedRankings = useMemo(() => {
    const groups: Record<string, any[]> = {}
    projects.forEach(p => {
      if (p.disqualified) return // hide disqualified from leaderboard
      if (p.status !== "reviewed") return // only show reviewed projects
      const cat = p.categoryId || "uncategorized"
      if (!groups[cat]) {
        groups[cat] = []
      }
      groups[cat].push(p)
    })
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    })
    return groups
  }, [projects])

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title={t.dashboard.sidebar.projects}>
        <div className="space-y-6">
          <Tabs defaultValue="projects" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
              <TabsList className="bg-brand-navy/60 border border-brand-cyan/20">
                <TabsTrigger value="projects" className="font-pixel text-xs data-[state=active]:bg-brand-cyan/20 data-[state=active]:text-brand-cyan text-brand-cyan/60">Projects</TabsTrigger>
                <TabsTrigger value="leaderboard" className="font-pixel text-xs data-[state=active]:bg-brand-cyan/20 data-[state=active]:text-brand-cyan text-brand-cyan/60">Leaderboard</TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/40 border-brand-cyan/50"
                  onClick={() => setGlobalStageMode("open")}
                  disabled={updatingAllStages}
                >
                  {locale === "es" ? "Open (ambas etapas)" : "Open (both stages)"}
                </Button>
                <Button
                  size="sm"
                  className="bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/40 border-brand-yellow/50"
                  onClick={() => setGlobalStageMode("only_video")}
                  disabled={updatingAllStages}
                >
                  {locale === "es" ? "Only Video (S1 cerrado, S2 abierto)" : "Only Video (S1 closed, S2 open)"}
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500/20 text-red-300 hover:bg-red-500/40 border-red-500/50"
                  onClick={() => setGlobalStageMode("close")}
                  disabled={updatingAllStages}
                >
                  {locale === "es" ? "Close (ambas etapas)" : "Close (both stages)"}
                </Button>
              </div>
            </div>

            <TabsContent value="projects" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/40" />
                  <Input
                    placeholder={locale === "es" ? "Buscar por título o equipo..." : "Search by title or team..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-brand-navy border border-brand-cyan/30 text-brand-cyan text-sm rounded px-3 h-10 w-full md:w-40"
                  >
                    <option value="all">{locale === "es" ? "Todos los estados" : "All Status"}</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-xs text-center text-brand-cyan animate-pulse font-pixel">LOADING PROJECTS...</div>
              ) : filteredProjects.length === 0 ? (
                <GlassCard className="p-12 text-xs text-center text-brand-cyan/40 font-pixel">No projects found.</GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <GlassCard key={project.id} className="p-6 flex flex-col gap-4 h-full hover:border-brand-cyan/40 transition-colors cursor-pointer" onClick={() => { setSelectedProject(project); setShowDetails(true); }}>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded uppercase font-pixel",
                            project.status === "submitted" ? "bg-green-500/10 text-green-400" :
                              project.status === "reviewed" ? "bg-blue-500/10 text-blue-400" :
                                project.status === "disqualified" ? "bg-red-500/10 text-red-500" :
                                  "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {project.status}
                          </span>
                          {project.isFinalist && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-yellow/20 text-brand-yellow font-pixel">FINALIST</span>
                          )}
                          <span className="text-xs font-pixel text-brand-cyan/40">{getCategoryName(project.categoryId)}</span>
                        </div>
                        <h4 className="font-pixel text-lg text-brand-yellow line-clamp-1">{project.title || "Untitled Project"}</h4>
                        <p className="text-xs text-brand-cyan/60">Team: {project.teamName}</p>
                        <p className="text-sm text-brand-cyan/80 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="p-4 border-t border-brand-cyan/10 bg-black/20 flex justify-between items-center text-xs text-brand-cyan/40 font-pixel">
                        <span>{project.images?.length || 0} Images</span>
                        <span>{project.videos?.length || 0} Videos</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-8">
              {Object.keys(groupedRankings).length === 0 ? (
                <GlassCard className="p-12 text-xs text-center text-brand-cyan/40 font-pixel">No reviewed projects yet.</GlassCard>
              ) : (
                Object.keys(groupedRankings).map(catId => {
                  const ranked = groupedRankings[catId]
                  return (
                    <GlassCard key={catId} className="p-4 sm:p-6 flex flex-col gap-4">
                      <h3 className="font-pixel text-lg text-brand-yellow">Category: {getCategoryName(catId)}</h3>
                      <div className="rounded-md border border-brand-cyan/20 overflow-x-auto bg-black/20">
                        <Table className="min-w-max">
                          <TableHeader>
                            <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                              <TableHead className="text-brand-cyan w-12 text-center">#</TableHead>
                              <TableHead className="text-brand-cyan">Project</TableHead>
                              <TableHead className="text-brand-cyan">Team</TableHead>
                              {scoringCriteria.filter(c => (c.targetRole || "judge") === "judge").map(c => (
                                <TableHead key={c.id} className="text-brand-cyan text-[10px]">
                                  {c.name}
                                </TableHead>
                              ))}
                              <TableHead className="text-brand-orange text-right">Points</TableHead>
                              <TableHead className="text-brand-cyan/60 text-right text-xs">Reviews</TableHead>
                              <TableHead className="text-brand-yellow text-right">Finalist</TableHead>
                              <TableHead className="text-brand-cyan/60 text-right text-xs">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ranked.map((p, index) => (
                              <TableRow key={p.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                                <TableCell className="text-brand-cyan/60 text-center font-bold">{index + 1}</TableCell>
                                <TableCell className="font-medium text-brand-cyan" onClick={() => { setSelectedProject(p); setShowDetails(true); }}>
                                  <span className="hover:underline cursor-pointer">{p.title || "Untitled"}</span>
                                </TableCell>
                                <TableCell className="text-brand-cyan/80">{p.teamName}</TableCell>
                                {scoringCriteria.filter(c => (c.targetRole || "judge") === "judge").map(c => (
                                  <TableCell key={c.id} className="text-brand-cyan/80">
                                    {(p.scores && p.scores[c.id]) !== undefined ? Math.round(p.scores[c.id]) : "-"}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right font-bold text-brand-orange">
                                  {Math.round(p.totalScore || 0)}
                                </TableCell>
                                <TableCell className="text-right text-xs text-brand-cyan/40 italic">
                                  {p.reviewCount || 0}
                                </TableCell>
                                <TableCell className="text-right">
                                  {p.isFinalist ? <Trophy size={14} className="ml-auto text-brand-yellow" /> : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {!p.isFinalist && (
                                    <Button
                                      size="sm"
                                      className="bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/40 border-brand-yellow/50"
                                      onClick={() => markAsFinalist(p)}
                                    >
                                      <Trophy className="mr-2 w-4 h-4" />
                                      Mark as Finalist
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </GlassCard>
                  )
                })
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="glass-effect border-brand-cyan/30 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-pixel text-brand-yellow flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} />
                    <p className="text-regular font-pixel ">{selectedProject?.title}</p>
                  </div>
                  <span className={cn(
                    "text-sm px-2 py-0.5 rounded uppercase",
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
                      <p className="text-brand-yellow text-sm font-pixel">{selectedProject.teamName}</p>
                    </div>
                    <div className="p-3 rounded bg-brand-navy/60 border border-brand-cyan/10">
                      <p className="text-xs text-brand-cyan/60 uppercase mb-1">Category</p>
                      <p className="text-brand-cyan text-sm">{getCategoryName(selectedProject.categoryId)}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded bg-black/40 border border-brand-cyan/10">
                    <p className="text-xs text-brand-cyan/60 uppercase mb-2">Description</p>
                    <p className="text-brand-cyan/80 text-sm whitespace-pre-wrap">{selectedProject.description}</p>
                  </div>

                  <div className="p-4 rounded bg-brand-navy/40 border border-brand-cyan/20 space-y-3">
                    <p className="text-xs text-brand-cyan/60 uppercase">Stage Controls</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={cn("px-2 py-1 rounded border font-pixel", selectedProject.stage1Locked ? "border-brand-yellow/40 text-brand-yellow" : "border-brand-cyan/20 text-brand-cyan/70")}>
                        {selectedProject.stage1Locked ? "STAGE 1: LOCKED" : "STAGE 1: OPEN"}
                      </span>
                      <span className={cn("px-2 py-1 rounded border font-pixel", selectedProject.stage2Locked ? "border-brand-yellow/40 text-brand-yellow" : "border-brand-cyan/20 text-brand-cyan/70")}>
                        {selectedProject.stage2Locked ? "STAGE 2: LOCKED" : "STAGE 2: OPEN"}
                      </span>
                      {selectedProject.stage1Incomplete && (
                        <span className="px-2 py-1 rounded border border-red-500/40 text-red-400 font-pixel">STAGE 1 INCOMPLETE (0)</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        className="bg-red-500/20 text-red-300 hover:bg-red-500/40 border-red-500/50"
                        onClick={() => markStage1Incomplete()}
                        disabled={updatingStages}
                      >
                        {locale === "es" ? "Etapa 1 incompleta (0)" : "Stage 1 incomplete (0)"}
                      </Button>
                      <Button
                        className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/40 border-brand-cyan/50"
                        onClick={() => setStageLock(1, !selectedProject.stage1Locked)}
                        disabled={updatingStages}
                      >
                        {selectedProject.stage1Locked
                          ? (locale === "es" ? "Desbloquear Etapa 1" : "Unlock Stage 1")
                          : (locale === "es" ? "Bloquear Etapa 1" : "Lock Stage 1")}
                      </Button>
                      <Button
                        className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/40 border-brand-cyan/50"
                        onClick={() => setStageLock(2, !selectedProject.stage2Locked)}
                        disabled={updatingStages}
                      >
                        {selectedProject.stage2Locked
                          ? (locale === "es" ? "Desbloquear Etapa 2" : "Unlock Stage 2")
                          : (locale === "es" ? "Bloquear Etapa 2" : "Lock Stage 2")}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {selectedProject.githubRepoUrl && <a href={selectedProject.githubRepoUrl.startsWith('http') ? selectedProject.githubRepoUrl : `https://${selectedProject.githubRepoUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"><Github size={14} /> GitHub</a>}
                    {selectedProject.demoUrl && <a href={selectedProject.demoUrl.startsWith('http') ? selectedProject.demoUrl : `https://${selectedProject.demoUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"><ExternalLink size={14} /> Demo</a>}
                  </div>
                  {selectedProject.images?.length > 0 && (
                    <div>
                      <p className="text-xs text-brand-cyan/60 uppercase mb-3 flex items-center gap-2"><ImageIcon size={14} /> Images</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedProject.images.map((img: string, i: number) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-video relative rounded overflow-hidden border border-brand-cyan/20"><img src={img} alt="" className="w-full h-full object-cover" /></a>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProject.videos?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-brand-cyan/60 uppercase mb-3 flex items-center gap-2"><Play size={14} /> Videos</p>
                      {selectedProject.videos.map((vid: string, i: number) => (
                        <video key={i} src={vid} controls className="w-full rounded border border-brand-cyan/20 mb-2" />
                      ))}
                    </div>
                  )}

                  {selectedProject.status !== "disqualified" && (selectedProject.isFinalist ? !myReviews.has(selectedProject.id) : selectedProject.status !== "reviewed") && (
                    <div className="mt-8 pt-6 border-t border-brand-cyan/20">
                      <h3 className="font-pixel text-lg text-brand-yellow mb-4">
                        {selectedProject.isFinalist ? "Final Judging Review" : "Screening Review"}
                      </h3>
                      <div className="space-y-4">
                        {scoringCriteria.filter(c => (c.targetRole || "judge") === (selectedProject.isFinalist ? "judge" : "admin")).map(criteria => (
                          <div key={criteria.id} className="grid grid-cols-4 items-center gap-4">
                            <Label className="col-span-3 text-sm text-brand-cyan flex flex-col">
                              <span>{criteria.name}</span>
                              <span className="text-[10px] text-brand-cyan/60 font-normal">{criteria.description} (Scale 1-10)</span>
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={reviewScores[criteria.id] || 0}
                              onChange={(e) => {
                                const val = Math.min(Math.max(0, Number(e.target.value) || 0), 10)
                                setReviewScores(prev => ({ ...prev, [criteria.id]: val }))
                              }}
                              className="bg-brand-navy border-brand-cyan/30 text-brand-cyan"
                            />
                          </div>
                        ))}

                        <div className="pt-2">
                          <Label className="text-sm text-brand-cyan mb-2 block">Review Comments</Label>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Comments about this project..."
                            className="bg-brand-navy border-brand-cyan/30 text-brand-cyan min-h-[100px]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                          <Button
                            className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/40 border-green-500/50"
                            onClick={() => setConfirmAction("review")}
                            disabled={submittingReview}
                          >
                            <CheckCircle className="mr-2 w-4 h-4" />
                            {selectedProject.isFinalist ? "Submit Vote" : "Submit Review"}
                          </Button>
                          <Button
                            className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/40 border-red-500/50"
                            onClick={() => setConfirmAction("disqualify")}
                            disabled={submittingReview}
                          >
                            <Ban className="mr-2 w-4 h-4" />
                            Disqualify
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {myReviews.has(selectedProject.id) && selectedProject.isFinalist && (
                    <div className="mt-8 pt-6 border-t border-brand-cyan/20 text-center">
                      <div className="flex flex-col items-center gap-2 text-brand-cyan/60">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                        <p className="font-pixel text-sm uppercase">{locale === "es" ? "Ya has evaluado este proyecto" : "You have already evaluated this project"}</p>
                      </div>
                    </div>
                  )}

                  {selectedProject.status === "reviewed" && !selectedProject.isFinalist && (
                    <div className="pt-4 mt-4 border-t border-brand-cyan/10">
                      <Button
                        className="w-full bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/40 border-brand-yellow/50"
                        onClick={() => markAsFinalist()}
                      >
                        <Trophy className="mr-2 w-4 h-4" />
                        Mark as Finalist
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
            <AlertDialogContent className="glass-effect border-brand-cyan/30">
              <AlertDialogHeader className="mb-2">
                <AlertDialogTitle className="font-pixel text-brand-yellow">Confirm Action</AlertDialogTitle>
                <AlertDialogDescription className="text-brand-cyan/80">
                  {confirmAction === "disqualify"
                    ? "Are you sure you want to disqualify this project? This decision will be recorded."
                    : "Are you sure you want to submit this review? Ensure your scores and comments are finalized."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10">Cancel</AlertDialogCancel>
                <Button
                  className={confirmAction === "disqualify" ? "bg-red-500/20 text-red-500 hover:bg-red-500/40 border-red-500/50" : "bg-green-500/20 text-green-400 hover:bg-green-500/40 border-green-500/50"}
                  onClick={() => {
                    if (confirmAction === "disqualify") handleReview(true)
                    else if (confirmAction === "review") handleReview(false)
                    setConfirmAction(null)
                  }}
                >
                  Confirm
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute >
  )
}
