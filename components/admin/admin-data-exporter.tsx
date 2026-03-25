"use client"

import { useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { Download, Loader2 } from "lucide-react"
import { getDbClient } from "@/lib/firebase/client-config"
import { GlassCard } from "@/components/ui/glass-card"
import { PixelButton } from "@/components/ui/pixel-button"

type ExportMode = "completed" | "approved"

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDoc {
    age?: string | number
    career?: string
    grad_year?: number | string
    neighborhood?: string
    category_1?: number
    category_2?: number
    category_3?: number
    createdAt?: { toDate?: () => Date } | Date | string
    dni?: string
    email?: string
    emailVerified?: boolean
    food_preference?: string
    github?: string
    hasTeam?: boolean
    link_cv?: string
    linkedin?: string
    name?: string
    onboardingStep?: number | string
    role?: string
    surname?: string
    team?: string
    teamId?: string
    university?: string
    updatedAt?: { toDate?: () => Date } | Date | string
}

interface TeamDoc {
    id?: string
    name?: string
    label?: string
    status?: string
    category_1?: number
    category_2?: number
    category_3?: number
    is_created_by_admin?: boolean
    is_finalista?: boolean
    tell_why?: string
    createdAt?: { toDate?: () => Date } | Date | string
    updatedAt?: { toDate?: () => Date } | Date | string
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR = {
    // Header row
    headerBg: "1A2E44",   // dark navy
    headerFg: "FFFFFF",

    // Alternating body rows
    rowEven: "F7FAFC",
    rowOdd: "FFFFFF",

    // Accent stripe (sheet tab / title bar)
    accentBg: "0EA5E9",   // sky-500
    accentFg: "FFFFFF",

    // Chip palettes — background / foreground pairs
    chip: {
        green: { bg: "DCFCE7", fg: "166534" },   // verified, true, finalista
        red: { bg: "FEE2E2", fg: "991B1B" },   // false, unverified
        blue: { bg: "DBEAFE", fg: "1E40AF" },   // participant, registered
        purple: { bg: "EDE9FE", fg: "5B21B6" },   // pending
        orange: { bg: "FFEDD5", fg: "9A3412" },   // waitlisted
        gray: { bg: "F3F4F6", fg: "374151" },   // unknown / default
        cyan: { bg: "CFFAFE", fg: "0E7490" },   // categories
        yellow: { bg: "FEF9C3", fg: "854D0E" },   // onboarding in progress
    },
}

const FONT_NAME = "Arial"

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
    if (!value) return ""
    let date: Date | null = null
    if (typeof value === "object" && value !== null && "toDate" in value) {
        date = (value as { toDate: () => Date }).toDate()
    } else if (value instanceof Date) {
        date = value
    } else if (typeof value === "string" || typeof value === "number") {
        date = new Date(value)
    }
    if (!date || isNaN(date.getTime())) return ""
    const p = (n: number) => String(n).padStart(2, "0")
    return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}`
}

/** snake_case / camelCase → "Title Case" */
function toLabel(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

const CATEGORY_NAMES: Record<number, string> = {
    0: "Categoría 0",
    1: "Categoría 1",
    2: "Categoría 2",
    3: "Categoría 3",
    4: "Categoría 4",
    5: "Categoría 5",
}
const catName = (i?: number | null) =>
    i !== undefined && i !== null ? (CATEGORY_NAMES[i] ?? `Cat ${i}`) : ""

// ─── ExcelJS style factories ──────────────────────────────────────────────────

type ExcelJS = typeof import("exceljs")
type Workbook = import("exceljs").Workbook
type Worksheet = import("exceljs").Worksheet
type Cell = import("exceljs").Cell
type FillPattern = import("exceljs").FillPattern

function makeFill(hex: string): FillPattern {
    return { type: "pattern", pattern: "solid", fgColor: { argb: `FF${hex}` } }
}

function styleHeaderCell(cell: Cell) {
    cell.fill = makeFill(COLOR.headerBg)
    cell.font = { name: FONT_NAME, bold: true, color: { argb: `FF${COLOR.headerFg}` }, size: 10 }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false }
    cell.border = {
        bottom: { style: "medium", color: { argb: "FF0EA5E9" } },
    }
}

function styleBodyCell(cell: Cell, rowIndex: number) {
    const bg = rowIndex % 2 === 0 ? COLOR.rowEven : COLOR.rowOdd
    cell.fill = makeFill(bg)
    cell.font = { name: FONT_NAME, size: 10 }
    cell.alignment = { vertical: "middle", wrapText: false }
}

/** Apply a "chip" fill + bold text to simulate a colored badge */
function styleChip(cell: Cell, palette: { bg: string; fg: string }) {
    cell.fill = makeFill(palette.bg)
    cell.font = { name: FONT_NAME, size: 9, bold: true, color: { argb: `FF${palette.fg}` } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
}

/** Pick chip colour based on field semantics */
function resolveChip(field: string, value: unknown): { bg: string; fg: string } | null {
    if (value === "" || value === null || value === undefined) return null

    const f = field.toLowerCase()

    // Boolean fields
    if (typeof value === "boolean" || value === "true" || value === "false") {
        const boolVal = value === true || value === "true"
        return boolVal ? COLOR.chip.green : COLOR.chip.red
    }

    // Status
    if (f === "status") {
        const v = String(value).toLowerCase()
        if (v === "registered" || v === "active") return COLOR.chip.blue
        if (v === "pending") return COLOR.chip.purple
        if (v === "waitlisted") return COLOR.chip.orange
        return COLOR.chip.gray
    }

    // Role
    if (f === "role") {
        const v = String(value).toLowerCase()
        if (v === "participant") return COLOR.chip.blue
        if (v === "admin") return COLOR.chip.purple
        return COLOR.chip.gray
    }

    // Email verified
    if (f === "emailverified") {
        return (value === true || value === "true") ? COLOR.chip.green : COLOR.chip.red
    }

    // Category fields
    if (f.startsWith("category")) return COLOR.chip.cyan

    // is_finalista
    if (f === "is finalista" || f === "isfinalista") {
        return (value === true || value === "true") ? COLOR.chip.green : COLOR.chip.gray
    }

    // Food preference — just a subtle warm chip
    if (f === "food preference") return COLOR.chip.yellow

    return null
}

/** Add a title row at the top of a sheet */
function addSheetTitle(ws: Worksheet, title: string, colCount: number) {
    const titleRow = ws.addRow([title])
    ws.mergeCells(1, 1, 1, colCount)
    const cell = titleRow.getCell(1)
    cell.fill = makeFill(COLOR.accentBg)
    cell.font = { name: FONT_NAME, bold: true, size: 13, color: { argb: `FF${COLOR.accentFg}` } }
    cell.alignment = { vertical: "middle", horizontal: "left" }
    titleRow.height = 28
    ws.addRow([]) // blank spacer
}

/** Write headers + freeze pane + auto-width hint */
function addHeaders(ws: Worksheet, headers: string[], startRow: number) {
    const headerRow = ws.getRow(startRow)
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = toLabel(h)
        styleHeaderCell(cell)
    })
    headerRow.height = 22
    ws.views = [{ state: "frozen", ySplit: startRow, xSplit: 0 }]
}

/** Set column widths based on header length with generous padding */
function setColumnWidths(ws: Worksheet, headers: string[], extra: Record<string, number> = {}) {
    headers.forEach((h, i) => {
        const label = toLabel(h)
        const w = extra[h] ?? Math.max(label.length + 6, 16)
        ws.getColumn(i + 1).width = w
    })
}

// ─── Sheet builders ───────────────────────────────────────────────────────────

function buildParticipantsSheet(
    ws: Worksheet,
    participants: (UserDoc & { id: string })[],
) {
    const FIELDS = [
        "name", "surname", "email", "role", "career", "university",
        "grad_year", "neighborhood",
        "age", "dni", "food_preference",
        "category_1", "category_2", "category_3",
        "team", "hasTeam", "onboardingStep",
        "emailVerified", "github", "linkedin", "link_cv",
        "createdAt", "updatedAt",
    ]

    addSheetTitle(ws, "Participantes", FIELDS.length)
    addHeaders(ws, FIELDS, 3)
    setColumnWidths(ws, FIELDS, {
        name: 20, surname: 20, email: 32, career: 22, university: 28,
        grad_year: 14, neighborhood: 24,
        github: 28, linkedin: 28, link_cv: 28, food_preference: 20,
    })

    participants.forEach((u, idx) => {
            const rowData: Record<string, unknown> = {
            name: u.name ?? "",
            surname: u.surname ?? "",
            email: u.email ?? "",
            role: u.role ?? "",
            career: u.career ?? "",
            university: u.university ?? "",
            grad_year: u.grad_year ?? u.career_year ?? u.careerYear ?? "",
            neighborhood: u.neighborhood ?? "",
            age: u.age ?? "",
            dni: u.dni ?? "",
            food_preference: u.food_preference ?? "",
            category_1: catName(u.category_1),
            category_2: catName(u.category_2),
            category_3: catName(u.category_3),
            team: u.team ?? "",
            hasTeam: u.hasTeam !== undefined ? String(u.hasTeam) : "",
            onboardingStep: u.onboardingStep ?? "",
            emailVerified: u.emailVerified !== undefined ? String(u.emailVerified) : "",
            github: u.github ?? "",
            linkedin: u.linkedin ?? "",
            link_cv: u.link_cv ?? "",
            createdAt: formatDate(u.createdAt),
            updatedAt: formatDate(u.updatedAt),
        }

        const row = ws.addRow(FIELDS.map((f) => rowData[f]))
        row.height = 20

        FIELDS.forEach((field, colIdx) => {
            const cell = row.getCell(colIdx + 1)
            styleBodyCell(cell, idx)
            const chip = resolveChip(toLabel(field), rowData[field])
            if (chip && rowData[field] !== "") styleChip(cell, chip)
        })
    })

    // Add Excel Table for filter/sort
    if (participants.length > 0) {
        ws.addTable({
            name: "TableParticipants",
            ref: `A3`,
            headerRow: true,
            totalsRow: false,
            style: { theme: "TableStyleMedium2", showRowStripes: true },
            columns: FIELDS.map((f) => ({ name: toLabel(f), filterButton: true })),
            rows: participants.map((u) => {
                const rowData: Record<string, unknown> = {
                    name: u.name ?? "", surname: u.surname ?? "", email: u.email ?? "",
                    role: u.role ?? "", career: u.career ?? "", university: u.university ?? "",
                    grad_year: u.grad_year ?? u.career_year ?? u.careerYear ?? "", neighborhood: u.neighborhood ?? "",
                    age: u.age ?? "", dni: u.dni ?? "", food_preference: u.food_preference ?? "",
                    category_1: catName(u.category_1), category_2: catName(u.category_2), category_3: catName(u.category_3),
                    team: u.team ?? "", hasTeam: u.hasTeam !== undefined ? String(u.hasTeam) : "",
                    onboardingStep: u.onboardingStep ?? "", emailVerified: u.emailVerified !== undefined ? String(u.emailVerified) : "",
                    github: u.github ?? "", linkedin: u.linkedin ?? "", link_cv: u.link_cv ?? "",
                    createdAt: formatDate(u.createdAt), updatedAt: formatDate(u.updatedAt),
                }
                return FIELDS.map((f) => rowData[f])
            }),
        })
    }
}

function buildTeamsSheet(
    ws: Worksheet,
    teams: (TeamDoc & { id: string })[],
    participants: (UserDoc & { id: string })[],
) {
    const FIELDS = [
        "name", "label", "status", "category_1", "category_2", "category_3",
        "is_created_by_admin", "is_finalista", "tell_why",
        "createdAt", "updatedAt", "members",
    ]

    addSheetTitle(ws, "Equipos", FIELDS.length)
    addHeaders(ws, FIELDS, 3)
    setColumnWidths(ws, FIELDS, {
        name: 22, label: 22, tell_why: 40, members: 45,
        category_1: 22, category_2: 22, category_3: 22,
    })

    teams.forEach((t, idx) => {
        const members = participants
            .filter(
                (u) =>
                    (t.name && u.team === t.name) ||
                    (t.id && u.teamId === t.id),
            )
            .map((u) => [u.name, u.surname].filter(Boolean).join(" "))
            .join(", ")

        const rowData: Record<string, unknown> = {
            name: t.name ?? "",
            label: t.label ?? "",
            status: t.status ?? "",
            category_1: catName(t.category_1),
            category_2: catName(t.category_2),
            category_3: catName(t.category_3),
            is_created_by_admin: t.is_created_by_admin !== undefined ? String(t.is_created_by_admin) : "",
            is_finalista: t.is_finalista !== undefined ? String(t.is_finalista) : "",
            tell_why: t.tell_why ?? "",
            createdAt: formatDate(t.createdAt),
            updatedAt: formatDate(t.updatedAt),
            members,
        }

        const row = ws.addRow(FIELDS.map((f) => rowData[f]))
        row.height = 20

        FIELDS.forEach((field, colIdx) => {
            const cell = row.getCell(colIdx + 1)
            styleBodyCell(cell, idx)
            const chip = resolveChip(toLabel(field), rowData[field])
            if (chip && rowData[field] !== "") styleChip(cell, chip)
        })
    })

    if (teams.length > 0) {
        ws.addTable({
            name: "TableTeams",
            ref: `A3`,
            headerRow: true,
            totalsRow: false,
            style: { theme: "TableStyleMedium2", showRowStripes: true },
            columns: FIELDS.map((f) => ({ name: toLabel(f), filterButton: true })),
            rows: teams.map((t) => {
                const members = participants
                    .filter((u) => (t.name && u.team === t.name) || (t.id && u.teamId === t.id))
                    .map((u) => [u.name, u.surname].filter(Boolean).join(" "))
                    .join(", ")
                const rowData: Record<string, unknown> = {
                    name: t.name ?? "", label: t.label ?? "", status: t.status ?? "",
                    category_1: catName(t.category_1), category_2: catName(t.category_2), category_3: catName(t.category_3),
                    is_created_by_admin: t.is_created_by_admin !== undefined ? String(t.is_created_by_admin) : "",
                    is_finalista: t.is_finalista !== undefined ? String(t.is_finalista) : "",
                    tell_why: t.tell_why ?? "", createdAt: formatDate(t.createdAt), updatedAt: formatDate(t.updatedAt), members,
                }
                return FIELDS.map((f) => rowData[f])
            }),
        })
    }
}

function buildSummarySheet(
    ws: Worksheet,
    participants: (UserDoc & { id: string })[],
    teams: (TeamDoc & { id: string })[],
) {
    // Gather all categories
    const allCatIdxs = new Set<number>()
        ;[...participants, ...teams].forEach((d) => {
            ;[d.category_1, d.category_2, d.category_3].forEach((c) => {
                if (c !== undefined && c !== null) allCatIdxs.add(c)
            })
        })
    const cats = Array.from(allCatIdxs).sort((a, b) => a - b)

    interface Tally { p1: number; p2: number; p3: number; t1: number; t2: number; t3: number }
    const tally: Record<number, Tally> = {}
    cats.forEach((c) => { tally[c] = { p1: 0, p2: 0, p3: 0, t1: 0, t2: 0, t3: 0 } })

    participants.forEach((u) => {
        if (u.category_1 !== undefined && u.category_1 !== null) tally[u.category_1].p1++
        if (u.category_2 !== undefined && u.category_2 !== null) tally[u.category_2].p2++
        if (u.category_3 !== undefined && u.category_3 !== null) tally[u.category_3].p3++
    })
    teams.forEach((t) => {
        if (t.category_1 !== undefined && t.category_1 !== null) tally[t.category_1].t1++
        if (t.category_2 !== undefined && t.category_2 !== null) tally[t.category_2].t2++
        if (t.category_3 !== undefined && t.category_3 !== null) tally[t.category_3].t3++
    })

    const FIELDS = [
        "category",
        "participants_1st", "participants_2nd", "participants_3rd",
        "teams_1st", "teams_2nd", "teams_3rd",
        "total_1st", "total_2nd", "total_3rd",
    ]

    addSheetTitle(ws, "Resumen por Categoría", FIELDS.length)

    // Section sub-headers
    const subRow = ws.addRow([
        "", "← Participantes →", "", "", "← Equipos →", "", "", "← Total →", "", "",
    ])
    subRow.height = 16
        ;[2, 5, 8].forEach((col) => {
            const cell = subRow.getCell(col)
            cell.fill = makeFill(COLOR.accentBg)
            cell.font = { name: FONT_NAME, bold: true, size: 9, color: { argb: `FF${COLOR.accentFg}` }, italic: true }
            cell.alignment = { horizontal: "center" }
            ws.mergeCells(3, col, 3, col + 2)
        })

    addHeaders(ws, FIELDS, 4)
    setColumnWidths(ws, FIELDS, { category: 26 })

    cats.forEach((c, idx) => {
        const t = tally[c]
        const row = ws.addRow([
            catName(c),
            t.p1, t.p2, t.p3,
            t.t1, t.t2, t.t3,
            t.p1 + t.t1, t.p2 + t.t2, t.p3 + t.t3,
        ])
        row.height = 20

        row.eachCell((cell: any, col: any) => {
            styleBodyCell(cell, idx)
            if (col === 1) {
                styleChip(cell, COLOR.chip.cyan)
            } else {
                // Highlight the highest total in each placement column
                cell.font = { name: FONT_NAME, size: 10 }
                cell.alignment = { horizontal: "center", vertical: "middle" }
                // Bold the total columns (8–10)
                if (col >= 8) {
                    cell.font = { name: FONT_NAME, size: 10, bold: true }
                    cell.fill = makeFill(idx % 2 === 0 ? "EFF6FF" : "DBEAFE")
                }
            }
        })
    })

    // Totals footer row
    if (cats.length > 0) {
        const dataStart = 5
        const dataEnd = 4 + cats.length
        const totalsRow = ws.addRow([
            "TOTAL",
            `=SUM(B${dataStart}:B${dataEnd})`,
            `=SUM(C${dataStart}:C${dataEnd})`,
            `=SUM(D${dataStart}:D${dataEnd})`,
            `=SUM(E${dataStart}:E${dataEnd})`,
            `=SUM(F${dataStart}:F${dataEnd})`,
            `=SUM(G${dataStart}:G${dataEnd})`,
            `=SUM(H${dataStart}:H${dataEnd})`,
            `=SUM(I${dataStart}:I${dataEnd})`,
            `=SUM(J${dataStart}:J${dataEnd})`,
        ])
        totalsRow.height = 22
        totalsRow.eachCell((cell: any) => {
            cell.fill = makeFill(COLOR.headerBg)
            cell.font = { name: FONT_NAME, bold: true, size: 10, color: { argb: `FF${COLOR.headerFg}` } }
            cell.alignment = { horizontal: "center", vertical: "middle" }
            cell.border = { top: { style: "medium", color: { argb: "FF0EA5E9" } } }
        })
    }

    ws.views = [{ state: "frozen", ySplit: 4, xSplit: 0 }]
}

function buildSponsorsSheet(
    ws: Worksheet,
    participants: (UserDoc & { id: string })[],
) {
    const FIELDS = [
        "name", "surname", "email",
        "career", "university", "grad_year", "neighborhood",
        "age", "dni",
        "github", "linkedin", "link_cv",
    ]

    addSheetTitle(ws, "Info para Sponsors", FIELDS.length)
    addHeaders(ws, FIELDS, 3)
    setColumnWidths(ws, FIELDS, {
        name: 20, surname: 20, email: 32,
        career: 22, university: 28, grad_year: 14, neighborhood: 24,
        age: 10, dni: 16,
        github: 28, linkedin: 28, link_cv: 28,
    })

    participants.forEach((u, idx) => {
        const rowData: Record<string, unknown> = {
            name: u.name ?? "",
            surname: u.surname ?? "",
            email: u.email ?? "",
            career: u.career ?? "",
            university: u.university ?? "",
            grad_year: u.grad_year ?? u.career_year ?? u.careerYear ?? "",
            neighborhood: u.neighborhood ?? "",
            age: u.age ?? "",
            dni: u.dni ?? "",
            github: u.github ?? "",
            linkedin: u.linkedin ?? "",
            link_cv: u.link_cv ?? "",
        }

        const row = ws.addRow(FIELDS.map((f) => rowData[f]))
        row.height = 20

        FIELDS.forEach((field, colIdx) => {
            const cell = row.getCell(colIdx + 1)
            styleBodyCell(cell, idx)
            const chip = resolveChip(toLabel(field), rowData[field])
            if (chip && rowData[field] !== "") styleChip(cell, chip)
        })
    })

    if (participants.length > 0) {
        ws.addTable({
            name: "TableSponsors",
            ref: `A3`,
            headerRow: true,
            totalsRow: false,
            style: { theme: "TableStyleMedium6", showRowStripes: true },
            columns: FIELDS.map((f) => ({ name: toLabel(f), filterButton: true })),
            rows: participants.map((u) => {
                const rowData: Record<string, unknown> = {
                    name: u.name ?? "", surname: u.surname ?? "", email: u.email ?? "",
                    career: u.career ?? "", university: u.university ?? "",
                    grad_year: u.grad_year ?? u.career_year ?? u.careerYear ?? "", neighborhood: u.neighborhood ?? "",
                    age: u.age ?? "", dni: u.dni ?? "",
                    github: u.github ?? "", linkedin: u.linkedin ?? "", link_cv: u.link_cv ?? "",
                }
                return FIELDS.map((f) => rowData[f])
            }),
        })
    }
}

// ─── Main export function ─────────────────────────────────────────────────────

async function generateExcel(mode: ExportMode = "completed") {
    const ExcelJS = await import("exceljs")
    const wb: Workbook = new ExcelJS.Workbook()

    wb.creator = "HackITBA Admin"
    wb.created = new Date()
    wb.modified = new Date()

    const db = getDbClient()
    if (!db) throw new Error("Firebase DB client unavailable")

    const [usersSnap, teamsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "teams")),
    ])

    const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }))
    const allTeams = teamsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as TeamDoc) }))

    const participantUsers = allUsers.filter((u) => {
        const role = String(u.role || "participant").toLowerCase()
        return role === "participant" || role === "user"
    })

    const approvedTeamIds = new Set(
        allTeams
            .filter((team) => {
                const status = String(team.status || "").toLowerCase()
                return status === "approved" || status === "accepted"
            })
            .map((team) => team.id)
    )

    const approvedParticipants = participantUsers.filter((participant) => {
        const status = String(participant.status || "").toLowerCase()
        const byUserStatus = status === "approved" || status === "accepted"
        const byTeamStatus = participant.team && approvedTeamIds.has(participant.team)
        return byUserStatus || byTeamStatus
    })

    const approvedTeams = allTeams.filter((team) => {
        const status = String(team.status || "").toLowerCase()
        return status === "approved" || status === "accepted"
    })

    const participants = mode === "approved" ? approvedParticipants : participantUsers
    const teams = mode === "approved" ? approvedTeams : allTeams
    const registeredParticipants = participants.filter((u) => Number(u.onboardingStep) >= 2)

    // Sheet tab colours use the accent
    const wsP = wb.addWorksheet("Participantes", { properties: { tabColor: { argb: `FF0EA5E9` } } })
    const wsT = wb.addWorksheet("Equipos", { properties: { tabColor: { argb: `FF6366F1` } } })
    const wsS = wb.addWorksheet("Categorías", { properties: { tabColor: { argb: `FF10B981` } } })
    const wsSp = wb.addWorksheet("Sponsors", { properties: { tabColor: { argb: `FFFBBF24` } } })

    buildParticipantsSheet(wsP, participants)
    buildTeamsSheet(wsT, teams, participants)
    buildSummarySheet(wsS, participants, teams)
    buildSponsorsSheet(wsSp, registeredParticipants)

    // Download
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `hackitba-data-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminDataExporterProps {
    statsMode?: ExportMode
}

export function AdminDataExporter({ statsMode = "completed" }: AdminDataExporterProps) {
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")

    const handleExport = async () => {
        setStatus("loading")
        setErrorMsg("")
        try {
            await generateExcel(statsMode)
            setStatus("idle")
        } catch (err) {
            console.error("[AdminDataExporter]", err)
            setErrorMsg(err instanceof Error ? err.message : "Unknown error")
            setStatus("error")
        }
    }

    return (
        <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
                <h2 className="font-pixel text-sm text-brand-cyan tracking-wider uppercase">
                    Exportar Datos
                </h2>
                <p className="text-xs text-white/50 font-montserrat">
                    Genera un Excel formateado con participantes, equipos y resumen de categorías.
                </p>
            </div>

            <PixelButton
                onClick={handleExport}
                disabled={status === "loading"}
                className="group flex items-center gap-2 w-fit hover:neon-glow-cyan transition-all"
            >
                {status === "loading" ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando...</span>
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        <span>Descargar Excel</span>
                    </>
                )}
            </PixelButton>

            {status === "error" && (
                <p className="text-xs text-red-400 font-montserrat">⚠ {errorMsg}</p>
            )}
        </GlassCard>
    )
}