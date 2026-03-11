"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { collection, getDocs, query, orderBy, onSnapshot, where } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import { FileText, Trophy, CheckCircle } from "lucide-react"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"
import { useCategories } from "@/hooks/use-categories"
import { useAuth } from "@/lib/firebase/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function JuradoPuntajesPage() {
    const params = useParams()
    const locale = (params.locale as Locale) || "en"
    const t = getTranslations(locale)
    const db = getDbClient()
    const { categories } = useCategories(locale)
    const { user } = useAuth()

    const [projects, setProjects] = useState<any[]>([])
    const [scoringCriteria, setScoringCriteria] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [myReviews, setMyReviews] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!db) return
        setLoading(true)

        // Listen to all projects (finalists)
        const projectsQuery = query(collection(db, "projects"), where("isFinalist", "==", true))
        const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            setLoading(false)
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

        // Fetch criteria
        const fetchCriteria = async () => {
            try {
                const criteriaQuery = query(collection(db, "scoringCriteria"))
                const criteriaSnapshot = await getDocs(criteriaQuery)
                setScoringCriteria(criteriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            } catch (error) {
                console.error("Error fetching criteria:", error)
            }
        }
        fetchCriteria()

        return () => {
            unsubProjects()
            unsubReviews()
        }
    }, [db, user?.id])

    const getCategoryName = (categoryId: string) => {
        if (!categoryId) return "-"
        const index = parseInt(categoryId)
        const category = categories[index]
        if (!category) return "-"
        return locale === "es" ? (category.spanishName || category.englishName) : (category.englishName || category.spanishName)
    }

    const groupedRankings = useMemo(() => {
        const grouped: Record<string, any[]> = {}

        projects.forEach(p => {
            const catId = p.categoryId || "none"
            if (!grouped[catId]) grouped[catId] = []
            grouped[catId].push(p)
        })

        // Sort each category by totalScore desc
        Object.keys(grouped).forEach(catId => {
            grouped[catId].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        })

        return grouped
    }, [projects])

    return (
        <ProtectedRoute allowedRoles={["judge"]}>
            <DashboardLayout title={locale === "es" ? "Panel de Puntajes" : "Scoring Scoreboard"}>
                <div className="space-y-8">
                    <section>
                        <div className="flex flex-col gap-2 mb-6">
                            <h3 className="font-pixel text-2xl text-brand-yellow font-pixel">
                                {locale === "es" ? "Puntajes de Finalistas" : "Finalist Rankings"}
                            </h3>
                            <p className="text-xs text-brand-cyan/60 font-pixel uppercase">
                                {locale === "es" ? "Basado en el promedio de todos los jurados" : "Based on average from all judges"}
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-pulse text-xs font-pixel text-brand-cyan text-center">
                                    LOADING LEADERBOARD...
                                </div>
                            </div>
                        ) : Object.keys(groupedRankings).length === 0 ? (
                            <GlassCard className="p-12 text-center text-brand-cyan/40 font-pixel">
                                {locale === "es" ? "Aún no hay finalistas seleccionados." : "No finalists selected yet."}
                            </GlassCard>
                        ) : (
                            Object.keys(groupedRankings).map(catId => {
                                const ranked = groupedRankings[catId]
                                return (
                                    <GlassCard key={catId} className="p-4 sm:p-6 mb-8 flex flex-col gap-4">
                                        <h3 className="font-pixel text-lg text-brand-yellow">
                                            {locale === "es" ? "Categoría" : "Category"}: {getCategoryName(catId)}
                                        </h3>
                                        <div className="rounded-md border border-brand-cyan/20 overflow-x-auto bg-black/20">
                                            <Table className="min-w-max">
                                                <TableHeader>
                                                    <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                                                        <TableHead className="text-brand-cyan w-12 text-center">#</TableHead>
                                                        <TableHead className="text-brand-cyan">{locale === "es" ? "Proyecto" : "Project"}</TableHead>
                                                        <TableHead className="text-brand-cyan">{locale === "es" ? "Equipo" : "Team"}</TableHead>
                                                        {scoringCriteria.map(c => (
                                                            <TableHead key={c.id} className="text-brand-cyan text-[10px]">
                                                                {c.name}
                                                            </TableHead>
                                                        ))}
                                                        <TableHead className="text-brand-orange text-right">{locale === "es" ? "Puntos" : "Points"}</TableHead>
                                                        <TableHead className="text-brand-cyan/60 text-right text-xs">Reviews</TableHead>
                                                        <TableHead className="text-right w-24"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {ranked.map((p, index) => {
                                                        const isReviewedByMe = myReviews.has(p.id)
                                                        return (
                                                            <TableRow key={p.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5 transition-colors">
                                                                <TableCell className="text-brand-cyan/60 text-center font-bold">{index + 1}</TableCell>
                                                                <TableCell className="font-medium text-brand-cyan">
                                                                    {p.title || "Untitled"}
                                                                </TableCell>
                                                                <TableCell className="text-brand-cyan/80">{p.teamName}</TableCell>
                                                                {scoringCriteria.map(c => (
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
                                                                    {isReviewedByMe && (
                                                                        <div className="flex items-center justify-end text-[10px] text-green-400 font-pixel gap-1">
                                                                            <CheckCircle size={10} /> {locale === "es" ? "MI VOTO" : "MY VOTE"}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </GlassCard>
                                )
                            })
                        )}
                    </section>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
