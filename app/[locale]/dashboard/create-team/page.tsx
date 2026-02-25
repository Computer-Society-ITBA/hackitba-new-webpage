"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, Users, User } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"
import { getDbClient, getAuthClient } from "@/lib/firebase/client-config"
import { Loading } from "@/components/ui/loading"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { useAuth } from "@/lib/firebase/auth-context"

interface Category {
    id: string
    englishName: string
    spanishName: string
    englishDescription: string
    spanishDescription: string
    iconName: string
    order: number
}


interface CreateTeamPageProps {
    translations: any
    locale: Locale
}


function CreateTeamContent() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as Locale
    const translations = getTranslations(locale)
    const searchParams = useSearchParams()
    const { refreshUser } = useAuth()

    // Form Data
    const [formData, setFormData] = useState({
        teamName: "",
        motivation: "",
        priorities: [] as string[], // category IDs ordered by preference
    })

    const [adminUser, setAdminUser] = useState({
        id: "",
        name: "",
        surname: "",
    })

    const [categories, setCategories] = useState<Category[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [signupEnabled, setSignupEnabled] = useState(true)
    const [signupLoading, setSignupLoading] = useState(true)

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const db = getDbClient()
                if (!db) return

                const [settingsDoc, categoriesSnapshot] = await Promise.all([
                    getDoc(doc(db, "settings", "global")),
                    getDocs(collection(db, "categories")),
                ])

                if (settingsDoc.exists()) {
                    const data = settingsDoc.data()
                    setSignupEnabled(data?.signupEnabled !== false)
                } else {
                    setSignupEnabled(true)
                }

                const cats: Category[] = categoriesSnapshot.docs
                    .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }))
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                setCategories(cats)
                setFormData((prev) => ({ ...prev, priorities: cats.map((c) => c.id) }))
            } catch (err) {
                console.error("Error loading initial data:", err)
                setSignupEnabled(true)
            } finally {
                setSignupLoading(false)
                setCategoriesLoading(false)
            }
        }

        loadInitialData()
    }, [])

    useEffect(() => {
        if (!signupLoading && !signupEnabled) {
            router.replace(`/${locale}/dashboard`)
        }
    }, [signupEnabled, signupLoading, router, locale])

    useEffect(() => {

        // TODO: Fetch user data from backend using userId from query params or session
        const fetchUserData = async () => {
            try {
                const authClient = getAuthClient()
                const currentUser = authClient?.currentUser
                const userId = currentUser?.uid || searchParams.get("userId")

                if (!userId) {
                    setError(translations.auth.createTeam.errors.userNotFound)
                    return
                }

                // TODO: Replace with actual API call
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
                const idToken = currentUser ? await currentUser.getIdToken() : localStorage.getItem("userToken")
                const response = await fetch(`${apiUrl}/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    }
                })
                const data = await response.json()
                setAdminUser(data.user)
            } catch (err) {
                console.error("Failed to fetch user data", err)
            }
        }

        fetchUserData()
    }, [searchParams, params])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("draggedIndex", index.toString())
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault()
        const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"))
        if (draggedIndex === dropIndex) return

        const newPriorities = [...formData.priorities]
        const [draggedItem] = newPriorities.splice(draggedIndex, 1)
        newPriorities.splice(dropIndex, 0, draggedItem)

        setFormData(prev => ({ ...prev, priorities: newPriorities }))
    }

    const handleSubmit = async () => {
        setError("")

        if (!signupEnabled) {
            setError(translations.auth.createTeam.errors.signupDisabled)
            return
        }

        // Validation
        if (!formData.teamName) {
            setError(translations.auth.createTeam.errors.teamNameRequired)
            return
        }

        if (!formData.motivation) {
            setError(translations.auth.createTeam.errors.motivationRequired)
            return
        }

        if (formData.motivation.length < 20) {
            setError(translations.auth.createTeam.errors.motivationTooShort)
            return
        }

        setLoading(true)
        try {
            // Check if team name already exists
            // TODO: Replace with actual API call
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
            const authClient = getAuthClient()
            const userToken = await authClient?.currentUser?.getIdToken() || localStorage.getItem("userToken")

            if (!userToken) {
                throw new Error(translations.auth.createTeam.errors.noSession)
            }
            const teamsResponse = await fetch(`${apiUrl}/teams`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                }
            })
            const teamsData = await teamsResponse.json()
            const teamsList = Array.isArray(teamsData?.teams) ? teamsData.teams : []
            const existingTeams = teamsList.map((team: any) => team?.name).filter(Boolean)

            if (existingTeams.some((teamName: string) => teamName.toLowerCase() === formData.teamName.toLowerCase())) {
                setError(translations.auth.createTeam.errors.teamNameExists)
                setLoading(false)
                return
            }

            // Map category IDs back to their sorted index (used by backend)
            const categoryIdToIndex = Object.fromEntries(categories.map((c, i) => [c.id, i]))
            const category_1 = categoryIdToIndex[formData.priorities[0]] ?? 0
            const category_2 = categoryIdToIndex[formData.priorities[1]] ?? 1
            const category_3 = categoryIdToIndex[formData.priorities[2]] ?? 2

            const payload = {
                name: formData.teamName,
                tell_why: formData.motivation,
                category_1,
                category_2,
                category_3,
                uid: adminUser.id,
                is_created_by_admin: false,
            }
            console.log("Creating team...", payload)

            // TODO: Replace with actual API call
            console.log(payload)
            const response = await fetch(`${apiUrl}/teams`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || translations.auth.createTeam.errors.createFailed)
            }

            // Refresh auth context so the new team is reflected immediately
            await refreshUser()

            // Success - redirect to dashboard
            router.push(`/${locale}/dashboard`)
        } catch (err: any) {
            setError(err.message || translations.auth.createTeam.errors.createFailed)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-center px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="w-full max-w-full sm:max-w-lg relative z-10 flex flex-col gap-2 sm:gap-8 px-1 sm:px-0">
                {/* Header */}
                <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1">
                        <h1 className="leading-none font-pixel text-sm">POST /api/teams/create</h1>
                    </div>
                </div>

                {/* Main Card */}
                <GlassCard className="p-6 sm:p-8">
                    <div className="flex flex-col">
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6">
                                <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider">Team Configuration</h2>
                            </div>

                            {/* Admin User Display */}
                            <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg">
                                <div className="flex items-center">
                                    <div>
                                        <p className="text-brand-cyan font-pixel text-sm">
                                            {adminUser.name} {adminUser.surname}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Team Name */}
                            <div className="space-y-2">
                                <Label htmlFor="teamName" className="text-brand-cyan font-pixel text-xs">
                                    Team Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="teamName"
                                    value={formData.teamName}
                                    onChange={handleInputChange}
                                    className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan"
                                    placeholder="Los Hackers"
                                />
                            </div>

                            {/* Motivation */}
                            <div className="space-y-2">
                                <Label htmlFor="motivation" className="text-brand-cyan font-pixel text-xs">
                                    Tell us why you want to participate <span className="text-red-500">*</span>
                                </Label>
                                <textarea
                                    id="motivation"
                                    value={formData.motivation}
                                    onChange={handleInputChange}
                                    className="w-full min-h-[120px] bg-brand-black/40 border-2 border-brand-cyan/20 focus:border-brand-cyan rounded-lg p-3 text-sm text-brand-cyan placeholder:text-brand-cyan/40 focus:outline-none resize-none"
                                    placeholder="We want to participate because..."
                                />
                                <p className="text-[12px] text-brand-cyan/40 uppercase">Min 20 characters</p>
                            </div>

                            {/* Category Priorities */}
                            <div className="space-y-4">
                                <Label className="text-brand-cyan font-pixel text-xs">
                                    Category Preference <br />(Drag to reorder)
                                </Label>
                                {categoriesLoading ? (
                                    <p className="text-brand-cyan/40 font-pixel text-xs animate-pulse">Loading categories...</p>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.priorities.map((catId, i) => {
                                            const cat = categories.find((c) => c.id === catId)
                                            if (!cat) return null
                                            const name = locale === "es" ? cat.spanishName : cat.englishName
                                            const IconComponent = (LucideIcons as any)[cat.iconName] || LucideIcons.HelpCircle
                                            return (
                                                <div
                                                    key={catId}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, i)}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, i)}
                                                    className="flex items-center justify-between bg-brand-black/40 border border-brand-cyan/10 p-3 rounded group hover:border-brand-orange/40 transition-all cursor-grab active:cursor-grabbing hover:bg-brand-orange/5"
                                                >
                                                    <div className="flex items-center gap-3 pointer-events-none">
                                                        <span className="text-brand-orange font-pixel text-[10px]">{i + 1}</span>
                                                        <IconComponent className="w-4 h-4 text-brand-cyan" />
                                                        <span className="text-[14px] text-brand-cyan">{name}</span>
                                                    </div>
                                                    <div className="flex items-center text-brand-cyan/20 group-hover:text-brand-orange/40 transition-colors pointer-events-none">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 px-8 p-2 rounded bg-red-500/10 border border-red-500/30 animate-in zoom-in-95 duration-200">
                                <p className="text-[10px] text-red-400 font-pixel">{error}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-8">
                            <PixelButton
                                onClick={handleSubmit}
                                disabled={loading || !signupEnabled}
                                className="w-full flex flex-row justify-between items-center"
                            >
                                {loading ? (
                                    "CREATING TEAM..."
                                ) : (
                                    <>CREATE TEAM <ChevronRight className="w-6 h-6 ml-2" /></>
                                )}
                            </PixelButton>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}

export default function CreateTeamPage() {
    return (
        <Suspense fallback={<Loading text="Establishing Team Protocol..." />}>
            <CreateTeamContent />
        </Suspense>
    )
}
