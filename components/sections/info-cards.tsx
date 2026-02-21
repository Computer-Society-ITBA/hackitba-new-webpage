"use client"

import { useState } from "react"
import { Timeline } from "./timeline"
import { GlassCard } from "../ui/glass-card"

interface TabConfig {
  id: string
  label: string
  endpoint: string
}

interface TerminalWindowProps {
  translations: any
}

function TerminalWindow({ translations }: TerminalWindowProps) {
  const tabs: TabConfig[] = [
    { id: "about-us", label: "about-us", endpoint: "GET /api/v2026/about-us" },
    { id: "hackitba", label: "hackitba", endpoint: "GET /api/v2026/hackitba" },
    { id: "location", label: "location", endpoint: "GET /api/v2026/location" }
  ]

  const [activeTab, setActiveTab] = useState<string>("about-us")

  const renderContent = () => {
    switch (activeTab) {
      case "about-us":
        return (
          <>
            <div className="mb-6 font-mono text-sm text-brand-cyan">
              csitba@hackitba % curl /api/v2026/about-us
            </div>

            <div className="font-mono text-sm leading-relaxed text-gray-300">
              <p>{"{"}</p>
              <div className="pl-6 space-y-2">
                <p>
                  <span className="text-brand-yellow">"name"</span>:{" "}
                  <span className="text-gray-100">"{translations.about.title}"</span>,
                </p>
                <p>
                  <span className="text-brand-yellow">"history"</span>:{" "}
                  <span className="text-gray-100">"{translations.about.historyText}"</span>,
                </p>
                <p>
                  <span className="text-brand-yellow">"vision"</span>:{" "}
                  <span className="text-gray-100">"{translations.about.visionText}"</span>,
                </p>
                <p>
                  <span className="text-brand-yellow">"objective"</span>:{" "}
                  <span className="text-gray-100">"{translations.about.objectiveText}"</span>
                </p>
              </div>
              <p>{"}"}</p>
            </div>
          </>
        )


      case "hackitba":
        return (
          <>
            <div className="mb-6 font-mono text-sm text-brand-cyan">
              csitba@hackitba % curl /api/v2026/hackitba
            </div>

            <div className="font-mono text-sm leading-relaxed text-gray-300">
              <p>{"{"}</p>
              <div className="pl-6 space-y-2">
                <p>
                  <span className="text-brand-yellow">"description"</span>:{" "}
                  <span className="text-gray-100">"{translations.event.description}"</span>,
                </p>
                <p>
                  <span className="text-brand-yellow">"date"</span>:{" "}
                  <span className="text-gray-100">"{translations.event.date}"</span>
                </p>
              </div>
              <p>{"}"}</p>
            </div>
          </>
        )


      case "location":
        return (
          <>
            <div className="mb-6 font-mono text-sm text-brand-cyan">
              csitba@hackitba % curl /api/v2026/location
            </div>

            <div className="font-mono text-sm leading-relaxed text-gray-300 mb-6">
              <p>{"{"}</p>
              <div className="pl-6 space-y-2">
                <p>
                  <span className="text-brand-yellow">"description"</span>:{" "}
                  <span className="text-gray-100">"{translations.location.description}"</span>,
                </p>
                <p>
                  <span className="text-brand-yellow">"address"</span>:{" "}
                  <span className="text-gray-100">"{translations.location.address}"</span>,
                </p>
                <p>
                  <span className="text-brand-yellow">"coordinates"</span>:{" "}
                  <span className="text-gray-100">"{translations.location.coordinates}"</span>
                </p>
              </div>
              <p>{"}"}</p>
            </div>

            <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-brand-yellow/30 shadow-lg">
              <iframe
                src="https://maps.google.com/maps?hl=en&q=Lavardén%20235%20CABA%20Argentina+(ITBA%20Sede%20Distrito%20Tecnológico)&z=15&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </>
        )


      default:
        return null
    }
  }

  return (
    <div className="w-full perspective-[1000px]">
      <div className="bg-[#1e1e2e] rounded-xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden transition-all duration-300 hover:shadow-[0_35px_100px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)]">
        {/* Window Chrome */}
        <div className="bg-gradient-to-b from-brand-navy/30 to-brand-navy border-b border-white/10 px-4 py-3 flex items-center gap-3">
          {/* macOS Traffic Lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_4px_rgba(255,95,86,0.5)] hover:brightness-110 transition-all cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_4px_rgba(255,189,46,0.5)] hover:brightness-110 transition-all cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_4px_rgba(39,201,63,0.5)] hover:brightness-110 transition-all cursor-pointer" />
          </div>

          {/* Window Title */}
          <div className="flex-1 text-center">
            <span className="text-gray-400 text-xs font-mono tracking-wider">
              bash — terminal
            </span>
          </div>

          {/* Spacer for alignment */}
          <div className="w-[60px]" />
        </div>

        {/* Tab Bar */}
        <div className="bg-gradient-to-r from-brand-navy/80 to-brand-navy/60 border-b border-white/5 flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-5 py-2.5 font-mono text-sm border-r border-white/5
                whitespace-nowrap transition-all duration-200 group
                ${activeTab === tab.id
                  ? "bg-gradient-to-b from-brand-navy to-brand-orange/60 text-brand-yellow shadow-[inset_0_-2px_0_0_var(--color-brand-yellow)]"
                  : "bg-brand-yellow/3 text-gray-400 hover:bg-brand-yellow/1 hover:text-gray-200"
                }
              `}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-b from-brand-yellow/5 to-transparent pointer-events-none" />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Terminal Content */}
        <div className="bg-linear-to-t from-brand-navy to-brand-dark-orange/050 p-8 min-h-[400px] shadow-[inset_0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="animate-in fade-in duration-300">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

interface InfoCardsProps {
  translations: any
}

export function InfoCards({ translations }: InfoCardsProps) {
  return (
    <section
      className="py-20 px-4"
      style={{
        background:
          "linear-gradient(to bottom, var(--color-brand-navy) 40%, var(--color-brand-dark-orange))"
      }}
    >
      <Timeline translations={translations} />
      <div className="container mx-auto max-w-5xl mt-16">
        <h2 id="about" className="scroll-mt-24 text-center mb-12 font-pixel text-xl md:text-2xl text-brand-yellow mb-3 tracking-wider">
          ABOUT HACKITBA
        </h2>
        <TerminalWindow translations={translations} />
      </div>
    </section>
  )
}