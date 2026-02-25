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
  /**
   * How many columns wide the active spawning window is.
   * Characters appear at random x within wavefront ± this value. Default: 10
   */
  spawnLeeway?: number
}

export function CodeBackground({
  className,
  fontFamily = "var(--font-pixel), monospace",
  fontSize = 24,
  opacity = 0.20,
  color = "#22d3ee",
  cycleDuration = 3000,
  spawnLeeway = 10,
}: CodeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // canvas ctx.font cannot resolve CSS variables — read the computed value from DOM
    let resolvedFont = (() => {
      if (!fontFamily.includes("var(")) return fontFamily
      const probe = document.createElement("span")
      probe.style.fontFamily = fontFamily
      document.body.appendChild(probe)
      const resolved = getComputedStyle(probe).fontFamily
      document.body.removeChild(probe)
      return resolved || fontFamily
    })()

    let CHAR_W = fontSize * 0.72
    let CHAR_H = fontSize * 1.6

    function measureFont() {
      const mc = document.createElement("canvas").getContext("2d")!
      mc.font = `${fontSize}px ${resolvedFont}`
      const m = mc.measureText("M")
      CHAR_W = m.width || fontSize * 0.72
      const glyphH = (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0)
      CHAR_H = Math.max(glyphH > 2 ? glyphH * 1.6 : fontSize * 1.0, CHAR_W * 1.3)
    }

    let W = 0, H = 0, cols = 0, rows = 0

    // ── colour ────────────────────────────────────────────────────────────────
    const hexToRgb = (hex: string) => {
      const c = hex.replace("#", "")
      return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)] as const
    }
    const [cr, cg, cb] = hexToRgb(color)

    // ── char source — walks codeSnippet in order, wraps at end ───────────────
    const chars = codeSnippet          // preserve original text including whitespace
    let charIdx = 0
    const nextChar = () => {
      // Skip pure newlines so we don't place invisible characters
      let ch = chars[charIdx % chars.length]
      charIdx++
      if (ch === "\n" || ch === "\r") ch = " "
      return ch
    }

    // ── cell grid: stores what's settled at each [col][row] ──────────────────
    // Each cell: { char, age (frames since placed), flash (frames of bright) }
    type Cell = { char: string; age: number; flash: number } | null
    let grid: Cell[][] = []   // grid[col][row]

    // ── wavefront & spawn tracking ────────────────────────────────────────────
    // For each column we track whether it's "saturated" (all rows filled)
    // Spawn budget per frame scales with screen size
    const SPAWNS_PER_FRAME = () => Math.max(2, Math.round((cols * rows) / (cycleDuration / 16.7)))

    let rafId = 0
    let cycleStart = 0

    // ── resize / init ──────────────────────────────────────────────────────────
    function init() {
      measureFont()
      W = container.offsetWidth
      H = container.offsetHeight
      canvas.width = W
      canvas.height = H
      cols = Math.ceil(W / CHAR_W)
      rows = Math.ceil(H / CHAR_H)
      grid = Array.from({ length: cols }, () => Array(rows).fill(null))
    }

    function resetCycle() {
      charIdx = 0
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++)
          grid[c][r] = null
      cycleStart = performance.now()
    }

    // ── main loop ─────────────────────────────────────────────────────────────
    function draw() {
      const elapsed = performance.now() - cycleStart

      // Wavefront: 0 → cols over cycleDuration, with slight overshoot
      const wavefront = (elapsed / cycleDuration) * (cols + spawnLeeway)

      ctx.clearRect(0, 0, W, H)
      ctx.font = `${fontSize}px ${resolvedFont}`
      ctx.textBaseline = "top"

      // ── spawn new characters near wavefront ─────────────────────────────────
      const budget = SPAWNS_PER_FRAME()
      for (let s = 0; s < budget; s++) {
        // Random col within [wavefront - spawnLeeway, wavefront + 2]
        const col = Math.round(
          wavefront - spawnLeeway + Math.random() * (spawnLeeway + 2)
        )
        if (col < 0 || col >= cols) continue

        // Random row anywhere on screen
        const row = Math.floor(Math.random() * rows)

        // Only place if empty
        if (!grid[col][row]) {
          grid[col][row] = { char: nextChar(), age: 0, flash: 6 + Math.floor(Math.random() * 6) }
        }
      }

      // ── render grid ────────────────────────────────────────────────────────
      let allFilled = true

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const cell = grid[c][r]

          if (!cell) {
            allFilled = false
            continue
          }

          cell.age++
          if (cell.flash > 0) cell.flash--

          const x = c * CHAR_W
          const y = r * CHAR_H

          // Near-wavefront columns: scramble char while fresh
          const distFromWave = wavefront - c
          const isActive = distFromWave >= 0 && distFromWave < spawnLeeway + 2

          const displayChar = (isActive && cell.age < 4)
            ? chars[Math.floor(Math.random() * chars.length)] || " "
            : cell.char

          if (cell.flash > 0) {
            // Bright flash on arrival
            const t = cell.flash / 12
            const ri = Math.round(cr + (220 - cr) * t)
            const gi = Math.round(cg + (255 - cg) * t)
            const bi = Math.round(cb + (255 - cb) * t)
            ctx.fillStyle = `rgba(${ri},${gi},${bi},${0.6 + t * 0.4})`
          } else {
            // Settled: slightly vary brightness by column age for depth
            const dim = 0.55 + Math.sin(c * 0.31 + r * 0.17) * 0.2
            ctx.fillStyle = `rgba(${cr},${cg},${cb},${dim})`
          }

          ctx.fillText(displayChar, x, y)
        }
      }

      // ── random flicker on settled chars ────────────────────────────────────
      if (Math.random() < 0.4) {
        const fc = Math.floor(Math.random() * cols)
        const fr = Math.floor(Math.random() * rows)
        const cell = grid[fc][fr]
        if (cell && cell.flash === 0) {
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.95)`
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)] || " ", fc * CHAR_W, fr * CHAR_H)
        }
      }

      // ── cycle restart ───────────────────────────────────────────────────────
      if (allFilled && elapsed > cycleDuration + 3000) {
        resetCycle()
      }

      rafId = requestAnimationFrame(draw)
    }

    // // Resolve CSS variable to the actual font-family name so document.fonts.load() works.
    // // e.g. var(--font-pixel) → "Pixelar" (or whatever the font's internal name is)
    // const resolveFontFamily = (family: string): string => {
    //   if (!family.includes("var(")) return family
    //   const varName = family.match(/var\((--[\w-]+)\)/)?.[1]
    //   if (!varName) return family
    //   return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || family
    // }
    // const resolvedFont = resolveFontFamily(fontFamily)

    const ro = new ResizeObserver(() => { init(); resetCycle() })

    document.fonts.load(`${fontSize}px ${resolvedFont}`).finally(() => {
      ro.observe(container)
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
      className={cn("[mask-image:linear-gradient(to_bottom,transparent,black,transparent)] absolute inset-0 pointer-events-none overflow-hidden", className)}
      style={{ opacity }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" style={{ display: "block" }} />
    </div>
  )
}