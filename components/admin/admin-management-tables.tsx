"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { getDbClient, getAuthClient } from "@/lib/firebase/client-config"
import { useCategories } from "@/hooks/use-categories"
import type { Locale } from "@/lib/i18n/config"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { PixelButton } from "@/components/ui/pixel-button"
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
import { Search, ChevronUp, ChevronDown, Users, Edit2, AlertTriangle, Save, X, Trash2, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PaginationControls } from "@/components/ui/pagination-controls"

interface AdminManagementTablesProps {
    locale: Locale
    translations: any
}

type Tab = "participants" | "teams"

export function AdminManagementTables({ locale, translations }: AdminManagementTablesProps) {
    const [activeTab, setActiveTab] = useState<Tab>("participants")
    const [users, setUsers] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { categories } = useCategories(locale)
    const db = getDbClient()

    // Filters and Sorting
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [sortField, setSortField] = useState<string>("createdAt")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    // Pagination
    const [page, setPage] = useState(1)
    const pageSize = 20

    // Edit Dialog States
    const [editingItem, setEditingItem] = useState<any | null>(null)
    const [editType, setEditType] = useState<Tab | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Delete / Move actions
    const [showDelete, setShowDelete] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ item: any, type: Tab } | null>(null)
    const [moveItem, setMoveItem] = useState<any | null>(null)
    const [showMove, setShowMove] = useState(false)
    const [moveTargetTeam, setMoveTargetTeam] = useState<string | null>(null)
    // Mail action (per-row)
    const [showMail, setShowMail] = useState(false)
    const [mailTarget, setMailTarget] = useState<any | null>(null)
    const [mailSubject, setMailSubject] = useState<string>("")
    const [mailBody, setMailBody] = useState<string>("")
    const [isSendingMail, setIsSendingMail] = useState(false)

    // Team mail
    const [showTeamMail, setShowTeamMail] = useState(false)
    const [teamMailTarget, setTeamMailTarget] = useState<any | null>(null)
    const [teamMailSubject, setTeamMailSubject] = useState("")
    const [teamMailBody, setTeamMailBody] = useState("")
    const [isSendingTeamMail, setIsSendingTeamMail] = useState(false)

    // Custom mail (free recipient)
    const [showCustomMail, setShowCustomMail] = useState(false)
    const [customMailTo, setCustomMailTo] = useState("")
    const [customMailSubject, setCustomMailSubject] = useState("")
    const [customMailBody, setCustomMailBody] = useState("")
    const [isSendingCustomMail, setIsSendingCustomMail] = useState(false)

    // Team Details Modal (view only members)
    const [selectedTeam, setSelectedTeam] = useState<any | null>(null)

    const fetchData = async () => {
        if (!db) return
        setLoading(true)
        try {
            const [usersSnap, teamsSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "teams"))
            ])

            const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            const teamsData = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            setUsers(usersData)
            setTeams(teamsData)
        } catch (error) {
            console.error("Error fetching admin data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [db])

    const handleUpdate = async () => {
        if (!db || !editingItem || !editType) return
        setIsSaving(true)
        try {
            const collectionName = editType === "participants" ? "users" : "teams"
            const docRef = doc(db, collectionName, editingItem.id)

            // Remove id from payload
            const { id, ...payload } = editingItem

            await updateDoc(docRef, payload)

            // Refresh local data
            await fetchData()

            setEditingItem(null)
            setEditType(null)
            setShowConfirm(false)
        } catch (error) {
            console.error("Error updating document:", error)
            alert("Error updating document. Check console.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!db || !deleteTarget) return
        try {
            if (deleteTarget.type === "participants") {
                const auth = getAuthClient()
                const idToken = await auth?.currentUser?.getIdToken()
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
                const res = await fetch(`${apiUrl}/users/${deleteTarget.item.id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${idToken}` }
                })
                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(text)
                }
            } else {
                await deleteDoc(doc(db, "teams", deleteTarget.item.id))
            }
            await fetchData()
            setShowDelete(false)
            setDeleteTarget(null)
        } catch (error) {
            console.error("Error deleting:", error)
            alert("Error deleting. Check console.")
        }
    }

    const handleMoveConfirm = async () => {
        if (!db || !moveItem) return
        try {
            const docRef = doc(db, "users", moveItem.id)
            await updateDoc(docRef, { team: moveTargetTeam || null })
            await fetchData()
            setShowMove(false)
            setMoveItem(null)
            setMoveTargetTeam(null)
        } catch (error) {
            console.error("Error moving user to team:", error)
            alert("Error moving user. Check console.")
        }
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("asc")
        }
    }

    const getCategoryName = (categoryValue: any) => {
        if (categoryValue === null || categoryValue === undefined) return "-"
        const index = parseInt(categoryValue)
        const category = categories[index]
        if (!category) return "-"
        return locale === "es" ? (category.spanishName || category.englishName) : (category.englishName || category.spanishName)
    }

    const filteredAndSortedData = useMemo(() => {
        let data = activeTab === "participants" ? users.filter(u => u.role !== "admin") : [...teams]

        // Search
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase()
            data = data.filter(item => {
                const name = `${item.name || ""} ${item.surname || ""}`.toLowerCase()
                const email = (item.email || "").toLowerCase()
                return name.includes(lowerSearch) || email.includes(lowerSearch) || item.id.toLowerCase().includes(lowerSearch)
            })
        }

        // Category Filter
        if (categoryFilter !== "all") {
            const catIdx = parseInt(categoryFilter)
            data = data.filter(item => {
                if (activeTab === "participants") {
                    return item.category_1 === catIdx || item.category_2 === catIdx || item.category_3 === catIdx
                } else {
                    return item.category_1 === catIdx
                }
            })
        }

        // Sort
        data.sort((a, b) => {
            let valA: any = a[sortField]
            let valB: any = b[sortField]

            // Special cases
            if (sortField === "createdAt") {
                valA = a.createdAt?.seconds || 0
                valB = b.createdAt?.seconds || 0
            } else if (sortField === "name") {
                valA = `${a.name || ""} ${a.surname || ""}`.toLowerCase()
                valB = `${b.name || ""} ${b.surname || ""}`.toLowerCase()
            } else if (sortField === "members") {
                // For team sorting by members count (when data is teams)
                const membersA = users.filter(u => u.team === a.id).length
                const membersB = users.filter(u => u.team === b.id).length
                valA = membersA
                valB = membersB
            } else if (sortField === "status") {
                // Treat onboardingStep === 1 as a distinct status ('not_registered')
                const keyA = Number(a.onboardingStep) === 1 ? "not_registered" : ((a.status || "pending").toString().toLowerCase())
                const keyB = Number(b.onboardingStep) === 1 ? "not_registered" : ((b.status || "pending").toString().toLowerCase())

                const order = ["accepted", "pending", "not_registered", "rejected"]
                const idxA = order.indexOf(keyA)
                const idxB = order.indexOf(keyB)

                // If both have explicit order, use that
                if (idxA !== -1 && idxB !== -1) {
                    valA = idxA
                    valB = idxB
                } else {
                    valA = keyA
                    valB = keyB
                }
            } else if (sortField === "assignedRoom") {
                valA = (a.assignedRoom || "").toString().toLowerCase()
                valB = (b.assignedRoom || "").toString().toLowerCase()
            } else if (sortField === "team") {
                const teamA = teams.find(t => t.id === a.team)
                const teamB = teams.find(t => t.id === b.team)
                valA = (teamA?.name || a.team || "").toString().toLowerCase()
                valB = (teamB?.name || b.team || "").toString().toLowerCase()
            } else if (sortField === "age") {
                valA = Number(a.age || 0)
                valB = Number(b.age || 0)
            } else {
                // Normalize undefined/null
                if (valA === undefined || valA === null) valA = ""
                if (valB === undefined || valB === null) valB = ""
                // Try numeric compare first
                const numA = parseFloat(valA)
                const numB = parseFloat(valB)
                if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
                    valA = numA
                    valB = numB
                } else {
                    valA = valA.toString().toLowerCase()
                    valB = valB.toString().toLowerCase()
                }
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1
            if (valA > valB) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        return data
    }, [activeTab, users, teams, searchTerm, categoryFilter, sortField, sortOrder])

    const pagedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredAndSortedData.slice(start, start + pageSize)
    }, [filteredAndSortedData, page])

    const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

    const getTeamMembers = (teamId: string) => {
        return users.filter(user => user.team === teamId)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 p-1 bg-brand-navy/40 border border-brand-cyan/20 rounded-lg">
                    <button
                        onClick={() => { setActiveTab("participants"); setPage(1); }}
                        className={cn(
                            "px-4 py-2 rounded font-pixel text-xs transition-all",
                            activeTab === "participants" ? "bg-brand-orange text-brand-navy" : "text-brand-cyan hover:bg-brand-cyan/10"
                        )}
                    >
                        {locale === "es" ? "Participantes" : "Participants"}
                    </button>
                    <button
                        onClick={() => { setActiveTab("teams"); setPage(1); }}
                        className={cn(
                            "px-4 py-2 rounded font-pixel text-xs transition-all",
                            activeTab === "teams" ? "bg-brand-orange text-brand-navy" : "text-brand-cyan hover:bg-brand-cyan/10"
                        )}
                    >
                        {locale === "es" ? "Equipos" : "Teams"}
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <button
                        onClick={() => { setShowCustomMail(true); setCustomMailTo(""); setCustomMailSubject(""); setCustomMailBody(""); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-700/20 text-blue-300 border border-blue-500/30 rounded text-xs hover:bg-blue-700/30 transition-colors font-pixel"
                    >
                        <Mail size={13} />
                        {locale === "es" ? "Enviar mail" : "Send mail"}
                    </button>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan/40" />
                        <Input
                            placeholder={locale === "es" ? "Buscar..." : "Search..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-brand-navy/50 border-brand-cyan/30 text-brand-cyan h-9"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-brand-navy border border-brand-cyan/30 text-brand-cyan text-sm rounded h-9 px-3"
                    >
                        <option value="all">{locale === "es" ? "Todas las categorías" : "All Categories"}</option>
                        {categories.map((cat, idx) => (
                            <option key={cat.id} value={idx}>
                                {locale === "es" ? cat.spanishName : cat.englishName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <GlassCard className="overflow-hidden border-brand-cyan/10">
                {loading ? (
                    <div className="p-12 text-center text-brand-cyan animate-pulse font-pixel">Loading data...</div>
                ) : (
                    <ScrollArea className="overflow-x-auto">
                        <div className="min-w-full pb-6 md:pb-8">
                            <Table>
                            <TableHeader className="bg-brand-navy/60">
                                <TableRow className="border-brand-cyan/20 hover:bg-transparent">
                                    {activeTab === "participants" ? (
                                        <>
                                            <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Acciones" : "Actions"}</TableHead>
                                            <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Nombre" : "Name"} {sortField === "name" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("email")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Email" : "Email"} {sortField === "email" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("university")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Escuela/Uni" : "School/Uni"} {sortField === "university" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("career")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Carrera" : "Degree"} {sortField === "career" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("team")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Equipo" : "Team"} {sortField === "team" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("status")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Estado" : "Status"} {sortField === "status" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("age")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Edad" : "Age"} {sortField === "age" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("category_1")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Categoría" : "Category"} {sortField === "category_1" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Registro" : "Registered"} {sortField === "createdAt" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("role")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Rol" : "Role"} {sortField === "role" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="h-8 py-1 text-[10px]">{locale === "es" ? "Acciones" : "Actions"}</TableHead>
                                            
                                            <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Nombre" : "Name"} {sortField === "name" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("members")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Miembros" : "Members"} {sortField === "members" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("status")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Estado" : "Status"} {sortField === "status" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("category_1")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Categoría" : "Category"} {sortField === "category_1" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Registro" : "Registered"} {sortField === "createdAt" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            <TableHead onClick={() => handleSort("assignedRoom")} className="cursor-pointer hover:text-brand-orange h-8 py-1 text-[10px]">
                                                {locale === "es" ? "Aula" : "Room"} {sortField === "assignedRoom" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                            </TableHead>
                                            
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                    {pagedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={activeTab === "participants" ? 11 : 7} className="text-center py-8 text-brand-cyan/40">
                                            {locale === "es" ? "No se encontraron resultados" : "No results found"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pagedData.map((item) => (
                                        <TableRow key={item.id} className="border-brand-cyan/10 hover:bg-brand-cyan/5">
                                            {activeTab === "participants" ? (
                                                <>
                                                    
                                                    <TableCell className="text-[10px] py-1 flex gap-2">
                                                        <button
                                                            onClick={() => { setMailTarget(item); setShowMail(true); setMailSubject(`${locale === "es" ? "Hola" : "Hi"} ${item.name}`); setMailBody(""); }}
                                                            className="text-sm px-2 py-1 bg-blue-700/10 text-blue-300 rounded hover:bg-blue-700/20 transition-colors flex items-center gap-1"
                                                        >
                                                            <Mail size={12} />
                                                            {locale === "es" ? "Enviar" : "Send"}
                                                        </button>
                                                        <button
                                                            onClick={() => { setMoveItem(item); setShowMove(true); setMoveTargetTeam(item.team || null); }}
                                                            className="text-sm px-2 py-1 bg-brand-cyan/10 text-brand-cyan rounded hover:bg-brand-cyan/20 transition-colors"
                                                        >
                                                            {locale === "es" ? "Mover" : "Move"}
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTarget({ item, type: "participants" }); setShowDelete(true); }}
                                                            className="text-sm px-2 py-1 bg-red-700/10 text-red-400 rounded hover:bg-red-700/20 transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 size={12} />
                                                            {locale === "es" ? "Eliminar" : "Delete"}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="py-1">
                                                        <button
                                                            onClick={() => { setEditingItem({ ...item }); setEditType("participants"); }}
                                                            className="text-brand-yellow text-[10px] hover:underline flex items-center gap-1.5 group"
                                                        >
                                                            {item.name} {item.surname}
                                                            <Edit2 size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1">{item.email}</TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1 truncate max-w-[120px]">{item.university || "-"}</TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1 truncate max-w-[100px]">{item.career || "-"}</TableCell>
                                                    <TableCell className="text-brand-orange text-[10px] py-1">
                                                        {item.team ? (
                                                            <button onClick={() => {
                                                                const team = teams.find(t => t.id === item.team)
                                                                if (team) setSelectedTeam(team)
                                                            }} className="hover:underline">
                                                                {teams.find(t => t.id === item.team)?.name || item.team}
                                                            </button>
                                                        ) : "-"}
                                                    </TableCell>
                                                    <TableCell className="py-1">
                                                        {(() => {
                                                            const isOnboarding1 = Number(item.onboardingStep) === 1
                                                            const displayStatus = isOnboarding1 ? (locale === "es" ? "No inscrito" : "Not registered") : (item.status || "pending")
                                                            const statusKey = isOnboarding1 ? "not_registered" : (item.status || "pending")
                                                            const statusClass = isOnboarding1 ? "bg-gray-500/20 text-gray-300" : (
                                                                item.status === "accepted" ? "bg-green-500/20 text-green-400" :
                                                                    item.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                                                        "bg-red-500/20 text-red-400"
                                                            )

                                                            const inlineStyle: any = (() => {
                                                                const key = statusKey
                                                                switch (key) {
                                                                    case "accepted":
                                                                        return { backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }
                                                                    case "pending":
                                                                        return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
                                                                    case "not_registered":
                                                                        return { backgroundColor: 'rgba(107,114,128,0.12)', color: '#9ca3af' }
                                                                    case "rejected":
                                                                        return { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                                                                    default:
                                                                        return {}
                                                                }
                                                            })()

                                                            return (
                                                                <span data-status={statusKey} style={inlineStyle} className={cn("px-1.5 py-0 rounded text-[9px] uppercase", statusClass)}>
                                                                    {displayStatus}
                                                                </span>
                                                            )
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1">{item.age || "-"}</TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1">{getCategoryName(item.category_1)}</TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1">
                                                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-[10px] py-1 uppercase">{item.role || "user"}</TableCell>
                                                    
                                                </>
                                            ) : (
                                                <>
                                                            <TableCell className="text-[10px] py-1 flex gap-2">
                                                                <button
                                                                    onClick={() => { setDeleteTarget({ item, type: "teams" }); setShowDelete(true); }}
                                                                    className="text-sm px-2 py-1 bg-red-700/10 text-red-400 rounded hover:bg-red-700/20 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    {locale === "es" ? "Eliminar" : "Delete"}
                                                                </button>
                                                                <button
                                                                    onClick={() => { setTeamMailTarget(item); setTeamMailSubject(""); setTeamMailBody(""); setShowTeamMail(true); }}
                                                                    className="text-sm px-2 py-1 bg-blue-700/10 text-blue-400 rounded hover:bg-blue-700/20 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Mail size={12} />
                                                                    {locale === "es" ? "Mail equipo" : "Team mail"}
                                                                </button>
                                                            </TableCell>
                                                            <TableCell className="py-1 text-xs">
                                                                <button
                                                                    onClick={() => { setEditingItem({ ...item }); setEditType("teams"); }}
                                                                    className="text-brand-yellow hover:underline flex items-center gap-1.5 group"
                                                                >
                                                                    {item.name}
                                                                    <Edit2 size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                                                </button>
                                                            </TableCell>
                                                    <TableCell>
                                                        <button
                                                            onClick={() => setSelectedTeam(item)}
                                                            className="flex items-center gap-2 px-2 py-1 rounded bg-brand-cyan/10 text-brand-cyan text-xs hover:bg-brand-cyan/20 transition-colors"
                                                        >
                                                            <Users size={14} />
                                                            {getTeamMembers(item.id).length}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span data-status={item.status || "pending"} className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] uppercase",
                                                            item.status === "approved" ? "bg-green-500/20 text-green-400" :
                                                                item.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                                                    "bg-yellow-500/20 text-yellow-400"
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-brand-cyan/80 text-xs">{getCategoryName(item.category_1)}</TableCell>
                                                    <TableCell className="text-brand-cyan/60 text-[10px]">
                                                        {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : "-"}
                                                    </TableCell>
                                                    
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                )}

                <div className="px-4 pb-4">
                    <PaginationControls
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={filteredAndSortedData.length}
                        pageSize={pageSize}
                        locale={locale}
                    />
                </div>
            </GlassCard>

            {/* Custom Mail Dialog (free recipient) */}
            <Dialog open={showCustomMail} onOpenChange={(open) => { setShowCustomMail(open); }}>
                <DialogContent className="bg-brand-navy/95 border border-brand-cyan/30 max-w-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-yellow flex items-center gap-2">
                            <Mail size={18} />
                            {locale === "es" ? "Enviar mail" : "Send mail"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Destinatario (email)" : "Recipient (email)"}</label>
                            <input
                                type="email"
                                value={customMailTo}
                                onChange={(e) => setCustomMailTo(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded h-9 text-xs px-2 text-brand-cyan mt-2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Asunto" : "Subject"}</label>
                            <input
                                value={customMailSubject}
                                onChange={(e) => setCustomMailSubject(e.target.value)}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded h-9 text-xs px-2 text-brand-cyan mt-2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Mensaje" : "Message"}</label>
                            <p className="text-[9px] text-brand-cyan/40 mt-1 mb-1">{locale === "es" ? "Se enviará usando el template de notificación HackITBA" : "Will be sent using the HackITBA notification template"}</p>
                            <textarea
                                value={customMailBody}
                                onChange={(e) => setCustomMailBody(e.target.value)}
                                rows={6}
                                placeholder={locale === "es" ? "Escribí el mensaje aquí..." : "Write your message here..."}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded text-xs px-2 py-2 text-brand-cyan mt-1"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <PixelButton variant="secondary" onClick={() => setShowCustomMail(false)} size="sm">
                            {locale === "es" ? "Cancelar" : "Cancel"}
                        </PixelButton>
                        <PixelButton onClick={async () => {
                            if (!customMailTo || !customMailSubject) return
                            setIsSendingCustomMail(true)
                            try {
                                const auth = getAuthClient()
                                const idToken = await auth?.currentUser?.getIdToken()
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
                                const res = await fetch(`${apiUrl}/users/send-email`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                                    body: JSON.stringify({ email: customMailTo, subject: customMailSubject, body: customMailBody, dashboardUrl: `${window.location.origin}/${locale}/dashboard` })
                                })
                                const contentType = res.headers.get("content-type") || ""
                                if (res.ok) {
                                    toast({ title: locale === "es" ? "Email encolado" : "Email queued" })
                                    setShowCustomMail(false)
                                } else {
                                    let message = "Error"
                                    try {
                                        if (contentType.includes("application/json")) {
                                            const err = await res.json()
                                            message = err?.error || err?.message || JSON.stringify(err)
                                        } else {
                                            message = await res.text()
                                        }
                                    } catch (e) { message = res.statusText }
                                    toast({ title: "Error", description: message, variant: "destructive" })
                                }
                            } catch (error) {
                                toast({ title: "Error", description: "Network error", variant: "destructive" })
                            } finally {
                                setIsSendingCustomMail(false)
                            }
                        }} size="sm" disabled={isSendingCustomMail || !customMailTo || !customMailSubject}>
                            {isSendingCustomMail ? (locale === "es" ? "Enviando..." : "Sending...") : (locale === "es" ? "Enviar" : "Send")}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Item Dialog */}
            <Dialog open={!!editingItem && !showConfirm} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="glass-effect border-brand-cyan/30 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-yellow flex items-center gap-2">
                            <Edit2 size={18} />
                            {editType === "participants" ? (locale === "es" ? "Editar Participante" : "Edit Participant") : (locale === "es" ? "Editar Equipo" : "Edit Team")}
                        </DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {editType === "participants" ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Nombre" : "Name"}</label>
                                        <Input
                                            value={editingItem.name || ""}
                                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Apellido" : "Surname"}</label>
                                        <Input
                                            value={editingItem.surname || ""}
                                            onChange={e => setEditingItem({ ...editingItem, surname: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">Email</label>
                                        <Input
                                            value={editingItem.email || ""}
                                            onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Universidad" : "University"}</label>
                                        <Input
                                            value={editingItem.university || ""}
                                            onChange={e => setEditingItem({ ...editingItem, university: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Carrera" : "Degree"}</label>
                                        <Input
                                            value={editingItem.career || ""}
                                            onChange={e => setEditingItem({ ...editingItem, career: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Edad" : "Age"}</label>
                                        <Input
                                            type="number"
                                            value={editingItem.age || ""}
                                            onChange={e => setEditingItem({ ...editingItem, age: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Rol" : "Role"}</label>
                                        <select
                                            value={editingItem.role || "user"}
                                            onChange={e => setEditingItem({ ...editingItem, role: e.target.value })}
                                            className="w-full bg-black/40 border border-brand-cyan/20 rounded h-8 text-xs px-2 text-brand-cyan"
                                        >
                                            <option value="user">User</option>
                                            <option value="jury">Jury</option>
                                            <option value="mentor">Mentor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Estado" : "Status"}</label>
                                        <select
                                            value={editingItem.status || "pending"}
                                            onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
                                            className="w-full bg-black/40 border border-brand-cyan/20 rounded h-8 text-xs px-2 text-brand-cyan"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Nombre del Equipo" : "Team Name"}</label>
                                        <Input
                                            value={editingItem.name || ""}
                                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Categoría" : "Category"}</label>
                                        <select
                                            value={editingItem.category_1 || "0"}
                                            onChange={e => setEditingItem({ ...editingItem, category_1: parseInt(e.target.value) })}
                                            className="w-full bg-black/40 border border-brand-cyan/20 rounded h-8 text-xs px-2 text-brand-cyan"
                                        >
                                            {categories.map((cat, idx) => (
                                                <option key={cat.id} value={idx}>
                                                    {locale === "es" ? cat.spanishName : cat.englishName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Estado" : "Status"}</label>
                                        <select
                                            value={editingItem.status || "pending"}
                                            onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
                                            className="w-full bg-black/40 border border-brand-cyan/20 rounded h-8 text-xs px-2 text-brand-cyan"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Aula Asignada" : "Assigned Room"}</label>
                                        <Input
                                            value={editingItem.assignedRoom || ""}
                                            onChange={e => setEditingItem({ ...editingItem, assignedRoom: e.target.value })}
                                            className="bg-black/40 border-brand-cyan/20 h-8 text-xs"
                                            placeholder={locale === "es" ? "Ej: Aula 101" : "e.g. Room 101"}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between mt-8 pt-4 border-t border-brand-cyan/10">
                        <PixelButton variant="secondary" onClick={() => setEditingItem(null)} size="sm">
                            <X size={14} className="mr-2" />
                            {locale === "es" ? "Cancelar" : "Cancel"}
                        </PixelButton>
                        <PixelButton onClick={() => setShowConfirm(true)} size="sm">
                            <Save size={14} className="mr-2" />
                            {locale === "es" ? "Guardar Cambios" : "Save Changes"}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog (for delete action) */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="glass-effect border-brand-orange/30 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-orange flex items-center gap-2">
                            <AlertTriangle size={18} />
                            {locale === "es" ? "Confirmar Eliminación" : "Confirm Deletion"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-brand-cyan/80">
                            {locale === "es"
                                ? "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."
                                : "Are you sure you want to delete this item? This action cannot be undone."}
                        </p>
                        <p className="mt-2 text-xs text-brand-cyan/60">{deleteTarget?.item?.id}</p>
                    </div>
                    <div className="flex justify-between">
                        <PixelButton variant="secondary" onClick={() => setShowDelete(false)} size="sm">
                            {locale === "es" ? "No, volver" : "No, go back"}
                        </PixelButton>
                        <PixelButton onClick={handleDeleteConfirm} size="sm">
                            {locale === "es" ? "Sí, eliminar" : "Yes, delete"}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move User Dialog */}
            <Dialog open={showMove} onOpenChange={(open) => { setShowMove(open); if (!open) setMoveItem(null); }}>
                <DialogContent className="bg-brand-navy/95 border border-brand-cyan/30 max-w-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-yellow flex items-center gap-2">
                            <Users size={18} />
                            {locale === "es" ? "Mover Participante" : "Move Participant"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <p className="text-sm text-brand-cyan/80">{moveItem ? `${moveItem.name} ${moveItem.surname}` : ""}</p>
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Seleccionar Equipo" : "Select Team"}</label>
                            <select
                                value={moveTargetTeam || ""}
                                onChange={(e) => setMoveTargetTeam(e.target.value || null)}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded h-9 text-xs px-2 text-brand-cyan mt-2"
                            >
                                <option value="">{locale === "es" ? "Sin equipo" : "No team"}</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <PixelButton variant="secondary" onClick={() => { setShowMove(false); setMoveItem(null); }} size="sm">
                            {locale === "es" ? "Cancelar" : "Cancel"}
                        </PixelButton>
                        <PixelButton onClick={handleMoveConfirm} size="sm">
                            {locale === "es" ? "Mover" : "Move"}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Send Mail Dialog */}
            {/* Team Mail Dialog */}
            <Dialog open={showTeamMail} onOpenChange={(open) => { setShowTeamMail(open); if (!open) setTeamMailTarget(null); }}>
                <DialogContent className="bg-brand-navy/95 border border-brand-cyan/30 max-w-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-yellow flex items-center gap-2">
                            <Mail size={18} />
                            {locale === "es" ? "Mail al equipo" : "Mail to team"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        {teamMailTarget && (() => {
                            const members = getTeamMembers(teamMailTarget.id)
                            return (
                                <p className="text-sm text-brand-cyan/80">
                                    <span className="text-brand-yellow font-semibold">{teamMailTarget.name}</span>
                                    {" — "}{members.length} {locale === "es" ? "integrante(s)" : "member(s)"}
                                    {members.length > 0 && <span className="block text-[10px] text-brand-cyan/50 mt-1">{members.map((m: any) => m.email).join(", ")}</span>}
                                </p>
                            )
                        })()}
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Asunto" : "Subject"}</label>
                            <input
                                value={teamMailSubject}
                                onChange={(e) => setTeamMailSubject(e.target.value)}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded h-9 text-xs px-2 text-brand-cyan mt-2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Mensaje" : "Message"}</label>
                            <p className="text-[9px] text-brand-cyan/40 mt-1 mb-1">{locale === "es" ? "Se enviará usando el template de notificación HackITBA" : "Will be sent using the HackITBA notification template"}</p>
                            <textarea
                                value={teamMailBody}
                                onChange={(e) => setTeamMailBody(e.target.value)}
                                rows={6}
                                placeholder={locale === "es" ? "Escribí el mensaje aquí..." : "Write your message here..."}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded text-xs px-2 py-2 text-brand-cyan mt-1"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <PixelButton variant="secondary" onClick={() => { setShowTeamMail(false); setTeamMailTarget(null); }} size="sm">
                            {locale === "es" ? "Cancelar" : "Cancel"}
                        </PixelButton>
                        <PixelButton onClick={async () => {
                            if (!teamMailTarget || !teamMailSubject) return
                            const members = getTeamMembers(teamMailTarget.id)
                            if (members.length === 0) {
                                toast({ title: locale === "es" ? "Sin integrantes" : "No members", variant: "destructive" })
                                return
                            }
                            setIsSendingTeamMail(true)
                            try {
                                const auth = getAuthClient()
                                const idToken = await auth?.currentUser?.getIdToken()
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
                                const dashboardUrl = `${window.location.origin}/${locale}/dashboard`
                                const results = await Promise.allSettled(
                                    members.map((member: any) =>
                                        fetch(`${apiUrl}/users/send-email`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                                            body: JSON.stringify({ email: member.email, subject: teamMailSubject, body: teamMailBody, dashboardUrl })
                                        })
                                    )
                                )
                                const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length
                                if (failed === 0) {
                                    toast({ title: locale === "es" ? `${members.length} emails encolados` : `${members.length} emails queued` })
                                } else {
                                    toast({ title: locale === "es" ? `${members.length - failed} enviados, ${failed} fallaron` : `${members.length - failed} sent, ${failed} failed`, variant: "destructive" })
                                }
                                setShowTeamMail(false)
                                setTeamMailTarget(null)
                            } catch (error) {
                                toast({ title: "Error", description: "Network error", variant: "destructive" })
                            } finally {
                                setIsSendingTeamMail(false)
                            }
                        }} size="sm" disabled={isSendingTeamMail || !teamMailSubject}>
                            {isSendingTeamMail ? (locale === "es" ? "Enviando..." : "Sending...") : (locale === "es" ? `Enviar a ${teamMailTarget ? getTeamMembers(teamMailTarget.id).length : 0}` : `Send to ${teamMailTarget ? getTeamMembers(teamMailTarget.id).length : 0}`)}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showMail} onOpenChange={(open) => { setShowMail(open); if (!open) setMailTarget(null); }}>
                <DialogContent className="bg-brand-navy/95 border border-brand-cyan/30 max-w-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-yellow flex items-center gap-2">
                            <Mail size={18} />
                            {locale === "es" ? "Enviar Email" : "Send Email"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <p className="text-sm text-brand-cyan/80">{mailTarget ? `${mailTarget.name} ${mailTarget.surname} — ${mailTarget.email}` : ""}</p>
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Asunto" : "Subject"}</label>
                            <input
                                value={mailSubject}
                                onChange={(e) => setMailSubject(e.target.value)}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded h-9 text-xs px-2 text-brand-cyan mt-2"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-brand-cyan/60 uppercase">{locale === "es" ? "Mensaje" : "Message"}</label>
                            <p className="text-[9px] text-brand-cyan/40 mt-1 mb-1">{locale === "es" ? "Se enviará usando el template de notificación HackITBA" : "Will be sent using the HackITBA notification template"}</p>
                            <textarea
                                value={mailBody}
                                onChange={(e) => setMailBody(e.target.value)}
                                rows={6}
                                placeholder={locale === "es" ? "Escribí el mensaje aquí..." : "Write your message here..."}
                                className="w-full bg-black/40 border border-brand-cyan/20 rounded text-xs px-2 py-2 text-brand-cyan mt-1"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <PixelButton variant="secondary" onClick={() => { setShowMail(false); setMailTarget(null); }} size="sm">
                            {locale === "es" ? "Cancelar" : "Cancel"}
                        </PixelButton>
                        <PixelButton onClick={async () => {
                            if (!mailTarget) return
                            setIsSendingMail(true)
                            try {
                                const auth = getAuthClient()
                                const idToken = await auth?.currentUser?.getIdToken()
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/webpage-36e40/us-central1/api"
                                const res = await fetch(`${apiUrl}/users/send-email`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                                    body: JSON.stringify({ email: mailTarget.email, subject: mailSubject, body: mailBody, dashboardUrl: `${window.location.origin}/${locale}/dashboard` })
                                })
                                if (res.ok) {
                                    toast({ title: locale === "es" ? "Email encolado" : "Email queued" })
                                    setShowMail(false)
                                    setMailTarget(null)
                                } else {
                                    const contentType = res.headers.get("content-type") || ""
                                    let message = "Error"
                                    try {
                                        if (contentType.includes("application/json")) {
                                            const err = await res.json()
                                            message = err?.error || err?.message || JSON.stringify(err)
                                        } else {
                                            const text = await res.text()
                                            message = text || res.statusText || "Error"
                                        }
                                    } catch (e) {
                                        message = res.statusText || "Error"
                                    }

                                    // If the response is an HTML error from a server that doesn't have the endpoint
                                    if (typeof message === 'string' && message.includes('Cannot POST') && message.includes('/users/send-email')) {
                                        toast({ title: "API endpoint not found", description: "Start the Functions emulator or set NEXT_PUBLIC_API_URL to your functions URL (e.g. http://localhost:5001/<project>/us-central1/api)", variant: 'destructive' })
                                    } else {
                                        toast({ title: "Error", description: message, variant: 'destructive' })
                                    }
                                }
                            } catch (error) {
                                console.error(error)
                                toast({ title: "Error", description: "Network error", variant: 'destructive' })
                            } finally {
                                setIsSendingMail(false)
                            }
                        }} size="sm" disabled={isSendingMail}>
                            {isSendingMail ? (locale === "es" ? "Enviando..." : "Sending...") : (locale === "es" ? "Enviar" : "Send")}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="glass-effect border-brand-orange/30 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-orange flex items-center gap-2">
                            <AlertTriangle size={18} />
                            {locale === "es" ? "Confirmar Cambios" : "Confirm Changes"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-brand-cyan/80">
                            {locale === "es"
                                ? "¿Estás seguro de que deseas guardar estos cambios? Esta acción modificará directamente la base de datos."
                                : "Are you sure you want to save these changes? This will directly modify the database."}
                        </p>
                    </div>
                    <div className="flex justify-between">
                        <PixelButton variant="secondary" onClick={() => setShowConfirm(false)} size="sm">
                            {locale === "es" ? "No, volver" : "No, go back"}
                        </PixelButton>
                        <PixelButton onClick={handleUpdate} size="sm" disabled={isSaving}>
                            {isSaving ? (locale === "es" ? "Guardando..." : "Saving...") : (locale === "es" ? "Sí, confirmar" : "Yes, confirm")}
                        </PixelButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Team Details Dialog */}
            <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
                <DialogContent className="glass-effect border-brand-cyan/30">
                    <DialogHeader>
                        <DialogTitle className="font-pixel text-brand-yellow">
                            {selectedTeam?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-brand-cyan/60 uppercase mb-2">{locale === "es" ? "Miembros" : "Members"}</p>
                            <div className="space-y-2">
                                {getTeamMembers(selectedTeam?.id).map((member) => (
                                    <div key={member.id} className="p-3 rounded bg-brand-navy/60 border border-brand-cyan/10">
                                        <p className="text-brand-yellow text-xs">{member.name} {member.surname}</p>
                                        <p className="text-brand-cyan/60 text-xs">{member.email}</p>
                                        {member.university && <p className="text-brand-cyan/60 text-[10px] mt-1">{member.university}</p>}
                                    </div>
                                ))}
                                {getTeamMembers(selectedTeam?.id).length === 0 && (
                                    <p className="text-brand-cyan/60 text-xs">{locale === "es" ? "No hay miembros en este equipo" : "No members in this team"}</p>
                                )}
                            </div>
                        </div>
                        {selectedTeam?.assignedRoom && (
                            <div className="p-3 rounded bg-brand-orange/10 border border-brand-orange/20">
                                <p className="text-[10px] text-brand-orange uppercase mb-1">{locale === "es" ? "Aula Asignada" : "Assigned Room"}</p>
                                <p className="text-brand-cyan font-pixel text-sm">{selectedTeam.assignedRoom}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => { setEditingItem({ ...selectedTeam }); setEditType("teams"); setSelectedTeam(null); }}
                                className="text-xs text-brand-cyan hover:text-brand-yellow flex items-center gap-1 transition-colors"
                            >
                                <Edit2 size={12} />
                                {locale === "es" ? "Editar este equipo" : "Edit this team"}
                            </button>
                            <PixelButton onClick={() => setSelectedTeam(null)} size="sm">Close</PixelButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
