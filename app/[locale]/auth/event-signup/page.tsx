"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { PixelButton } from "@/components/ui/pixel-button"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import type { UserRole } from "@/lib/firebase/types"
import { ChevronRight, ChevronLeft, Upload, Github, Linkedin, Instagram, Twitter, ExternalLink, Users, UserPlus } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getTranslations } from "@/lib/i18n/get-translations"


interface EventSignupPageProps {
    translations: any
    locale: Locale
}

export default function EventSignupPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as Locale
    const translations = getTranslations(locale)
    const searchParams = useSearchParams()
    const fileInputRef = useRef<HTMLInputElement>(null)


    // Step management
    const [currentStep, setCurrentStep] = useState(1)
    const [role, setRole] = useState<UserRole | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    // Form Data
    const [formData, setFormData] = useState({
        // Step 1
        dni: "",
        university: "",
        career: "",
        age: "",
        company: "",
        professionalRole: "",
        photo: "",
        dietaryPreference: "",
        // Step 2
        github: "",
        linkedin: "",
        instagram: "",
        twitter: "",
        cvLink: "",
        // Step 3 (Participante only)
        hasTeam: "no",
        noTeamOption: "solo" as "solo" | "create",
        teamName: "",
        teamCode: "",
        priorities: ["AI", "Web3", "HealthTech"],
    })

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // TODO: Fetch user's assigned role from backend
        // For now, simulating with query param or default
        const fetchUserRole = async () => {
            try {
                // const response = await fetch('/api/auth/me')
                // const data = await response.json()
                // setRole(data.role)

                // Temporary: Use query param for testing
                const roleParam = searchParams.get("role") as UserRole
                if (roleParam && ["jurado", "participante", "mentor"].includes(roleParam)) {
                    setRole(roleParam)
                } else {
                    setRole("participante") // Default for testing
                }
            } catch (err) {
                console.error("Failed to fetch user role", err)
                setRole("participante")
            }
        }

        fetchUserRole()
    }, [searchParams])

    const totalSteps = role === "participante" ? 3 : 2

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormData((prev) => ({ ...prev, photo: file.name }))

            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleNext = () => {
        setError("")

        // Validation for Step 1
        if (currentStep === 1) {
            if (!formData.dni) {
                setError("DNI is required")
                return
            }
            if (!/^\d+$/.test(formData.dni)) {
                setError("DNI must be numeric")
                return
            }

            if (role === "participante") {
                if (!formData.age || !formData.university || !formData.career) {
                    setError("All personal data fields are required")
                    return
                }
                const age = parseInt(formData.age)
                if (isNaN(age) || age < 18) {
                    setError("You must be at least 18 years old")
                    return
                }
            } else {
                if (!formData.company || !formData.professionalRole || !formData.photo) {
                    setError("Company, Role and Photo are required")
                    return
                }
            }
        }

        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setError("")
        }
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
        setLoading(true)
        try {
            const payload = {
                role,
                ...formData
            }
            console.log("Sending event registration data...", payload)

            // TODO: Replace with actual API call
            // const response = await fetch('/api/event/register', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(payload)
            // })

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            // TODO: Get userId from backend response
            // const userId = response.data.userId

            // Success - redirect based on team choice
            if (role === "participante" && formData.hasTeam === "no" && formData.noTeamOption === "create") {
                // TODO: Replace mock userId with actual userId from backend
                const userId = "user-123" // Mock userId
                router.push(`/${locale}/dashboard/create-team?userId=${userId}`)
            } else {
                router.push(`/${locale}/dashboard`)
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit registration")
        } finally {
            setLoading(false)
        }
    }

    const renderStep = () => {
        if (!role) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-brand-cyan font-pixel text-xs uppercase">Loading...</p>
                </div>
            )
        }

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6">
                            <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider">{role === "participante" ? "Personal Data" : "Professional Data"}</h2>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dni" className="text-brand-cyan font-pixel text-xs">DNI <span className="text-red-500">*</span></Label>
                            <Input id="dni" type="number" value={formData.dni} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                        </div>

                        {role === "participante" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="university" className="text-brand-cyan font-pixel text-xs">Universidad <span className="text-red-500">*</span></Label>
                                    <Input id="university" value={formData.university} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="career" className="text-brand-cyan font-pixel text-xs">Carrera <span className="text-red-500">*</span></Label>
                                        <Input id="career" value={formData.career} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="age" className="text-brand-cyan font-pixel text-xs">Edad <span className="text-red-500">*</span></Label>
                                        <Input id="age" type="number" value={formData.age} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                                        {formData.age && parseInt(formData.age) > 27 && (
                                            <p className="text-xs text-yellow-500 leading-tight font-pixel">Warning: Priorities given to ages 27 and below.</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-brand-cyan font-pixel text-xs">Empresa <span className="text-red-500">*</span></Label>
                                    <Input id="company" value={formData.company} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="professionalRole" className="text-brand-cyan font-pixel text-xs">Rol en la empresa <span className="text-red-500">*</span></Label>
                                    <Input id="professionalRole" value={formData.professionalRole} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-brand-cyan font-pixel text-xs">Foto <span className="text-red-500">*</span></Label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-brand-cyan/20 rounded-lg cursor-pointer hover:border-brand-cyan/40 transition-colors bg-brand-black/20 overflow-hidden relative aspect-square w-full mx-auto flex items-center justify-center p-0"
                                    >
                                        {photoPreview ? (
                                            <div className="w-full h-full relative group">
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <p className="font-pixel text-[8px] text-brand-cyan uppercase line-height-none">Change Photo</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 flex flex-col items-center justify-center">
                                                <Upload className="w-6 h-6 text-brand-cyan/40 mb-2" />
                                                <p className="text-[10px] text-brand-cyan/60 uppercase text-center">
                                                    Elegir archivo
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {formData.photo && !photoPreview && (
                                        <p className="text-[6px] text-brand-orange mt-1 uppercase font-pixel tracking-tighter w-full text-center">
                                            Ready: {formData.photo}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="space-y-2 pt-2 border-t border-brand-cyan/10">
                            <Label htmlFor="dietaryPreference" className="text-brand-cyan font-pixel text-xs">Preferencia Alimenticia (Opcional)</Label>
                            <Input id="dietaryPreference" value={formData.dietaryPreference} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/10 focus:border-brand-cyan text-xs" placeholder="Vegetariano, Celíaco, etc." />
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6">
                            <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider text-balance">Contact & Social Media</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="github" className="text-brand-cyan font-pixel text-xs flex items-center gap-2"><Github className="w-3 h-3" /> Github</Label>
                                <Input id="github" value={formData.github} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin" className="text-brand-cyan font-pixel text-xs flex items-center gap-2"><Linkedin className="w-3 h-3" /> LinkedIn</Label>
                                <Input id="linkedin" value={formData.linkedin} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan text-xs" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="instagram" className="text-brand-cyan font-pixel text-xs flex items-center gap-2"><Instagram className="w-3 h-3" /> Instagram</Label>
                                <Input id="instagram" value={formData.instagram} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twitter" className="text-brand-cyan font-pixel text-xs flex items-center gap-2"><Twitter className="w-3 h-3" /> Twitter</Label>
                                <Input id="twitter" value={formData.twitter} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan text-xs" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cvLink" className="text-brand-cyan font-pixel text-xs flex items-center gap-2"><ExternalLink className="w-3 h-3" /> Link a CV</Label>
                            <Input id="cvLink" value={formData.cvLink} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan text-xs" placeholder="https://..." />
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="mb-6">
                            <h2 className="text-brand-orange font-pixel text-lg uppercase tracking-wider">Team Status</h2>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-brand-cyan font-pixel text-xs">¿Vas con equipo? <span className="text-red-500">*</span></Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, hasTeam: "yes" }))}
                                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${formData.hasTeam === "yes" ? "border-brand-orange bg-brand-orange/10" : "border-brand-cyan/20 bg-brand-black/40 opacity-60"}`}
                                >
                                    <Users className="w-6 h-6 text-brand-orange" />
                                    <span className="font-pixel text-[10px] uppercase">Sí, ya tengo</span>
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, hasTeam: "no" }))}
                                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${formData.hasTeam === "no" ? "border-brand-cyan bg-brand-cyan/10" : "border-brand-cyan/20 bg-brand-black/40 opacity-60"}`}
                                >
                                    <UserPlus className="w-6 h-6 text-brand-cyan" />
                                    <span className="font-pixel text-[10px] uppercase">No tengo equipo</span>
                                </button>
                            </div>
                        </div>

                        {formData.hasTeam === "yes" ? (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <Label htmlFor="teamCode" className="text-brand-cyan font-pixel text-xs">Ingresar código o nombre de equipo <span className="text-red-500">*</span></Label>
                                    <Input id="teamCode" value={formData.teamCode} onChange={handleInputChange} className="bg-brand-black/40 border-brand-cyan/20 focus:border-brand-cyan" placeholder="TEAM-XXXX" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                    <Label className="text-brand-cyan font-pixel text-xs">¿Cómo quieres seguir? <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, noTeamOption: "solo" }))}
                                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${formData.noTeamOption === "solo" ? "border-brand-orange bg-brand-orange/10" : "border-brand-cyan/20 bg-brand-black/40 opacity-60"}`}
                                        >
                                            <UserPlus className="w-6 h-6 text-brand-orange" />
                                            <span className="font-pixel text-[10px] uppercase">Ir solo</span>
                                        </button>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, noTeamOption: "create" }))}
                                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${formData.noTeamOption === "create" ? "border-brand-cyan bg-brand-cyan/10" : "border-brand-cyan/20 bg-brand-black/40 opacity-60"}`}
                                        >
                                            <Users className="w-6 h-6 text-brand-cyan" />
                                            <span className="font-pixel text-[10px] uppercase">Crear equipo</span>
                                        </button>
                                    </div>
                                </div>

                                {formData.noTeamOption === "solo" ? (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <Label className="text-brand-cyan font-pixel text-xs uppercase tracking-tighter italic">Drag to reorder categories</Label>
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
                                ) : (
                                    <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded animate-in fade-in duration-300">
                                        <p className="text-[10px] text-brand-cyan/80 uppercase leading-relaxed italic">
                                            * Serás redirigido a la creación de equipo al finalizar.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            default:
                return null
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
                        <h1 className="font-pixel text-4xl">POST /api/event/register</h1>
                    </div>
                    <p className="text-brand-cyan/60 text-xs font-pixel uppercase tracking-wider">
                        {role ? `Event Registration - ${role.charAt(0).toUpperCase() + role.slice(1)}` : "Loading..."}
                    </p>
                </div>

                {/* Progress */}
                <div className="space-y-2 px-2">
                    <div className="flex justify-between text-[8px] font-pixel uppercase text-brand-cyan/40 px-1">
                        <span>Init</span>
                        <span>Complete</span>
                    </div>
                    <Progress value={(currentStep / totalSteps) * 100} className="h-1 bg-brand-black border border-brand-cyan/10" />
                </div>

                {/* Main Card */}
                <GlassCard neonOnHover neonColor={currentStep === totalSteps ? "orange" : "cyan"} className="p-8">
                    <div className="min-h-[320px] flex flex-col">
                        {renderStep()}

                        {error && (
                            <div className="mt-4 px-8 p-2 rounded bg-red-500/10 border border-red-500/30 animate-in zoom-in-95 duration-200">
                                <p className="text-[10px] text-red-400 font-pixel">{error}</p>
                            </div>
                        )}

                        <div className="mt-auto pt-8 flex gap-4">
                            {currentStep > 1 && (
                                <PixelButton
                                    variant="outline"
                                    onClick={handleBack}
                                    className="w-[35%] flex flex-row justify-between items-center p-4"
                                    disabled={loading}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                    BACK
                                </PixelButton>
                            )}
                            <PixelButton
                                onClick={handleNext}
                                disabled={loading}
                                className="w-full flex flex-row justify-between items-center"
                            >
                                {loading ? (
                                    "UPLOADING..."
                                ) : currentStep === totalSteps ? (
                                    <>FINISH REGISTRATION <ChevronRight className="w-6 h-6 ml-2" /></>
                                ) : (
                                    <>NEXT STEP <ChevronRight className="w-6 h-6 ml-2" /></>
                                )}
                            </PixelButton>
                        </div>
                    </div>
                </GlassCard>

                {/* Footer */}
                <p className="text-center text-[10px] font-pixel text-brand-cyan/40 uppercase">
                    Need help? <Link href={`/${searchParams.get("locale") || 'es'}/support`} className="text-brand-orange hover:neon-glow-orange transition-all ml-2 underline decoration-brand-orange/30">Contact Support</Link>
                </p>
            </div>
        </div>
    )
}
