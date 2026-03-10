"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { getDbClient } from "@/lib/firebase/client-config"
import * as LucideIcons from "lucide-react"
import { Zap, ChevronRight, RotateCcw, Trophy, Medal, Star, ArrowRight } from "lucide-react"
import { NeonGlow } from "@/components/effects/neon-glow"
import { CodeBackground } from "@/components/effects/code-background"
import { cn } from "@/lib/utils"
// @ts-ignore
import Confetti from "confetti-react"
import { PixelButton } from "../ui/pixel-button"
import Link from "next/link"
import { getTranslations } from "@/lib/i18n/get-translations"
import type { Locale } from "@/lib/i18n/config"

// ─── Design Tokens ────────────────────────────────────────────────────────────

const COLORS = {
    yellow: "#FAD399",
    orange: "#EF802F",
    cyan: "#6EB6F9",
    black: "#02040a",
    navy: "#050a18",
}

type Place = 1 | 2 | 3
type Stage = 0 | 1 | 2 | 3 | 4 | 5

// ─── Geometry & Scattering ────────────────────────────────────────────────────

const BOARD_W = 6000
const BOARD_H = 4000
const CHIP_W = 1100
const CHIP_H = 750

const POSITIONS: Record<Place, { x: number, y: number }> = {
    3: { x: 1200, y: 2800 },
    2: { x: 4800, y: 1200 },
    1: { x: 2800, y: 1000 },
}

const POWER_X = 3000
const POWER_Y = 3800

const D_PATH: Record<Place, string> = {
    3: `M ${POWER_X} ${POWER_Y} L 2400 3800 L 1200 2600 L 1200 2300`,
    2: `M ${POWER_X} ${POWER_Y} L 4000 3800 L 4800 3000 L 4800 1800`,
    1: `M ${POWER_X} ${POWER_Y} L 3000 2000 L 2800 1800 L 2800 1500`,
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ScrambleText({ text, active, delay = 0 }: { text: string, active: boolean, delay?: number }) {
    const [display, setDisplay] = useState(() => text.replace(/[^ ]/g, "▓"))
    const ivRef = useRef<any>(null)

    useEffect(() => {
        if (!active) { setDisplay(text.replace(/[^ ]/g, "▓")); return }
        const to = setTimeout(() => {
            let cursor = 0
            ivRef.current = setInterval(() => {
                setDisplay(text.split("").map((ch, i) => {
                    if (ch === " ") return " "
                    if (i < cursor) return ch
                    return "▓▒░█■□◆0123456789ABCDEFabcdef#@$%&"[Math.floor(Math.random() * 32)]
                }).join(""))
                cursor += 0.4
                if (cursor > text.length) clearInterval(ivRef.current)
            }, 30)
        }, delay)
        return () => { clearTimeout(to); clearInterval(ivRef.current) }
    }, [active, text, delay])

    return <span>{display}</span>
}

function CircuitPath({ path, color, active, delay = 0, bus = false }: { path: string, color: string, active: boolean, delay?: number, bus?: boolean }) {
    const [len, setLen] = useState(0)
    const ref = useRef<SVGPathElement>(null)
    useEffect(() => { if (ref.current) setLen(ref.current.getTotalLength()) }, [path])

    return (
        <g>
            {/* Multi-line bus effect */}
            {bus ? (
                <>
                    <path
                        d={path} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={len} strokeDashoffset={active ? 0 : len}
                        transform="translate(-15, -15)"
                        style={{
                            transition: active ? `stroke-dashoffset 1600ms cubic-bezier(.4, 0, .2, 1) ${delay}ms` : "none",
                            filter: active ? `drop-shadow(0 0 8px ${color})` : "none",
                            opacity: active ? 0.6 : 0.05
                        }}
                    />
                    <path
                        d={path} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={len} strokeDashoffset={active ? 0 : len}
                        transform="translate(15, 15)"
                        style={{
                            transition: active ? `stroke-dashoffset 1600ms cubic-bezier(.4, 0, .2, 1) ${delay}ms` : "none",
                            filter: active ? `drop-shadow(0 0 8px ${color})` : "none",
                            opacity: active ? 0.6 : 0.05
                        }}
                    />
                </>
            ) : null}
            <path
                ref={ref} d={path} fill="none" stroke={color} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={len} strokeDashoffset={active ? 0 : len}
                style={{
                    transition: active ? `stroke-dashoffset 1600ms cubic-bezier(.4, 0, .2, 1) ${delay}ms` : "none",
                    filter: active ? `drop-shadow(0 0 15px ${color})` : "none",
                    opacity: active ? 1 : 0.1
                }}
            />
            {/* Travel packets */}
            {active && (
                <circle r="8" fill="white">
                    <animateMotion
                        path={path}
                        dur="1.5s"
                        repeatCount="indefinite"
                        begin={`${delay}ms`}
                    />
                    <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
                </circle>
            )}
        </g>
    )
}

function AmbientWires({ width, height }: { width: number, height: number }) {
    const [mounted, setMounted] = useState(false)
    const wires = useRef<any[]>([])

    useEffect(() => {
        if (wires.current.length === 0) {
            for (let i = 0; i < 60; i++) {
                const x1 = Math.random() * width
                const y1 = Math.random() * height
                const len = 400 + Math.random() * 1200
                const x2 = x1 + (Math.random() > 0.5 ? len : -len)
                const y2 = (Math.random() > 0.5 ? y1 + len : y1 - len)
                const path = `M ${x1} ${y1} L ${x1 + (x2 - x1) / 2} ${y1} L ${x2} ${y2}`
                const color = Math.random() > 0.7 ? COLORS.cyan : COLORS.navy
                wires.current.push({ path, delay: Math.random() * 8000, dur: 3000 + Math.random() * 5000, color })
            }
        }
        setMounted(true)
    }, [width, height])

    if (!mounted) return null

    return (
        <svg width={width} height={height} className="absolute inset-0 overflow-visible opacity-[0.06]">
            {wires.current.map((w, i) => (
                <path
                    key={i}
                    d={w.path}
                    fill="none"
                    stroke={w.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        animation: `ambientGlow ${w.dur}ms ease-in-out ${w.delay}ms infinite`
                    }}
                />
            ))}
        </svg>
    )
}

function WinnerCard({ winner, category, revealed, scale = 1, glow = true, t }: any) {
    const PLACEMENTS = {
        1: { label: t.winnersReveal.firstPlace, color: COLORS.yellow, rgb: "250,211,153", icon: LucideIcons.Trophy },
        2: { label: t.winnersReveal.secondPlace, color: COLORS.orange, rgb: "239,128,47", icon: LucideIcons.Medal },
        3: { label: t.winnersReveal.thirdPlace, color: COLORS.cyan, rgb: "110,182,249", icon: LucideIcons.Star },
    } as const
    const pk = PLACEMENTS[winner.place as Place]
    const CatIcon = category ? (LucideIcons as any)[category.iconName] || LucideIcons.Code : LucideIcons.Code
    const RankIcon = pk.icon

    return (
        <div style={{
            width: CHIP_W, height: CHIP_H, transform: `scale(${scale})`,
            transition: "all 1s cubic-bezier(.4, 0, .2, 1)", opacity: revealed ? 1 : 0.03,
            position: "relative", pointerEvents: "none"
        }}>
            {/* PCB Body */}
            <div style={{
                position: "absolute", inset: 0, background: revealed ? "#060b18" : "transparent",
                border: `4px solid ${revealed ? pk.color : "rgba(255,255,255,0.05)"}`,
                boxShadow: (revealed && glow) ? `0 0 60px rgba(${pk.rgb}, 0.25), inset 0 0 30px rgba(${pk.rgb}, 0.1)` : "none",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", borderRadius: "12px", overflow: "hidden"
            }}>
                {revealed && <div style={{ position: "absolute", inset: 0, background: pk.color, animation: "flash 0.8s ease-out forwards" }} />}

                <div className="flex flex-col items-center gap-4 z-10">
                    <NeonGlow color={winner.place === 1 ? "yellow" : winner.place === 2 ? "orange" : "cyan"} flickering>
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                            <RankIcon size={64} color={pk.color} />
                        </div>
                    </NeonGlow>
                    <NeonGlow color={winner.place === 1 ? "yellow" : winner.place === 2 ? "orange" : "cyan"} flickering>
                        <span className="font-pixel text-4xl tracking-widest uppercase" style={{ color: pk.color }}>{pk.label}</span>
                    </NeonGlow>
                </div>

                <div className="w-full px-12 mt-8 z-10 flex flex-col items-center gap-6">
                    <NeonGlow color={winner.place === 1 ? "yellow" : winner.place === 2 ? "orange" : "cyan"} flickering>
                        <h2 className="font-pixel text-7xl leading-tight" style={{ color: pk.color, textShadow: `0 0 30px ${pk.color}66` }}>
                            <ScrambleText text={(winner.teamName || "").toUpperCase()} active={revealed} delay={200} />
                        </h2>
                    </NeonGlow>

                    <p className="font-montserrat text-3xl font-bold text-white/80 line-clamp-2 min-h-[4rem]">
                        <ScrambleText text={winner.projectName || ""} active={revealed} delay={600} />
                    </p>

                    <NeonGlow color={winner.place === 1 ? "yellow" : winner.place === 2 ? "orange" : "cyan"} flickering>
                        <div className="flex items-center gap-4 px-8 py-4 border-2 rounded-xl mt-4" style={{ borderColor: pk.color + "33", background: pk.color + "11" }}>
                            <CatIcon size={36} color={pk.color} />
                            <span className="font-pixel text-xl" style={{ color: revealed ? pk.color : "#333" }}>
                                <ScrambleText text={(category?.name || t.winnersReveal.category).toUpperCase()} active={revealed} delay={900} />
                            </span>
                        </div>
                    </NeonGlow>
                </div>
            </div>

            {/* Pins */}
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="absolute w-12 h-6" style={{ left: -48, top: 150 + i * 120, background: revealed ? pk.color : "#222", borderRadius: "4px 0 0 4px", boxShadow: revealed ? `0 0 10px ${pk.color}` : "none" }} />
            ))}
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="absolute w-12 h-6" style={{ right: -48, top: 150 + i * 120, background: revealed ? pk.color : "#222", borderRadius: "0 4px 4px 0", boxShadow: revealed ? `0 0 10px ${pk.color}` : "none" }} />
            ))}
        </div>
    )
}

function PodiumCard({ winner, category, isChampion = false, t }: any) {
    if (!winner) return null
    const PLACEMENTS = {
        1: { label: t.winnersReveal.firstPlace, color: COLORS.yellow, rgb: "250,211,153", icon: LucideIcons.Trophy },
        2: { label: t.winnersReveal.secondPlace, color: COLORS.orange, rgb: "239,128,47", icon: LucideIcons.Medal },
        3: { label: t.winnersReveal.thirdPlace, color: COLORS.cyan, rgb: "110,182,249", icon: LucideIcons.Star },
    } as const
    const pk = PLACEMENTS[winner.place as Place]
    const CatIcon = category ? (LucideIcons as any)[category.iconName] || LucideIcons.Code : LucideIcons.Code

    return (
        <div className={cn(
            "relative w-full rounded-xl border flex flex-col items-center py-4 px-3 md:py-6 md:px-5 text-center transition-all duration-500",
            isChampion
                ? "bg-brand-yellow/15 border-brand-yellow/40 shadow-[0_0_20px_rgba(250,211,153,0.15)] ring-1 ring-brand-yellow/20"
                : "bg-white/5 border-white/10 backdrop-blur-md"
        )}>

            <div className="relative z-10 flex flex-col items-center w-full">

                <h3 className={cn(
                    "font-pixel tracking-widest leading-tight mb-1",
                    isChampion ? "text-lg md:text-xl text-brand-yellow" : "text-sm md:text-base text-white"
                )}>
                    {(winner.teamName || "").toUpperCase()}
                </h3>

                <p className="font-montserrat font-bold text-white/90 text-[10px] md:text-xs line-clamp-2 mb-3 h-8 flex items-center justify-center italic">
                    {winner.projectName}
                </p>

                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded border",
                    isChampion ? "bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow" : "bg-white/10 border-white/20 text-white/50"
                )}>
                    <CatIcon size={10} />
                    <span className="font-pixel text-[8px] uppercase tracking-tighter leading-none">
                        {category?.name || t.winnersReveal.unspecified}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Main Logic ───────────────────────────────────────────────────────────────

export function WinnersReveal() {
    const params = useParams()
    const locale = params.locale as Locale
    const t = getTranslations(locale)

    const PLACEMENTS = {
        1: { label: t.winnersReveal.firstPlace, color: COLORS.yellow, rgb: "250,211,153", icon: LucideIcons.Trophy },
        2: { label: t.winnersReveal.secondPlace, color: COLORS.orange, rgb: "239,128,47", icon: LucideIcons.Medal },
        3: { label: t.winnersReveal.thirdPlace, color: COLORS.cyan, rgb: "110,182,249", icon: LucideIcons.Star },
    } as const

    const [stage, setStage] = useState<Stage>(0)
    const [isTravelling, setIsTravelling] = useState(false)
    const [locked, setLocked] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [revealed, setRevealed] = useState<Record<Place, boolean>>({ 1: false, 2: false, 3: false })
    const [winners, setWinners] = useState<any[]>([])
    const [cats, setCats] = useState<any[]>([])
    const [viewport, setViewport] = useState({ w: 0, h: 0 })
    const [showConfetti, setShowConfetti] = useState(false)
    const timeouts = useRef<any[]>([])

    useEffect(() => {
        const db = getDbClient()
        if (!db) return

        setIsLoading(true)

        const fetchData = async () => {
            try {
                // Fetch Categories - handles IDs like "0", "1", "2"
                const catsSnap = await getDocs(collection(db, "categories"))
                const catsData = catsSnap.docs.map(d => {
                    const data = d.data() as any
                    return {
                        id: d.id,
                        ...data,
                        name: locale === "es" ? (data.spanishName || data.name) : (data.englishName || data.name || data.spanishName)
                    }
                })
                setCats(catsData)

                // Fetch Winners from the new collection
                const winnersSnap = await getDocs(collection(db, "winners"))
                const winnersData = winnersSnap.docs.map(d => {
                    const data = d.data() as any
                    return {
                        ...data,
                        place: Number(data.place) as Place,
                        // The user specified category is the ID "0", "1", etc.
                        category: String(data.category)
                    }
                })

                if (winnersData.length > 0) {
                    const validWinners = winnersData.filter(w => [1, 2, 3].includes(w.place))
                    setWinners(validWinners)
                }
            } catch (err) {
                console.error("Error fetching winners data:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [locale])

    useEffect(() => {
        const up = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
        up(); window.addEventListener("resize", up); return () => window.removeEventListener("resize", up)
    }, [])

    // Orchestrate Stages
    useEffect(() => {
        if (stage < 2 || stage > 4) return
        const p = (stage === 2 ? 3 : stage === 3 ? 2 : 1) as Place
        setLocked(true)

        // Timer for reveal (once travel ends)
        const t = setTimeout(() => {
            setRevealed(prev => ({ ...prev, [p]: true }))
            if (p === 1) {
                setTimeout(() => setShowConfetti(true), 600)
            }
            setTimeout(() => setLocked(false), 5000)
        }, 1600)

        timeouts.current.push(t)
        return () => { timeouts.current.forEach(clearTimeout); timeouts.current = [] }
    }, [stage])

    const next = () => {
        if (locked) return
        if (stage === 5) { setStage(0); setRevealed({ 1: false, 2: false, 3: false }); setShowConfetti(false); return }

        setIsTravelling(true)
        setTimeout(() => setIsTravelling(false), 1200) // Swoosh duration
        setStage(prev => (prev + 1) as Stage)
    }

    const computeCam = () => {
        const { w, h } = viewport
        if (!w || !h) return { x: 0, y: 0, s: 0.1 }

        if (stage === 1) { // Overview
            const s = Math.min(w * 0.9 / BOARD_W, h * 0.8 / BOARD_H)
            return { x: w / 2 - (BOARD_W / 2) * s, y: h / 2 - (BOARD_H / 2) * s, s }
        }

        if (stage === 5) { // Board in background when podium is shown
            return { x: 0, y: 0, s: 0.02 }
        }

        const p = (stage === 2 ? 3 : stage === 3 ? 2 : 1) as Place
        const target = POSITIONS[p]
        // Zoom behavior: travelling zoom out to overview-ish, settle on target
        // Reduced settle zoom from 0.75 to 0.6 and added height-awareness
        const maxS = isTravelling ? 0.12 : 0.65
        const s = Math.min(maxS, (w * 0.8) / CHIP_W, (h * 0.8) / CHIP_H)
        return { x: w / 2 - target.x * s, y: h / 2 - target.y * s, s }
    }

    const { x: tx, y: ty, s: sc } = computeCam()

    return (
        <div className="absolute inset-0 overflow-hidden">
            <style>{`
                @keyframes flash { 0% { opacity: 1; filter: brightness(5); } 100% { opacity: 0; filter: brightness(1); } }
                @keyframes scanline { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
                @keyframes podiumFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                @keyframes ambientGlow { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.8; stroke-width: 6; } }
            `}</style>

            {showConfetti && (
                <div className="absolute inset-0 z-[400] pointer-events-none">
                    <Confetti
                        width={viewport.w}
                        height={viewport.h}
                        recycle={false}
                        numberOfPieces={300}
                        colors={[COLORS.yellow, COLORS.orange, COLORS.cyan, "#ffffff"]}
                        gravity={0.15}
                        initialVelocityY={15}
                    />
                </div>
            )}

            {/* ── Background Scanline ── */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-5 overflow-hidden">
                <div className="w-full h-1 bg-white animate-scanline duration-10000 linear infinite" />
            </div>

            {/* ── World Space (Chips & Circuit) ── */}
            <div
                style={{
                    position: "absolute", width: BOARD_W, height: BOARD_H, transformOrigin: "0 0",
                    transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
                    transition: isTravelling ? "transform 1.2s cubic-bezier(.6, 0, .1, 1)" : "transform 2s cubic-bezier(.4, 0, .2, 1)",
                    opacity: (stage >= 1 && stage < 5) ? 1 : 0
                }}
            >
                {/* PCB Grid */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${COLORS.cyan}08 2px, transparent 2px), linear-gradient(90deg, ${COLORS.cyan}08 2px, transparent 2px)`, backgroundSize: "160px 160px" }} />

                <AmbientWires width={BOARD_W} height={BOARD_H} />

                {/* Wiring Layer */}
                <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0 overflow-visible">
                    {[1, 2, 3].map(p => (
                        <CircuitPath key={p} path={D_PATH[p as Place]} color={(PLACEMENTS as any)[p].color} active={revealed[p as Place]} bus={p === 1} />
                    ))}
                    {/* Extra static decorative paths */}
                    <path d="M 0 2000 L 6000 2000" stroke={COLORS.cyan} strokeWidth="2" opacity="0.05" />
                    <path d="M 3000 0 L 3000 4000" stroke={COLORS.cyan} strokeWidth="2" opacity="0.05" />
                </svg>

                {/* Power Core */}
                <div style={{ position: "absolute", left: POWER_X - 100, top: POWER_Y - 100, width: 200, height: 200 }}>
                    <div className="absolute inset-0 border-8 border-brand-cyan rounded-full animate-ping opacity-20 shadow-[0_0_30px_#6EB6F9]" />
                    <div className="absolute inset-12 bg-brand-cyan rounded-lg shadow-[0_0_80px_#6EB6F9]" />
                </div>

                {/* Scattered Winner Chips */}
                {winners.map(w => (
                    <div key={w.place} style={{
                        position: "absolute",
                        left: POSITIONS[w.place as Place].x - CHIP_W / 2,
                        top: POSITIONS[w.place as Place].y - CHIP_H / 2,
                    }}>
                        <WinnerCard
                            winner={w}
                            category={cats.find(c => c.id === w.category)}
                            revealed={revealed[w.place as Place]}
                            t={t}
                        />
                    </div>
                ))}
            </div>

            {/* ── Stage 5: GRAND PODIUM (REGULAR WEB LAYOUT) ── */}
            {stage === 5 && (
                <div className="absolute inset-0 z-[500] bg-[#020617] overflow-y-auto overflow-x-hidden flex flex-col items-center py-6 md:py-10 px-4 animate-in fade-in duration-1000">
                    <CodeBackground color={COLORS.cyan} opacity={0.05} className="z-0" />

                    {/* Background celebratory glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-1/2 bg-brand-cyan/5 blur-[120px] rounded-full pointer-events-none" />

                    {/* Header - More compact */}
                    <div className="flex flex-col items-center relative z-10 text-center mb-6 md:mb-10 animate-in slide-in-from-top-8 duration-700 w-full">
                        <Link href={`/${locale}/dashboard`}>
                            <div className="w-[50vw] max-w-[600px] mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                                <img src="/images/hackitba-alt-logo.png" alt="HackITBA" />
                            </div>
                        </Link>
                    </div>

                    {/* Podium Grid - Responsive spacing and height constraints */}
                    <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-center gap-4 flex-1 py-2">

                        {/* 2nd Place */}
                        <div className="order-2 md:order-1 flex flex-col items-center animate-in slide-in-from-bottom-24 duration-1000 delay-300 w-full max-w-[260px] md:max-w-none md:flex-1">
                            <div className="w-full mb-3 transform hover:scale-105 transition-transform duration-500">
                                <PodiumCard winner={winners.find(w => w.place === 2)} category={cats.find(c => c.id === winners.find(w => w.place === 2)?.category)} t={t} />
                            </div>
                            <div className="w-full h-20 md:h-28 bg-gradient-to-b from-brand-orange/30 to-brand-orange/5 border-t-2 border-brand-orange/50 rounded-t-xl flex flex-col items-center justify-center py-2 px-4">
                                <span className="font-pixel text-brand-orange text-xl md:text-2xl">02</span>
                                <span className="font-pixel text-brand-orange/60 text-[8px] tracking-widest uppercase">{t.winnersReveal.second}</span>
                            </div>
                        </div>

                        {/* 1st Place - Champion */}
                        <div className="order-1 md:order-2 flex flex-col items-center animate-in slide-in-from-bottom-32 duration-1200 delay-100 w-full max-w-[300px] md:max-w-none md:flex-[1.1] z-20" style={{ animation: "podiumFloat 4s ease-in-out infinite" }}>
                            <div className="w-full mb-4 transform hover:scale-105 transition-transform duration-500 shadow-[0_0_40px_rgba(250,211,153,0.1)]">
                                <PodiumCard isChampion winner={winners.find(w => w.place === 1)} category={cats.find(c => c.id === winners.find(w => w.place === 1)?.category)} t={t} />
                            </div>
                            <div className="w-full h-28 md:h-44 bg-gradient-to-b from-brand-yellow/40 to-brand-yellow/5 border-t-4 border-brand-yellow/60 rounded-t-xl flex flex-col items-center justify-center py-4 px-6 shadow-[0_-15px_30px_rgba(250,211,153,0.1)]">
                                <Trophy className="text-brand-yellow mb-1 md:mb-2 w-8 h-8 md:w-10 md:h-10" />
                                <span className="font-pixel text-brand-yellow text-3xl md:text-4xl">01</span>
                                <span className="font-pixel text-brand-yellow/80 text-[10px] tracking-widest uppercase mb-1">{t.winnersReveal.champion}</span>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="order-3 flex flex-col items-center animate-in slide-in-from-bottom-16 duration-1000 delay-500 w-full max-w-[240px] md:max-w-none md:flex-1">
                            <div className="w-full mb-2 transform hover:scale-105 transition-transform duration-500">
                                <PodiumCard winner={winners.find(w => w.place === 3)} category={cats.find(c => c.id === winners.find(w => w.place === 3)?.category)} t={t} />
                            </div>
                            <div className="w-full h-16 md:h-20 bg-gradient-to-b from-brand-cyan/30 to-brand-cyan/5 border-t-2 border-brand-cyan/50 rounded-t-xl flex flex-col items-center justify-center py-2 px-4">
                                <span className="font-pixel text-brand-cyan text-lg md:text-xl">03</span>
                                <span className="font-pixel text-brand-cyan/60 text-[8px] tracking-widest uppercase">{t.winnersReveal.third}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ── Stage 0: Initial Screen ── */}
            {stage === 0 && (
                <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#020617] animate-in fade-in duration-1000">
                    <CodeBackground color={COLORS.cyan} opacity={0.2} className="z-0" />
                    <div className="w-[60vw] max-w-[600px] mb-8 relative z-10">
                        <img src="/images/hackitba-alt-logo.png" alt="" />
                    </div>
                    <PixelButton
                        onClick={next}
                        className={cn("scale-110 relative z-10 transition-opacity", isLoading ? "opacity-50 cursor-not-allowed" : "opacity-100")}
                        disabled={isLoading}
                    >
                        {isLoading ? t.winnersReveal.loadingData : t.winnersReveal.showWinners}
                    </PixelButton>
                </div>
            )}

            {/* ── Floating Controls ── */}
            {stage >= 1 && (
                <div className="fixed bottom-12 right-12 z-[300] flex items-center gap-8">
                    <div className="hidden md:flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={cn("h-1 rounded-full transition-all duration-500", s <= stage ? "w-12 bg-brand-cyan shadow-[0_0_10px_#6EB6F9]" : "w-3 bg-white/10")} />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={next}
                        disabled={locked}
                        className={cn(
                            "h-20 w-20 rounded-full border-4 border-brand-cyan flex items-center justify-center transition-all bg-black/80 backdrop-blur-md",
                            locked ? "opacity-20 translate-y-2 grayscale" : "hover:scale-110 active:scale-90 shadow-[0_0_40px_rgba(110,182,249,0.4)]"
                        )}
                    >
                        {stage === 5 ? <RotateCcw color={COLORS.cyan} size={32} /> : <ArrowRight color={COLORS.cyan} size={48} />}
                    </button>
                </div>
            )}
        </div>
    )
}

const POS_MAP = POSITIONS
const POSATIONS = POSITIONS