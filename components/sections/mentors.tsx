"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { Linkedin, Mail, Github, Briefcase, Code, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface MentorsProps {
  translations: any
}

interface Mentor {
  name: string
  title: string
  company: string
  bio: string
  avatar: string
  category: "entrepreneurship" | "tech" | "oratory"
  linkedin?: string
  email?: string
  github?: string
}

type MentorCategory = "entrepreneurship" | "tech" | "oratory"

const mentors: Mentor[] = [
  // Entrepreneurship mentors
  ...Array.from({ length: 7 }, (_, i) => ({
    name: "Matias Pinero",
    title: "CEO & Founder",
    company: "IOL Inversiones",
    bio: "Suspendisse vitae tellus, sollicitudin id iaculis id, auctor non neque. Lorem ipsum dolor, Nunc in leo nulla. Mauris integer mattis neque non ultrices. Ut occaecat veneonistis ligula id gravidas. Inveamus et malesuada sollicitudin felis. Duis vivam sapittis justo, quis tristique.",
    avatar: "/placeholder.svg?height=200&width=200",
    category: "entrepreneurship" as const,
    linkedin: "https://linkedin.com",
    email: "mentor@example.com",
    github: "https://github.com",
  })),
  // Tech mentors
  ...Array.from({ length: 7 }, (_, i) => ({
    name: "Ana García",
    title: "Senior Software Engineer",
    company: "Tech Corp",
    bio: "Suspendisse vitae tellus, sollicitudin id iaculis id, auctor non neque. Lorem ipsum dolor, Nunc in leo nulla. Mauris integer mattis neque non ultrices. Ut occaecat veneonistis ligula id gravidas. Inveamus et malesuada sollicitudin felis. Duis vivam sapittis justo, quis tristique.",
    avatar: "/placeholder.svg?height=200&width=200",
    category: "tech" as const,
    linkedin: "https://linkedin.com",
    email: "mentor@example.com",
    github: "https://github.com",
  })),
  // Oratory mentors
  ...Array.from({ length: 7 }, (_, i) => ({
    name: "Carlos López",
    title: "Public Speaking Coach",
    company: "Speak Studio",
    bio: "Suspendisse vitae tellus, sollicitudin id iaculis id, auctor non neque. Lorem ipsum dolor, Nunc in leo nulla. Mauris integer mattis neque non ultrices. Ut occaecat veneonistis ligula id gravidas. Inveamus et malesuada sollicitudin felis. Duis vivam sapittis justo, quis tristique.",
    avatar: "/placeholder.svg?height=200&width=200",
    category: "oratory" as const,
    linkedin: "https://linkedin.com",
    email: "mentor@example.com",
  })),
]

const categoryIcons = {
  entrepreneurship: Briefcase,
  tech: Code,
  oratory: Mic,
}

export function Mentors({ translations }: MentorsProps) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [activeCategory, setActiveCategory] = useState<MentorCategory>("entrepreneurship")

  const filteredMentors = mentors.filter(mentor => mentor.category === activeCategory)

  return (
    <section id="mentors" className="pb-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="mb-8">
            <p className="font-pixel text-md text-brand-yellow mb-2">GET</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.mentors.endpoint}</p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 md:gap-4 mb-8 flex-wrap justify-center">
            {(["entrepreneurship", "tech", "oratory"] as MentorCategory[]).map((category) => {
              const Icon = categoryIcons[category]
              const isActive = activeCategory === category

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "group relative px-4 md:px-6 py-3 rounded-lg border-2 transition-all duration-300 font-pixel text-xs md:text-sm uppercase tracking-wider flex items-center gap-2",
                    isActive
                      ? "border-brand-orange bg-brand-orange/10 text-brand-orange shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                      : "border-brand-cyan/20 bg-brand-black/40 text-brand-cyan/60 hover:border-brand-cyan/40 hover:text-brand-cyan hover:bg-brand-cyan/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{translations.mentors.categories[category]}</span>
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-brand-orange/5 animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto">
          {filteredMentors.map((mentor, index) => (
            <button
              key={`${mentor.category}-${index}`}
              onClick={() => setSelectedMentor(mentor)}
              className={cn(
                "group cursor-pointer transition-transform hover:scale-105 animate-in fade-in zoom-in-95 duration-300",
                index >= filteredMentors.length - filteredMentors.length % 4 && "md:translate-x-[calc(50%+3px)]"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-4">
                <div className="aspect-square relative mb-3 rounded-lg overflow-hidden border-2 border-brand-cyan/10 group-hover:border-brand-orange/40 transition-colors">
                  <Image
                    src={mentor.avatar || "/placeholder.svg"}
                    alt={mentor.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-pixel text-xs text-brand-yellow text-center group-hover:text-brand-orange transition-colors">
                  {mentor.name}
                </p>
                <p className="text-xs opacity-60 text-center mt-1">{mentor.company}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <p className="font-pixel text-sm text-brand-cyan/40 uppercase">
              {translations.mentors.noMentors}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="glass-effect max-w-2xl">
          {selectedMentor && (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-brand-cyan/20">
                  <Image
                    src={selectedMentor.avatar || "/placeholder.svg"}
                    alt={selectedMentor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-pixel font-bold text-xs text-brand-yellow">
                      {selectedMentor.name}
                    </p>
                    <span className="px-2 py-1 rounded text-[8px] font-pixel uppercase bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      {translations.mentors.categories[selectedMentor.category]}
                    </span>
                  </div>
                  <p className="text-brand-yellow">
                    "{translations.mentors.role}": <span className="text-white">"{selectedMentor.title}"</span>
                  </p>
                  <p className="text-brand-yellow">
                    "{translations.mentors.company}": <span className="text-white">"{selectedMentor.company}"</span>
                  </p>
                </div>
              </div>

              <p className="leading-relaxed">{selectedMentor.bio}</p>

              <div className="flex gap-4 justify-center">
                {selectedMentor.linkedin && (
                  <a
                    href={selectedMentor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:text-brand-orange transition-colors"
                  >
                    <Linkedin size={24} />
                  </a>
                )}
                {selectedMentor.email && (
                  <a
                    href={`mailto:${selectedMentor.email}`}
                    className="text-brand-cyan hover:text-brand-orange transition-colors"
                  >
                    <Mail size={24} />
                  </a>
                )}
                {selectedMentor.github && (
                  <a
                    href={selectedMentor.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:text-brand-orange transition-colors"
                  >
                    <Github size={24} />
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}