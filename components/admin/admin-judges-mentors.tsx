"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { getDbClient, getStorageClient } from "@/lib/firebase/client-config"
import type { Locale } from "@/lib/i18n/config"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { PixelButton } from "@/components/ui/pixel-button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Search, Edit2, Trash2, Plus, Upload, Image as ImageIcon, AlertCircle, X, Save, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AdminJudgesMentorsProps {
    locale: Locale
    translations: any
}

type PersonType = "judges" | "mentors"

interface Judge {
    id: string
    email: string
    name: string
    position: string
    company: string
    englishBio: string
    spanishBio: string
    linkedin?: string
    github?: string
    instagram?: string
    twitter?: string
    avatarPath?: string
    avatar?: string
}

interface Mentor extends Judge {
    category?: "entrepreneurship" | "tech" | "oratory"
    categories?: ("entrepreneurship" | "tech" | "oratory")[]
}

type Person = Judge | Mentor

export function AdminJudgesMentors({ locale, translations }: AdminJudgesMentorsProps) {
    const [personType, setPersonType] = useState<PersonType>("judges")
    const [people, setPeople] = useState<Person[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 15

    // Edit Dialog States
    const [showDialog, setShowDialog] = useState(false)
    const [editingPerson, setEditingPerson] = useState<Person | null>(null)
    const [originalAvatarPath, setOriginalAvatarPath] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    
    // Email Dialog States
    const [showEmailDialog, setShowEmailDialog] = useState(false)
    const [emailEditingPerson, setEmailEditingPerson] = useState<Person | null>(null)
    const [emailValue, setEmailValue] = useState("")
    const [emailSaving, setEmailSaving] = useState(false)

    const db = getDbClient()
    const storage = getStorageClient()

    // Form data
    const [formData, setFormData] = useState<Partial<Person> & { categories?: ("entrepreneurship" | "tech" | "oratory")[] }>({
        email: "",
        name: "",
        position: "",
        company: "",
        englishBio: "",
        spanishBio: "",
        linkedin: "",
        github: "",
        instagram: "",
        twitter: "",
        categories: ["tech"],
    })

    const fetchData = async () => {
        if (!db) return
        setLoading(true)
        try {
            const collectionName = personType === "judges" ? "judges" : "mentors"
            const snapshot = await getDocs(collection(db, collectionName))
            const data = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const d = doc.data()
                    let avatarUrl = d.avatarPath

                    // Resolve avatar from Storage if it's a path (not a full URL)
                    if (d.avatarPath && !d.avatarPath.startsWith("http") && storage) {
                        try {
                            const { getDownloadURL: getStorageUrl, ref: storageRef } = await import("firebase/storage")
                            const avatarRef = storageRef(storage, d.avatarPath)
                            avatarUrl = await getStorageUrl(avatarRef)
                        } catch (err) {
                            console.error(`Failed to resolve avatar for ${d.name}:`, err)
                            avatarUrl = null
                        }
                    }

                    return {
                        id: doc.id,
                        email: d.email || "",
                        name: d.name,
                        position: d.position,
                        company: d.company,
                        englishBio: d.englishBio || d.bio || "",
                        spanishBio: d.spanishBio || d.bio || "",
                        linkedin: d.linkedin,
                        github: d.github,
                        instagram: d.instagram,
                        twitter: d.twitter,
                        avatarPath: d.avatarPath,
                        avatar: avatarUrl,
                        // Support both new (categories array) and old (category string) formats
                        categories: d.categories && Array.isArray(d.categories) ? d.categories : (d.category ? [d.category] : []),
                        category: d.category,
                    } as Person
                })
            )
            setPeople(data)
        } catch (error) {
            console.error("Error fetching judges/mentors:", error)
            toast({ title: "Error loading data", description: String(error) })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [db, personType])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleOpenDialog = (person?: Person) => {
        if (person) {
            setEditingPerson(person)
            setOriginalAvatarPath(person.avatarPath || null)
            const mentorCategories = personType === "mentors" && (person as Mentor).categories 
                ? (person as Mentor).categories 
                : []
            setFormData({
                email: person.email,
                name: person.name,
                position: person.position,
                company: person.company,
                englishBio: person.englishBio,
                spanishBio: person.spanishBio,
                linkedin: person.linkedin,
                github: person.github,
                instagram: person.instagram,
                twitter: person.twitter,
                categories: (mentorCategories && mentorCategories.length > 0) ? mentorCategories : ["tech"],
            })
            setPhotoPreview(person.avatar || null)
            setPhotoFile(null)
        } else {
            setEditingPerson(null)
            setOriginalAvatarPath(null)
            setFormData({
                email: "",
                name: "",
                position: "",
                company: "",
                englishBio: "",
                spanishBio: "",
                linkedin: "",
                github: "",
                instagram: "",
                twitter: "",
                categories: ["tech"],
            })
            setPhotoPreview(null)
            setPhotoFile(null)
        }
        setShowDialog(true)
    }

    const handleSave = async () => {
        if (!db) {
            toast({ title: "Error", description: "Database not available" })
            return
        }

        if (!formData.name) {
            toast({ title: "Error", description: "Name is required" })
            return
        }

        setIsSaving(true)
        try {
            const collectionName = personType === "judges" ? "judges" : "mentors"
            let avatarPath: string | null = null
            let tempAvatarPath: string | null = null

            // Handle photo upload or keep existing
            if (photoFile && storage) {
                // New photo being uploaded
                try {
                    const isNewDoc = !editingPerson?.id
                    const docId = editingPerson?.id || "temp"
                    const fileName = `${personType}/${docId}`
                    
                    console.log(`Uploading photo to: ${fileName}`)
                    const sRef = storageRef(storage, fileName)
                    await uploadBytes(sRef, photoFile)
                    
                    avatarPath = fileName
                    if (isNewDoc) {
                        tempAvatarPath = fileName
                    }
                } catch (err) {
                    console.error("Error uploading photo:", err)
                    toast({ title: "Warning", description: "Photo upload failed, but data will be saved" })
                    // If upload fails, keep the original path for editing
                    avatarPath = originalAvatarPath
                }
            } else if (originalAvatarPath) {
                // No new photo, keep existing
                avatarPath = originalAvatarPath
            }

            const payload: any = {
                email: formData.email,
                name: formData.name,
                position: formData.position,
                company: formData.company,
                englishBio: formData.englishBio,
                spanishBio: formData.spanishBio,
                linkedin: formData.linkedin || "",
                github: formData.github || "",
                instagram: formData.instagram || "",
                twitter: formData.twitter || "",
                ...(personType === "mentors" && { categories: formData.categories || [] }),
                updatedAt: new Date(),
            }

            // Only include avatarPath if we have one
            if (avatarPath) {
                payload.avatarPath = avatarPath
            }

            if (editingPerson) {
                // Update existing document
                const docRef = doc(db, collectionName, editingPerson.id)
                await updateDoc(docRef, payload)
                toast({ title: "Success", description: `${personType === "judges" ? "Judge" : "Mentor"} updated` })
            } else {
                // Create new document
                const docRef = await addDoc(collection(db, collectionName), {
                    ...payload,
                    createdAt: new Date(),
                })
                
                // If photo was uploaded with temp ID, move it to real doc ID
                if (tempAvatarPath && storage) {
                    try {
                        const newFileName = `${personType}/${docRef.id}`
                        console.log(`Moving photo from ${tempAvatarPath} to ${newFileName}`)
                        
                        const { getBytes, deleteObject } = await import("firebase/storage")
                        const tempRef = storageRef(storage, tempAvatarPath)
                        const newRef = storageRef(storage, newFileName)
                        
                        // Copy to new location
                        const fileData = await getBytes(tempRef)
                        await uploadBytes(newRef, fileData)
                        
                        // Update Firestore with real path
                        await updateDoc(docRef, { avatarPath: newFileName })
                        
                        // Clean up temp file
                        try {
                            await deleteObject(tempRef)
                        } catch (_) {
                            console.warn("Could not delete temp file, will remain in storage")
                        }
                    } catch (err) {
                        console.error("Error moving photo to final path:", err)
                        // Data is saved with temp path, can be manually fixed if needed
                    }
                }
                
                toast({ title: "Success", description: `${personType === "judges" ? "Judge" : "Mentor"} created` })
            }

            setShowDialog(false)
            setOriginalAvatarPath(null)
            await fetchData()
        } catch (error) {
            console.error("Error saving:", error)
            toast({ title: "Error", description: String(error) })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!db || !deleteTarget) return

        try {
            const collectionName = personType === "judges" ? "judges" : "mentors"
            await deleteDoc(doc(db, collectionName, deleteTarget))
            toast({ title: "Success", description: `${personType === "judges" ? "Judge" : "Mentor"} deleted` })
            setShowDeleteConfirm(false)
            setDeleteTarget(null)
            await fetchData()
        } catch (error) {
            console.error("Error deleting:", error)
            toast({ title: "Error", description: String(error) })
        }
    }

    const handleOpenEmailDialog = (person: Person) => {
        setEmailEditingPerson(person)
        setEmailValue(person.email)
        setShowEmailDialog(true)
    }

    const handleSaveEmail = async () => {
        if (!db || !emailEditingPerson || !emailValue.trim()) {
            toast({ title: "Error", description: "Email is required" })
            return
        }

        setEmailSaving(true)
        try {
            const collectionName = personType === "judges" ? "judges" : "mentors"
            const docRef = doc(db, collectionName, emailEditingPerson.id)
            await updateDoc(docRef, { email: emailValue.trim() })
            toast({ title: "Success", description: "Email updated" })
            setShowEmailDialog(false)
            setEmailEditingPerson(null)
            await fetchData()
        } catch (error) {
            console.error("Error updating email:", error)
            toast({ title: "Error", description: String(error) })
        } finally {
            setEmailSaving(false)
        }
    }

    const filteredPeople = useMemo(() => {
        let filtered = people

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.email.toLowerCase().includes(lower) ||
                p.company.toLowerCase().includes(lower)
            )
        }

        return filtered
    }, [people, searchTerm])

    const pagedPeople = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredPeople.slice(start, start + pageSize)
    }, [filteredPeople, page])

    const totalPages = Math.ceil(filteredPeople.length / pageSize)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 p-1 bg-brand-navy/40 border border-brand-cyan/20 rounded-lg">
                    <button
                        onClick={() => {
                            setPersonType("judges")
                            setPage(1)
                            setSearchTerm("")
                        }}
                        className={cn(
                            "px-4 py-2 rounded font-pixel text-xs transition-all",
                            personType === "judges" ? "bg-brand-orange text-brand-navy" : "text-brand-cyan hover:bg-brand-cyan/10"
                        )}
                    >
                        {locale === "es" ? "Jurados" : "Judges"}
                    </button>
                    <button
                        onClick={() => {
                            setPersonType("mentors")
                            setPage(1)
                            setSearchTerm("")
                        }}
                        className={cn(
                            "px-4 py-2 rounded font-pixel text-xs transition-all",
                            personType === "mentors" ? "bg-brand-orange text-brand-navy" : "text-brand-cyan hover:bg-brand-cyan/10"
                        )}
                    >
                        {locale === "es" ? "Mentores" : "Mentors"}
                    </button>
                </div>

                <div className="flex gap-3 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/40" />
                        <Input
                            placeholder={locale === "es" ? "Buscar..." : "Search..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan h-9"
                        />
                    </div>

                    <button
                        onClick={() => handleOpenDialog()}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 rounded hover:bg-brand-yellow/30 transition-colors font-pixel text-xs"
                    >
                        <Plus size={16} />
                        {locale === "es" ? "Agregar" : "Add"}
                    </button>
                </div>
            </div>

            {/* Table */}
            <GlassCard className="overflow-hidden border-brand-cyan/10">
                {loading ? (
                    <div className="p-12 text-center text-brand-cyan animate-pulse font-pixel">Loading...</div>
                ) : (
                    <ScrollArea className="overflow-x-auto">
                        <div className="min-w-full pb-6">
                            <Table>
                                <TableHeader className="bg-brand-navy/60">
                                    <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                                        <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Acciones" : "Actions"}</TableHead>
                                        <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Foto" : "Photo"}</TableHead>
                                        <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Nombre" : "Name"}</TableHead>
                                        <TableHead className="h-8 py-1 text-[10px]">Email</TableHead>
                                        <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Posición" : "Position"}</TableHead>
                                        <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Compañía" : "Company"}</TableHead>
                                        {personType === "mentors" && (
                                            <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Categoría" : "Category"}</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pagedPeople.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={personType === "mentors" ? 7 : 6} className="text-center py-8 text-brand-cyan/40">
                                                {locale === "es" ? "No hay " : "No"} {personType === "judges" ? "jurados" : "mentores"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pagedPeople.map((person) => (
                                            <TableRow key={person.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5">
                                                <TableCell className="text-[10px] py-1 flex gap-1">
                                                    <button
                                                        onClick={() => handleOpenDialog(person)}
                                                        className="text-sm px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded hover:bg-brand-cyan/20 transition-colors flex items-center gap-1"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEmailDialog(person)}
                                                        className="text-sm px-2 py-1 bg-brand-yellow/10 text-brand-yellow rounded hover:bg-brand-yellow/20 transition-colors flex items-center gap-1"
                                                        title="Add/Edit Email"
                                                    >
                                                        @
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeleteTarget(person.id)
                                                            setShowDeleteConfirm(true)
                                                        }}
                                                        className="text-sm px-2 py-1 bg-red-700/10 text-red-400 rounded hover:bg-red-700/20 transition-colors flex items-center gap-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    {person.avatar ? (
                                                        <img src={person.avatar} alt={person.name} className="w-8 h-8 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded bg-brand-cyan/20 flex items-center justify-center text-[10px]">
                                                            <ImageIcon size={12} />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-brand-yellow text-[10px] py-1">{person.name}</TableCell>
                                                <TableCell className="text-brand-cyan/80 text-[10px] py-1">{person.email}</TableCell>
                                                <TableCell className="text-brand-cyan/80 text-[10px] py-1">{person.position || "-"}</TableCell>
                                                <TableCell className="text-brand-cyan/80 text-[10px] py-1">{person.company || "-"}</TableCell>
                                                {personType === "mentors" && (
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1">
                                                        {((person as Mentor).categories || []).length > 0
                                                            ? (person as Mentor).categories?.map(cat => {
                                                                if (cat === "tech") return "Tech"
                                                                if (cat === "entrepreneurship") return locale === "es" ? "Emprend." : "Entrep."
                                                                if (cat === "oratory") return locale === "es" ? "Oratoria" : "Oratory"
                                                                return cat
                                                            }).join(", ")
                                                            : "-"
                                                        }
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                )}
            </GlassCard>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 text-xs font-pixel bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded disabled:opacity-50 hover:bg-brand-navy/70"
                    >
                        {locale === "es" ? "Anterior" : "Previous"}
                    </button>
                    <span className="text-brand-cyan text-xs font-pixel">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 text-xs font-pixel bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded disabled:opacity-50 hover:bg-brand-navy/70"
                    >
                        {locale === "es" ? "Siguiente" : "Next"}
                    </button>
                </div>
            )}

            {/* Edit/Add Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-brand-yellow font-pixel">
                            {editingPerson
                                ? locale === "es" ? "Editar" : "Edit"
                                : locale === "es" ? "Agregar" : "Add"
                            } {personType === "judges" ? (locale === "es" ? "Jurado" : "Judge") : (locale === "es" ? "Mentor" : "Mentor")}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="text-xs font-pixel text-brand-yellow mb-2 block">{locale === "es" ? "Nombre" : "Name"}</label>
                            <Input
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-brand-navy/50 border-brand-cyan/30"
                            />
                        </div>

                        {/* Position & Company */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">{locale === "es" ? "Posición" : "Position"}</label>
                                <Input
                                    value={formData.position || ""}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="bg-brand-navy/50 border-brand-cyan/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">{locale === "es" ? "Compañía" : "Company"}</label>
                                <Input
                                    value={formData.company || ""}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="bg-brand-navy/50 border-brand-cyan/30"
                                />
                            </div>
                        </div>

                        {/* Categories (mentors only) */}
                        {personType === "mentors" && (
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">{locale === "es" ? "Categorías" : "Categories"}</label>
                                <div className="space-y-2 p-3 bg-brand-navy/30 border border-brand-cyan/20 rounded">
                                    {["tech", "entrepreneurship", "oratory"].map((cat) => (
                                        <label key={cat} className="flex items-center gap-2 cursor-pointer text-xs text-brand-cyan hover:text-brand-yellow transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.categories?.includes(cat as any) || false}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            categories: [...(formData.categories || []), cat as any],
                                                        })
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            categories: (formData.categories || []).filter((c) => c !== cat),
                                                        })
                                                    }
                                                }}
                                                className="w-4 h-4 accent-brand-yellow"
                                            />
                                            <span>
                                                {cat === "tech" && "Tech"}
                                                {cat === "entrepreneurship" && (locale === "es" ? "Emprendimiento" : "Entrepreneurship")}
                                                {cat === "oratory" && (locale === "es" ? "Oratoria" : "Oratory")}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bio EN & ES */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">Bio (English)</label>
                                <Textarea
                                    value={formData.englishBio || ""}
                                    onChange={(e) => setFormData({ ...formData, englishBio: e.target.value })}
                                    className="bg-brand-navy/50 border-brand-cyan/30 min-h-24"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">Bio (Español)</label>
                                <Textarea
                                    value={formData.spanishBio || ""}
                                    onChange={(e) => setFormData({ ...formData, spanishBio: e.target.value })}
                                    className="bg-brand-navy/50 border-brand-cyan/30 min-h-24"
                                />
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">LinkedIn</label>
                                <Input
                                    value={formData.linkedin || ""}
                                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/..."
                                    className="bg-brand-navy/50 border-brand-cyan/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">GitHub</label>
                                <Input
                                    value={formData.github || ""}
                                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                    placeholder="https://github.com/..."
                                    className="bg-brand-navy/50 border-brand-cyan/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">Instagram</label>
                                <Input
                                    value={formData.instagram || ""}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                    className="bg-brand-navy/50 border-brand-cyan/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-pixel text-brand-yellow mb-2 block">Twitter/X</label>
                                <Input
                                    value={formData.twitter || ""}
                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                    placeholder="https://twitter.com/..."
                                    className="bg-brand-navy/50 border-brand-cyan/30"
                                />
                            </div>
                        </div>

                        {/* Photo */}
                        <div>
                            <label className="text-xs font-pixel text-brand-yellow mb-2 block">{locale === "es" ? "Foto" : "Photo"}</label>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="text-xs text-brand-cyan/60"
                                    />
                                </div>
                                {photoPreview && (
                                    <img src={photoPreview} alt="preview" className="w-16 h-16 rounded object-cover border border-brand-cyan/30" />
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                onClick={() => setShowDialog(false)}
                                className="px-4 py-2 bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded font-pixel text-xs hover:bg-brand-navy/70"
                            >
                                {locale === "es" ? "Cancelar" : "Cancel"}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 rounded font-pixel text-xs hover:bg-brand-yellow/30 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save size={14} />}
                                {locale === "es" ? "Guardar" : "Save"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-brand-yellow font-pixel">{locale === "es" ? "Confirmar eliminación" : "Confirm deletion"}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">
                                {locale === "es"
                                    ? `¿Está seguro de que desea eliminar este ${personType === "judges" ? "jurado" : "mentor"}?`
                                    : `Are you sure you want to delete this ${personType === "judges" ? "judge" : "mentor"}?`
                                }
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded font-pixel text-xs hover:bg-brand-navy/70"
                            >
                                {locale === "es" ? "Cancelar" : "Cancel"}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-700/20 text-red-400 border border-red-500/30 rounded font-pixel text-xs hover:bg-red-700/30"
                            >
                                {locale === "es" ? "Eliminar" : "Delete"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-brand-yellow font-pixel">
                            {locale === "es" ? "Agregar Email" : "Add Email"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-pixel text-brand-yellow mb-2 block">Email</label>
                            <Input
                                value={emailValue}
                                onChange={(e) => setEmailValue(e.target.value)}
                                placeholder="example@email.com"
                                className="bg-brand-navy/50 border-brand-cyan/30"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                onClick={() => setShowEmailDialog(false)}
                                className="px-4 py-2 bg-brand-navy/50 border border-brand-cyan/30 text-brand-cyan rounded font-pixel text-xs hover:bg-brand-navy/70"
                            >
                                {locale === "es" ? "Cancelar" : "Cancel"}
                            </button>
                            <button
                                onClick={handleSaveEmail}
                                disabled={emailSaving}
                                className="px-4 py-2 bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 rounded font-pixel text-xs hover:bg-brand-yellow/30 disabled:opacity-50 flex items-center gap-2"
                            >
                                {emailSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save size={14} />}
                                {locale === "es" ? "Guardar" : "Save"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
