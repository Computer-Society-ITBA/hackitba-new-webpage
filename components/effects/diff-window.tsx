// components/diff/diff-window.tsx
"use client"

import { useState } from "react"

interface DiffLine {
    lineNumber: number
    content: string
    type: "add" | "remove"
}

interface DiffWindowProps {
    leftFile: string
    rightFile: string
    leftLines: DiffLine[]
    rightLines: DiffLine[]
    onRightLineToggle?: (index: number) => void
    rightLineStates?: boolean[]
}

export function DiffWindow({
    leftFile,
    rightFile,
    leftLines,
    rightLines,
    onRightLineToggle,
    rightLineStates = []
}: DiffWindowProps) {
    const [activeTab, setActiveTab] = useState<"left" | "right">("left")

    return (
        <div className="w-full">
            <div
                className="rounded-xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,198,41,0.1)] overflow-hidden transition-all duration-300 hover:shadow-[0_35px_100px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,198,41,0.15)]"
                style={{
                    background: "linear-gradient(to bottom, rgba(13,17,23,0.95), rgba(13,17,23,0.98))"
                }}
            >
                {/* Editor Header */}
                <div
                    className="border-b px-4 py-2.5 flex items-center gap-3"
                    style={{
                        background: "linear-gradient(to bottom, rgba(0,32,63,0.6), rgba(0,32,63,0.4))",
                        borderColor: "rgba(255,198,41,0.1)"
                    }}
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-yellow/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="text-brand-yellow/70 text-xs font-mono tracking-wide hidden md:inline">
                            {leftFile} ⇄ {rightFile}
                        </span>
                        <span className="text-brand-yellow/70 text-xs font-mono tracking-wide md:hidden">
                            DIFF VIEW
                        </span>
                    </div>
                    <div className="ml-auto text-[10px] font-mono text-white/30">
                        COMPARE
                    </div>
                </div>

                {/* Mobile Tab Bar */}
                <div
                    className="md:hidden border-b flex"
                    style={{
                        background: "rgba(0,32,63,0.3)",
                        borderColor: "rgba(255,198,41,0.08)"
                    }}
                >
                    <button
                        onClick={() => setActiveTab("left")}
                        className={`
                        flex-1 px-4 py-2.5 font-mono text-sm border-r transition-all duration-200
                        ${activeTab === "left"
                                ? "bg-gradient-to-b from-brand-navy to-brand-orange/60 text-brand-yellow shadow-[inset_0_-2px_0_0_var(--color-brand-yellow)]"
                                : "bg-brand-yellow/3 text-gray-400 hover:bg-brand-yellow/1 hover:text-gray-200"
                            }
                        `}>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            <span>{leftFile}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("right")}
                        className={`
                        flex-1 px-4 py-2.5 font-mono text-sm transition-all duration-200
                        ${activeTab === "right"
                                ? "bg-gradient-to-b from-brand-navy to-brand-orange/60 text-brand-yellow shadow-[inset_0_-2px_0_0_var(--color-brand-yellow)]"
                                : "bg-brand-yellow/3 text-gray-400 hover:bg-brand-yellow/1 hover:text-gray-200"
                            }
                        `}>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-yellow/50" />
                            <span>{rightFile}</span>
                        </div>
                    </button>
                </div>

                {/* Diff Content */}
                <div className="grid lg:grid-cols-2 grid-cols-1 divide-x divide-brand-yellow/10">
                    {/* Left Pane - Additions */}
                    <div
                        className={`shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)] ${activeTab === "right" ? "hidden md:block" : ""}`}
                        style={{
                            background: "rgba(13,17,23,0.95)"
                        }}
                    >
                        {/* File Header - Desktop Only */}
                        <div
                            className="hidden md:flex px-4 py-2 border-b font-mono text-xs items-center gap-2"
                            style={{
                                background: "rgba(0,32,63,0.3)",
                                borderColor: "rgba(34,197,94,0.2)"
                            }}
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            <span className="text-green-400/80">{leftFile}</span>
                            <span className="ml-auto text-green-400/50 text-[10px]">+{leftLines.length} benefits</span>
                        </div>

                        {/* Lines */}
                        <div className="p-4 md:p-6 space-y-0">
                            {leftLines.map((line, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3 group hover:bg-green-500/5 transition-colors py-2 px-2 -mx-2 rounded"
                                >
                                    <span className="text-white/30 font-mono text-xs select-none w-6 text-right flex-shrink-0 mt-0.5">
                                        {line.lineNumber}
                                    </span>
                                    <span className="text-green-400 font-mono text-sm select-none flex-shrink-0">
                                        +
                                    </span>
                                    <span className="text-white/90 font-mono text-sm leading-relaxed flex-1">
                                        {line.content}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Pane - Requirements */}
                    <div
                        className={`shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)] ${activeTab === "left" ? "hidden md:block" : ""}`}
                        style={{
                            background: "rgba(13,17,23,0.95)"
                        }}
                    >
                        {/* File Header - Desktop Only */}
                        <div
                            className="hidden md:flex px-4 py-2 border-b font-mono text-xs items-center gap-2"
                            style={{
                                background: "rgba(0,32,63,0.3)",
                                borderColor: "rgba(255,198,41,0.2)"
                            }}
                        >
                            <div className="w-2 h-2 rounded-full bg-brand-yellow/50" />
                            <span className="text-brand-yellow/80">{rightFile}</span>
                            <span className="ml-auto text-brand-yellow/50 text-[10px]">{rightLines.length} requirements</span>
                        </div>

                        {/* Lines */}
                        <div className="p-4 md:p-6 space-y-0">
                            {rightLines.map((line, idx) => {
                                const isChecked = rightLineStates[idx] || false
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onRightLineToggle?.(idx)}
                                        className={`
                      flex items-start gap-3 group transition-all py-2 px-2 -mx-2 rounded w-full text-left
                      ${isChecked ? "hover:bg-green-500/5" : "hover:bg-brand-yellow/5"}
                    `}
                                    >
                                        <span className="text-white/30 font-mono text-xs select-none w-6 text-right flex-shrink-0 mt-0.5">
                                            {line.lineNumber}
                                        </span>
                                        <span className={`font-mono text-sm select-none flex-shrink-0 transition-colors ${isChecked ? "text-green-400" : "text-brand-yellow"
                                            }`}>
                                            {isChecked ? "+" : "-"}
                                        </span>
                                        <span className={`font-mono text-sm leading-relaxed flex-1 transition-all ${isChecked
                                            ? "text-white/40 line-through"
                                            : "text-white/90"
                                            }`}>
                                            {line.content}
                                        </span>
                                        {isChecked && (
                                            <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}