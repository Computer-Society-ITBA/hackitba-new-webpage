"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  pageSize: number
  locale?: string
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  locale = "es",
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-cyan/10">
      <p className="text-brand-cyan/50 text-xs font-pixel">
        {from}–{to} {locale === "es" ? "de" : "of"} {totalItems}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded text-brand-cyan hover:bg-brand-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-brand-cyan/30 text-xs">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] h-7 rounded text-xs font-pixel transition-colors ${
                  p === page
                    ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40"
                    : "text-brand-cyan hover:bg-brand-cyan/10"
                }`}
              >
                {p}
              </button>
            )
          )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded text-brand-cyan hover:bg-brand-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
