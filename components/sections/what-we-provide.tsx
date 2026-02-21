// app/sections/what-we-provide.tsx
"use client"

import { useState } from "react"
import { DiffWindow } from "@/components/effects/diff-window"

interface WhatWeProvideProps {
  translations: any
}

export function WhatWeProvide({ translations }: WhatWeProvideProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(translations.youBring.items.length).fill(false)
  )

  const handleToggle = (index: number) => {
    const newChecked = [...checkedItems]
    newChecked[index] = !newChecked[index]
    setCheckedItems(newChecked)
  }

  const leftLines = translations.weProvide.items.map((item: string, idx: number) => ({
    lineNumber: idx + 1,
    content: item,
    type: "add" as const
  }))

  const rightLines = translations.youBring.items.map((item: string, idx: number) => ({
    lineNumber: idx + 1,
    content: item,
    type: "remove" as const
  }))

  return (
    <section
      id="provide"
      className="py-20 px-4"
      style={{
        background: "linear-gradient(to bottom, var(--color-brand-dark-orange), var(--color-brand-navy))"
      }}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="font-pixel text-xl md:text-2xl text-brand-yellow mb-3 tracking-wider">
            {translations.weProvide.title.includes("⇄") ? (
              <span className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <span>{translations.weProvide.title.split("⇄")[0].trim()}</span>
                <span className="text-2xl md:text-4xl">⇄</span>
                <span>{translations.weProvide.title.split("⇄")[1].trim()}</span>
              </span>
            ) : (
              translations.weProvide.title
            )}
          </h2>
          <p className="text-white/60 font-mono text-sm max-w-2xl mx-auto">
            {translations.weProvide.subtitle}
          </p>
        </div>

        <DiffWindow
          leftFile="benefits.md"
          rightFile="checklist.md"
          leftLines={leftLines}
          rightLines={rightLines}
          onRightLineToggle={handleToggle}
          rightLineStates={checkedItems}
        />
      </div>
    </section>
  )
}