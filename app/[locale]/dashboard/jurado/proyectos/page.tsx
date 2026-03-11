"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, getDoc, onSnapshot, where } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { Search, FileText, Image as ImageIcon, Play, Github, ExternalLink, Filter, CheckCircle, Ban } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { useCategories } from "@/hooks/use-categories"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/firebase/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function JuradoProyectosPage() {
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
  const [confirmAction, setConfirmAction] = useState<"review" | null>(null)
  const [judgingStage, setJudgingStage] = useState<"admin" | "judge">("admin")
  const [myReviews, setMyReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!db) return

    setLoading(true)

    // Listen to projects in real-time
    const projectsQuery = query(collection(db, "projects"), orderBy("updatedAt", "desc"))
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }, (error) => {
      console.error("Error listening to projects:", error)
      setLoading(false)
    })

    // Listen to global settings for judgingStage
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setJudgingStage(snap.data().judgingStage || "admin")
      }
    })

    // Listen to my reviews
    let unsubReviews = () => { }
    if (user?.id) {
      const reviewsQuery = query(collection(db, "projectReviews"), where("reviewerId", "==", user.id))
      unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
        const reviewedIds = new Set(snapshot.docs.map(doc => doc.data().projectId))
        setMyReviews(reviewedIds)
      })
    }

    // Fetch criteria once
    const fetchCriteria = async () => {
      try {
        const criteriaQuery = query(collection(db, "scoringCriteria"))
        const criteriaSnapshot = await getDocs(criteriaQuery)
        const criteria = criteriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
        setScoringCriteria(criteria)

        const initialScores: Record<string, number> = {}
        criteria.forEach(c => { initialScores[c.id] = 10 })
        setReviewScores(initialScores)
      } catch (error) {
        console.error("Error fetching criteria:", error)
      }
    }
    fetchCriteria()

    return () => {
      unsubProjects()
      unsubSettings()
      unsubReviews()
    }
  }, [db, user?.id])

  const handleReview = async () => {
    if (!db || !selectedProject || !user) return
    setSubmittingReview(true)
    try {
      const scoresWithWeights: Record<string, number> = {}
      let totalWeightedScore = 0

      scoringCriteria.forEach(c => {
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
        reviewerId: user.id || "judge",
        reviewerRole: "judge",
        rawScores: reviewScores,
        calculatedScores: scoresWithWeights,
        totalScore: totalWeightedScore,
        comment: reviewComment,
        disqualified: false,
        createdAt: new Date().toISOString()
      }
      await addDoc(collection(db, "projectReviews"), reviewData)

      // Calculate new averages specifically from judge reviews
      const reviewsSnap = await getDocs(query(collection(db, "projectReviews"), where("projectId", "==", selectedProject.id)))
      const allReviews = reviewsSnap.docs.map(d => d.data())

      // Judges only contribute to the judge score pool
      const judgeReviews = allReviews.filter(r => r.reviewerRole === "judge" && !r.disqualified)

      let avgTotal = 0
      let avgScores: Record<string, number> = {}

      if (judgeReviews.length > 0) {
        avgTotal = judgeReviews.reduce((sum, r) => sum + (r.totalScore || 0), 0) / judgeReviews.length

        scoringCriteria.forEach(c => {
          const sum = judgeReviews.reduce((s, r) => s + (r.calculatedScores?.[c.id] || 0), 0)
          avgScores[c.id] = sum / judgeReviews.length
        })
      }

      await updateDoc(doc(db, "projects", selectedProject.id), {
        status: "reviewed",
        scores: avgScores,
        totalScore: avgTotal,
        reviewComment: reviewData.comment,
        reviewCount: judgeReviews.length
      })

      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status: "reviewed", scores: avgScores, totalScore: avgTotal, reviewComment: reviewData.comment, reviewCount: judgeReviews.length } : p))
      setSelectedProject((prev: any) => ({ ...prev, status: "reviewed", scores: avgScores, totalScore: avgTotal, reviewComment: reviewData.comment, reviewCount: judgeReviews.length }))
      setShowDetails(false)
      setReviewComment("")
      toast({ title: locale === "es" ? "Evaluación enviada" : "Evaluation submitted" })
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const filteredProjects = useMemo(() => {
    // Judges don't see anything during admin screening phase
    if (judgingStage === "admin") return []

    return projects.filter(p => {
      // Judges only evaluate finalists
      if (!p.isFinalist) return false

      const isReviewedByMe = myReviews.has(p.id)
      const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.teamName?.toLowerCase().includes(searchTerm.toLowerCase())

      const statusMatch = statusFilter === "all" ||
        (statusFilter === "reviewed" && isReviewedByMe) ||
        (statusFilter === "submitted" && !isReviewedByMe)

      return matchesSearch && statusMatch
    })
  }, [projects, searchTerm, statusFilter, judgingStage, myReviews])

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "-"
    const index = parseInt(categoryId)
    const category = categories[index]
    if (!category) return "-"
    return locale === "es" ? (category.spanishName || category.englishName) : (category.englishName || category.spanishName)
  }

  return (
    <ProtectedRoute allowedRoles={["judge"]}>
      <DashboardLayout title={t.dashboard.sidebar.projects}>
        <div className="space-y-6">
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

          <section>
            <div className="flex flex-col gap-2 mb-6">
              <h3 className="font-pixel text-2xl text-brand-yellow font-pixel">{t.judge.projectsToScore}</h3>
              {judgingStage === "admin" && (
                <div className="p-3 text-center rounded-md bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-pixel">
                  WAITING FOR ADMINS TO SELECT FINALISTS...
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center p-12"><div className="animate-pulse text-xs font-pixel text-brand-cyan">LOADING PROJECTS...</div></div>
            ) : filteredProjects.length === 0 ? (
              <GlassCard className="p-8 text-center"><p className="text-xs font-pixel text-brand-cyan/60">No projects found.</p></GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const isReviewedByMe = myReviews.has(project.id)
                  return (
                    <GlassCard key={project.id} className="flex flex-col h-full hover:border-brand-cyan/40 transition-colors cursor-pointer" onClick={() => { setSelectedProject(project); setShowDetails(true); }}>
                      <div className="p-2 flex-1 space-y-4">
                        <div className="flex flex-col gap-2 justify-between items-start">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded uppercase",
                            isReviewedByMe ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                          )}>
                            {isReviewedByMe ? (locale === "es" ? "Evaluado" : "Reviewed") : (locale === "es" ? "Pendiente" : "To Review")}
                          </span>
                          <span className="text-xs text-brand-cyan px-2 py-1 rounded">{getCategoryName(project.categoryId)}</span>
                        </div>
                        <h4 className="font-pixel text-lg text-brand-yellow line-clamp-1">{project.title}</h4>
                        <p className="text-xs text-brand-cyan/60">Team: {project.teamName}</p>
                        <p className="text-sm text-brand-cyan/80 line-clamp-3 h-12">{project.description}</p>
                      </div>
                      <div className="p-4 border-t border-brand-cyan/10 mt-auto bg-black/20 flex justify-between items-center text-xs text-brand-cyan/40 font-pixel">
                        <span>{project.images?.length || 0} Images</span>
                        <span>{project.videos?.length || 0} Videos</span>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="glass-effect border-brand-cyan/30 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-pixel text-brand-yellow flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText size={18} /> {selectedProject?.title}</div>
              </DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-brand-navy/60 border border-brand-cyan/10">
                    <p className="text-[10px] text-brand-cyan/60 uppercase mb-1">Team</p>
                    <p className="text-brand-yellow text-sm font-pixel">{selectedProject.teamName}</p>
                  </div>
                  <div className="p-3 rounded bg-brand-navy/60 border border-brand-cyan/10">
                    <p className="text-[10px] text-brand-cyan/60 uppercase mb-1">Category</p>
                    <p className="text-brand-cyan text-sm">{getCategoryName(selectedProject.categoryId)}</p>
                  </div>
                </div>
                <div className="p-4 rounded bg-black/40 border border-brand-cyan/10">
                  <p className="text-[10px] text-brand-cyan/60 uppercase mb-2">Description</p>
                  <p className="text-brand-cyan/80 text-sm whitespace-pre-wrap">{selectedProject.description}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {selectedProject.githubRepoUrl && <a href={selectedProject.githubRepoUrl.startsWith('http') ? selectedProject.githubRepoUrl : `https://${selectedProject.githubRepoUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"><Github size={14} /> GitHub</a>}
                  {selectedProject.demoUrl && <a href={selectedProject.demoUrl.startsWith('http') ? selectedProject.demoUrl : `https://${selectedProject.demoUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 text-xs"><ExternalLink size={14} /> Demo</a>}
                </div>
                {selectedProject.images?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-brand-cyan/60 uppercase mb-3 flex items-center gap-2"><ImageIcon size={14} /> Images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedProject.images.map((img: string, i: number) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-video relative rounded overflow-hidden border border-brand-cyan/20"><img src={img} alt="" className="w-full h-full object-cover" /></a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProject.videos?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-brand-cyan/60 uppercase mb-3 flex items-center gap-2"><Play size={14} /> Video</p>
                    {selectedProject.videos.map((vid: string, i: number) => (
                      <video key={i} src={vid} controls className="w-full rounded border border-brand-cyan/20 mb-2" />
                    ))}
                  </div>
                )}

                {!myReviews.has(selectedProject.id) && selectedProject.status !== "disqualified" ? (
                  <div className="mt-8 pt-6 border-t border-brand-cyan/20">
                    <h3 className="font-pixel text-lg text-brand-yellow mb-4">Project Review</h3>
                    <div className="space-y-4">
                      {scoringCriteria.map(criteria => (
                        <div key={criteria.id} className="grid grid-cols-4 items-center gap-4">
                          <Label className="items-start col-span-3 text-sm text-brand-cyan flex flex-col">
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

                      <div className="flex gap-4 pt-4">
                        <Button
                          className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/40 border-green-500/50"
                          onClick={() => setConfirmAction("review")}
                          disabled={submittingReview}
                        >
                          <CheckCircle className="mr-2 w-4 h-4" />
                          Submit Evaluation
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : selectedProject.status === "disqualified" ? (
                  <div className="mt-8 pt-6 border-t border-red-500/20 text-center">
                    <p className="text-red-500 font-pixel text-sm uppercase">This project has been disqualified.</p>
                  </div>
                ) : (
                  <div className="mt-8 pt-6 border-t border-brand-cyan/20 text-center">
                    <div className="flex flex-col items-center gap-2 text-brand-cyan/60">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <p className="font-pixel text-sm uppercase">{locale === "es" ? "Ya has evaluado este proyecto" : "You have already evaluated this project"}</p>
                    </div>
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
                Are you sure you want to submit this evaluation? Ensure your scores and comments are finalized.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10">Cancel</AlertDialogCancel>
              <Button
                className="bg-green-500/20 text-green-400 hover:bg-green-500/40 border-green-500/50"
                onClick={() => {
                  handleReview()
                  setConfirmAction(null)
                }}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout >
    </ProtectedRoute >
  )
}
