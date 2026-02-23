"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Linkedin, Github, Briefcase, Code, Mic, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMentors, type Mentor } from "@/hooks/use-mentors"

interface MentorsProps {
  translations: any
}

type MentorCategory = "entrepreneurship" | "tech" | "oratory"

const categoryIcons = {
  entrepreneurship: Briefcase,
  tech: Code,
  oratory: Mic,
}

function MentorSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-brand-cyan/10" />
      <div className="h-3 bg-brand-cyan/10 rounded mb-2" />
      <div className="h-2 bg-brand-cyan/10 rounded w-2/3 mx-auto" />
    </div>
  )
}

export function Mentors({ translations }: MentorsProps) {
  const { mentors, loading, error } = useMentors()
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [activeCategory, setActiveCategory] = useState<MentorCategory>("entrepreneurship")

  const filteredMentors = mentors.filter(mentor => mentor.category === activeCategory)

  return (
    <section id="mentors" className="pb-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="mb-8">
            <p className="font-pixel text-md text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.mentors.endpoint}</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 max-w-md">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 text-sm font-pixel">{translations.mentors.errorTitle}</p>
                <p className="text-red-400/80 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Category tabs — only shown when there's data */}
          {!loading && !error && mentors.length > 0 && (
            <div className="flex gap-2 md:gap-4 mb-8 flex-wrap justify-center">
              {(["entrepreneurship", "tech", "oratory"] as MentorCategory[]).map((category) => {
                const Icon = categoryIcons[category]
                const isActive = activeCategory === category
                const hasMentors = mentors.some(m => m.category === category)

                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    disabled={!hasMentors}
                    className={cn(
                      "group relative px-4 md:px-6 py-3 rounded-lg border-2 transition-all duration-300 font-pixel text-xs md:text-sm uppercase tracking-wider flex items-center gap-2",
                      isActive
                        ? "border-brand-orange bg-brand-orange/10 text-brand-orange shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                        : hasMentors
                          ? "border-brand-cyan/20 bg-brand-black/40 text-brand-cyan/60 hover:border-brand-cyan/40 hover:text-brand-cyan hover:bg-brand-cyan/5"
                          : "border-brand-cyan/10 bg-brand-black/20 text-brand-cyan/30 cursor-not-allowed opacity-50"
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
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <MentorSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Coming soon — empty collection */}
        {!loading && !error && mentors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Clock className="w-10 h-10 text-brand-cyan/30" />
            <p className="font-pixel text-sm text-brand-cyan/40 uppercase tracking-widest">
              {translations.mentors.comingSoon}
            </p>
          </div>
        )}

        {/* Mentors grid */}
        {!loading && !error && mentors.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
            {filteredMentors.length > 0 ? (
              filteredMentors.map((mentor, index) => (
                <button
                  key={mentor.id}
                  onClick={() => setSelectedMentor(mentor)}
                  className={cn(
                    "group cursor-pointer transition-transform hover:scale-105 animate-in fade-in zoom-in-95 duration-300",
                    index >= filteredMentors.length - filteredMentors.length % 5 && "md:translate-x-[calc(50%+3px)]"
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
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="font-pixel text-sm text-brand-cyan/40 uppercase">
                  {translations.mentors.noMentors}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="glass-effect w-[90vw] max-w-2xl" aria-description="Modal that shows mentor information">
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
                    <DialogTitle className="font-pixel font-bold text-xs text-brand-yellow">
                      {selectedMentor.name}
                    </DialogTitle>
                    <span className="px-2 py-1 rounded text-[14px] font-pixel uppercase bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      {translations.mentors.categories[selectedMentor.category]}
                    </span>
                  </div>
                  <p className="text-brand-yellow">
                    {translations.mentors.role}:{" "}
                    <span className="text-white">{selectedMentor.position}</span>
                  </p>
                  <p className="text-brand-yellow">
                    {translations.mentors.company}:{" "}
                    <span className="text-white">{selectedMentor.company}</span>
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