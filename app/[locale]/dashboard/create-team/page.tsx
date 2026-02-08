"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, Users, User } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"


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

    // Form Data
    const [formData, setFormData] = useState({
        teamName: "",
        motivation: "",
        priorities: ["AI", "Web3", "HealthTech"],
    })

    const [adminUser, setAdminUser] = useState({
        id: "",
        name: "",
        surname: "",
    })

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {

        // TODO: Fetch user data from backend using userId from query params or session
        const fetchUserData = async () => {
            try {
                const userId = searchParams.get("userId")

                // TODO: Replace with actual API call
                // const response = await fetch(`/api/auth/user/${userId}`)
                // const data = await response.json()
                // setAdminUser(data)

                // Temporary mock data
                setAdminUser({
                    id: userId || "user-123",
                    name: "Juan",
                    surname: "Pérez",
                })
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

        // Validation
        if (!formData.teamName) {
            setError("Team name is required")
            return
        }

        if (!formData.motivation) {
            setError("Please tell us why you want to participate")
            return
        }

        if (formData.motivation.length < 20) {
            setError("Motivation must be at least 20 characters")
            return
        }

        setLoading(true)
        try {
            // Check if team name already exists
            // TODO: Replace with actual API call
            // const teamsResponse = await fetch('/api/teams')
            // const teams = await teamsResponse.json()

            // Mock existing teams for testing
            const existingTeams = ["Los Hackers", "Team Alpha", "Code Warriors"]

            if (existingTeams.some(team => team.toLowerCase() === formData.teamName.toLowerCase())) {
                setError("Team name already exists. Please choose a different name.")
                setLoading(false)
                return
            }

            const payload = {
                teamName: formData.teamName,
                motivation: formData.motivation,
                categoryPriorities: formData.priorities,
                adminUserId: adminUser.id,
            }
            console.log("Creating team...", payload)

            // TODO: Replace with actual API call
            // const response = await fetch('/api/teams/create', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(payload)
            // })

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Success - redirect to dashboard
            router.push(`/${locale}/dashboard`)
        } catch (err: any) {
            setError(err.message || "Failed to create team")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 flex flex-col gap-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="font-pixel text-xl">POST /api/teams/create</h1>
                    </div>
                </div>

                {/* Main Card */}
                <GlassCard className="p-8">
                    <div className="min-h-[500px] flex flex-col">
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6">
                                <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider">Team Configuration</h2>
                            </div>

                            {/* Admin User Display */}
                            <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg">
                                <div className="flex items-center">
                                    <div>
                                        <p className="text-[8px] text-brand-cyan/60 font-pixel tracking-wider">Team Admin</p>
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
                                <Label className="text-brand-cyan font-pixel text-xs tracking-tighter">
                                    Category Preference (Drag to reorder)
                                </Label>
                                <div className="space-y-2">
                                    {formData.priorities.map((cat, i) => (
                                        <div
                                            key={cat}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, i)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, i)}
                                            className="flex items-center justify-between bg-brand-black/40 border border-brand-cyan/10 p-3 rounded group hover:border-brand-orange/40 transition-all cursor-grab active:cursor-grabbing hover:bg-brand-orange/5"
                                        >
                                            <div className="flex items-center gap-3 pointer-events-none">
                                                <span className="text-brand-orange font-pixel text-[10px]">{i + 1}</span>
                                                <span className="text-[10px] text-brand-cyan/80 uppercase">{cat}</span>
                                            </div>
                                            <div className="flex items-center text-brand-cyan/20 group-hover:text-brand-orange/40 transition-colors pointer-events-none">
                                                <Users className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                disabled={loading}
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

                {/* Footer */}
                <p className="text-center text-[10px] font-pixel text-brand-cyan/40 uppercase">
                    Changed your mind? <button onClick={() => router.push(`/${locale}/dashboard`)} className="text-brand-orange hover:neon-glow-orange transition-all ml-2 underline decoration-brand-orange/30">Skip for now</button>
                </p>
            </div>
        </div>
    )
}

export default function CreateTeamPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4">
                <p className="text-brand-cyan font-pixel text-xs uppercase animate-pulse">Establishing Team Protocol...</p>
            </div>
        }>
            <CreateTeamContent />
        </Suspense>
    )
}
