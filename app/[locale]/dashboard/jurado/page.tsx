"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { useAuth } from "@/lib/firebase/auth-context"
import { Slider } from "@/components/ui/slider"

export default function JuradoDashboard() {
  const db = getDbClient()
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [scoringCriteria, setScoringCriteria] = useState<any[]>([])
  const [scoreForm, setScoreForm] = useState<{ [key: string]: number }>({})
  const [comments, setComments] = useState("")

  useEffect(() => {
    loadProjects()
    loadScores()
    loadScoringCriteria()
  }, [user])

  const loadScoringCriteria = async () => {
    if (!db) {
      return
    }

    const criteriaSnapshot = await getDocs(collection(db, "scoringCriteria"))
    const criteria = criteriaSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    criteria.sort((a, b) => a.order - b.order)
    setScoringCriteria(criteria)

    const initialScores: { [key: string]: number } = {}
    criteria.forEach((c) => {
      initialScores[c.id] = Math.floor(c.maxScore / 2)
    })
    setScoreForm(initialScores)
  }

  const loadProjects = async () => {
    if (!db) {
      return
    }

    const projectsSnapshot = await getDocs(collection(db, "projects"))
    setProjects(projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }

  const loadScores = async () => {
    if (!db || !user) return
    const scoresQuery = query(collection(db, "scores"), where("juradoId", "==", user.id))
    const scoresSnapshot = await getDocs(scoresQuery)
    setScores(scoresSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }

  const submitScore = async () => {
    if (!db || !selectedProject || !user || scoringCriteria.length === 0) return

    const criteriaScores = Object.entries(scoreForm).reduce(
      (acc, [criteriaId, score]) => {
        const criteria = scoringCriteria.find((c) => c.id === criteriaId)
        if (criteria) {
          acc[criteriaId] = score
        }
        return acc
      },
      {} as { [key: string]: number },
    )

    const totalScore = Object.values(criteriaScores).reduce((sum, score) => sum + score, 0) / scoringCriteria.length

    await addDoc(collection(db, "scores"), {
      projectId: selectedProject.id,
      juradoId: user.id,
      criteria: criteriaScores,
      totalScore,
      comments,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    setSelectedProject(null)
    setComments("")
    const initialScores: { [key: string]: number } = {}
    scoringCriteria.forEach((c) => {
      initialScores[c.id] = Math.floor(c.maxScore / 2)
    })
    setScoreForm(initialScores)
    loadScores()
  }

  const deleteScore = async (id: string) => {
    if (!db) {
      return
    }

    await deleteDoc(doc(db, "scores", id))
    loadScores()
  }

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId)
  }

  return (
    <ProtectedRoute allowedRoles={["jurado"]}>
      <DashboardLayout title="Jurado Dashboard">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6">Projects to Score</h3>
            <div className="space-y-4">
              {projects.map((project) => {
                const hasScored = scores.some((s) => s.projectId === project.id)
                return (
                  <GlassCard key={project.id} neonOnHover>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-pixel text-lg text-brand-yellow">{project.title}</h4>
                          <p className="text-brand-cyan/60 text-xs">{project.teamId}</p>
                        </div>
                        {hasScored && (
                          <span className="text-xs font-pixel text-green-400 border border-green-400/30 px-2 py-1 rounded">
                            Scored
                          </span>
                        )}
                      </div>

                      <p className="text-brand-cyan text-sm">{project.description}</p>

                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-orange hover:neon-glow-orange text-sm"
                        >
                          View Repository →
                        </a>
                      )}

                      <PixelButton onClick={() => setSelectedProject(project)} size="sm" className="w-full">
                        {hasScored ? "Update Score" : "Score Project"}
                      </PixelButton>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="font-pixel text-2xl text-brand-yellow mb-6">
              {selectedProject ? "Score Project" : "My Scores"}
            </h3>

            {selectedProject ? (
              <GlassCard>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-pixel text-xl text-brand-orange mb-2">{selectedProject.title}</h4>
                    <p className="text-brand-cyan text-sm">{selectedProject.description}</p>
                  </div>

                  <div className="space-y-4">
                    {scoringCriteria.map((criteria) => (
                      <div key={criteria.id}>
                        <Label className="text-brand-cyan mb-2 block">
                          {criteria.name}: {scoreForm[criteria.id] || 0}/{criteria.maxScore}
                        </Label>
                        <p className="text-brand-cyan/60 text-xs mb-2">{criteria.description}</p>
                        <Slider
                          value={[scoreForm[criteria.id] || 0]}
                          onValueChange={(value) => setScoreForm({ ...scoreForm, [criteria.id]: value[0] })}
                          min={0}
                          max={criteria.maxScore}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}

                    <div>
                      <Label className="text-brand-cyan mb-2 block">Comments</Label>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan"
                        placeholder="Add your feedback..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <PixelButton onClick={submitScore} className="flex-1">
                      Submit Score
                    </PixelButton>
                    <PixelButton onClick={() => setSelectedProject(null)} variant="outline">
                      Cancel
                    </PixelButton>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {scores.map((score) => {
                  const project = getProjectById(score.projectId)
                  return (
                    <GlassCard key={score.id} neonOnHover>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-pixel text-lg text-brand-yellow">{project?.title}</h4>
                            <p className="text-brand-orange text-2xl font-pixel mt-2">
                              {score.totalScore.toFixed(1)}/10
                            </p>
                          </div>
                          <button
                            onClick={() => deleteScore(score.id)}
                            className="text-brand-cyan hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        {score.comments && <p className="text-brand-cyan/80 text-sm">{score.comments}</p>}
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
