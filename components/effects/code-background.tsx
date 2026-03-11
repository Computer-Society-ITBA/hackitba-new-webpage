"use client"

import { useEffect, useRef } from "react"
import { codeSnippet } from "@/lib/code-snippet"
import { cn } from "@/lib/utils"

interface CodeBackgroundProps {
  className?: string
  fontFamily?: string
  fontSize?: number
  opacity?: number
  color?: string
  /** Total ms for wavefront to sweep full width. Default: 14000 */
  cycleDuration?: number
  /** How many columns wide the active spawning window is. Default: 10 */
  spawnLeeway?: number
}

export function CodeBackground({
  className,
  fontFamily = "var(--font-pixel), monospace",
  fontSize = 24,
  opacity = 0.25,
  color = "#22d3ee",
  cycleDuration = 4000,
  spawnLeeway = 10,
}: CodeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ── resolve refs ──────────────────────────────────────────────────────────
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // TypeScript loses narrowing inside nested functions, so pin to non-null
    // typed locals that are safe for the entire lifetime of this effect.
    const cvs: HTMLCanvasElement = canvas
    const ctr: HTMLDivElement = container
    const cx: CanvasRenderingContext2D = ctx

    // ── resolve CSS variable → literal font name ──────────────────────────────
    // Both ctx.font and document.fonts.load() reject "var(--x)" strings.
    const resolvedFont = (() => {
      if (!fontFamily.includes("var(")) return fontFamily
      const probe = document.createElement("span")
      probe.style.fontFamily = fontFamily
      document.body.appendChild(probe)
      const resolved = getComputedStyle(probe).fontFamily
      document.body.removeChild(probe)
      return resolved || fontFamily
    })()

    // ── colour ────────────────────────────────────────────────────────────────
    const hexToRgb = (hex: string) => {
      const c = hex.replace("#", "")
      return [
        parseInt(c.slice(0, 2), 16),
        parseInt(c.slice(2, 4), 16),
        parseInt(c.slice(4, 6), 16),
      ] as const
    }
    const [cr, cg, cb] = hexToRgb(color)

    // ── char source ───────────────────────────────────────────────────────────
    const chars = codeSnippet
    let charIdx = 0
    const nextChar = () => {
      let ch = chars[charIdx % chars.length]
      charIdx++
      if (ch === "\n" || ch === "\r") ch = " "
      return ch
    }

    // ── cell grid ─────────────────────────────────────────────────────────────
    type Cell = { char: string; age: number; flash: number } | null
    let grid: Cell[][] = []

    // ── mutable layout state ──────────────────────────────────────────────────
    let CHAR_W = fontSize * 0.72
    let CHAR_H = fontSize * 1.6
    let W = 0
    let H = 0
    let cols = 0
    let rows = 0
    let cycleStart = 0
    let rafId = 0

    const SPAWNS_PER_FRAME = () =>
      Math.max(2, Math.round((cols * rows) / (cycleDuration / 16.7)))

    // ── measure real glyph size once font is loaded ───────────────────────────
    function measureFont() {
      const mc = document.createElement("canvas").getContext("2d")
      if (!mc) return
      mc.font = `${fontSize}px ${resolvedFont}`
      const m = mc.measureText("M")
      CHAR_W = m.width || fontSize * 0.72
      const glyphH =
        (m.actualBoundingBoxAscent ?? 0) +
        (m.actualBoundingBoxDescent ?? 0)
      CHAR_H = Math.max(
        glyphH > 2 ? glyphH * 1.6 : fontSize,
        CHAR_W * 1.3,
      )
    }

    function init() {
      measureFont()
      W = ctr.offsetWidth
      H = ctr.offsetHeight
      cvs.width = W
      cvs.height = H
      cols = Math.ceil(W / CHAR_W)
      rows = Math.ceil(H / CHAR_H)
      grid = Array.from({ length: cols }, () => Array<Cell>(rows).fill(null))
    }

    function resetCycle() {
      charIdx = 0
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++)
          grid[c][r] = null
      cycleStart = performance.now()
    }

    // ── render loop ───────────────────────────────────────────────────────────
    function draw() {
      const elapsed = performance.now() - cycleStart
      const wavefront = (elapsed / cycleDuration) * (cols + spawnLeeway)

      cx.clearRect(0, 0, W, H)
      cx.font = `${fontSize}px ${resolvedFont}`
      cx.textBaseline = "top"

      // Spawn characters near the wavefront
      const budget = SPAWNS_PER_FRAME()
      for (let s = 0; s < budget; s++) {
        const col = Math.round(
          wavefront - spawnLeeway + Math.random() * (spawnLeeway + 2),
        )
        if (col < 0 || col >= cols) continue
        const row = Math.floor(Math.random() * rows)
        if (!grid[col]?.[row]) {
          grid[col][row] = {
            char: nextChar(),
            age: 0,
            flash: 6 + Math.floor(Math.random() * 6),
          }
        }
      }

      // Render grid
      let allFilled = true
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const cell = grid[c]?.[r]
          if (!cell) { allFilled = false; continue }

          cell.age++
          if (cell.flash > 0) cell.flash--

          const x = c * CHAR_W
          const y = r * CHAR_H
          const distFromWave = wavefront - c
          const isActive = distFromWave >= 0 && distFromWave < spawnLeeway + 2
          const displayChar =
            isActive && cell.age < 4
              ? (chars[Math.floor(Math.random() * chars.length)] ?? " ")
              : cell.char

          if (cell.flash > 0) {
            const t = cell.flash / 12
            const ri = Math.round(cr + (220 - cr) * t)
            const gi = Math.round(cg + (255 - cg) * t)
            const bi = Math.round(cb + (255 - cb) * t)
            cx.fillStyle = `rgba(${ri},${gi},${bi},${0.6 + t * 0.4})`
          } else {
            const dim = 0.55 + Math.sin(c * 0.31 + r * 0.17) * 0.2
            cx.fillStyle = `rgba(${cr},${cg},${cb},${dim})`
          }

          cx.fillText(displayChar, x, y)
        }
      }

      // Occasional flicker on a random settled cell
      if (Math.random() < 0.4) {
        const fc = Math.floor(Math.random() * cols)
        const fr = Math.floor(Math.random() * rows)
        const cell = grid[fc]?.[fr]
        if (cell && cell.flash === 0) {
          cx.fillStyle = `rgba(${cr},${cg},${cb},0.95)`
          cx.fillText(
            chars[Math.floor(Math.random() * chars.length)] ?? " ",
            fc * CHAR_W,
            fr * CHAR_H,
          )
        }
      }

      if (allFilled && elapsed > cycleDuration + 3000) resetCycle()

      rafId = requestAnimationFrame(draw)
    }

    // ── bootstrap: wait for font, then start ──────────────────────────────────
    const ro = new ResizeObserver(() => { init(); resetCycle() })

    document.fonts.load(`${fontSize}px ${resolvedFont}`).finally(() => {
      ro.observe(ctr)
      init()
      resetCycle()
      rafId = requestAnimationFrame(draw)
    })

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [fontFamily, fontSize, opacity, color, cycleDuration, spawnLeeway])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "[mask-image:linear-gradient(to_bottom,transparent,black,transparent)] absolute inset-0 pointer-events-none overflow-hidden",
        className,
      )}
      style={{ opacity }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ display: "block" }}
      />
    </div>
  )
}