"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { Linkedin, Mail, Github } from "lucide-react"

interface MentorsProps {
  translations: any
}

interface Mentor {
  name: string
  title: string
  company: string
  bio: string
  avatar: string
  linkedin?: string
  email?: string
  github?: string
}

const mentors: Mentor[] = Array.from({ length: 10 }, (_, i) => ({
  name: "Matias Pinero",
  title: "IDL Inversiones",
  company: "IDL Inversiones",
  bio: "Suspendisse vitae tellus, sollicitudin id iaculis id, auctor non neque. Lorem ipsum dolor, Nunc in leo nulla. Mauris integer mattis neque non ultrices. Ut occaecat veneonistis ligula id gravidas. Inveamus et malesuada sollicitudin felis. Duis vivam sapittis justo, quis tristique.",
  avatar: "/placeholder.svg?height=200&width=200",
  linkedin: "https://linkedin.com",
  email: "mentor@example.com",
  github: "https://github.com",
}))

export function Mentors({ translations }: MentorsProps) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)

  return (
    <section id="mentors" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-brand-cyan mb-2">{translations.mentors.endpoint}</p>
          <h2 className="font-pixel text-3xl md:text-5xl text-brand-orange neon-glow-orange">
            {translations.mentors.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {mentors.map((mentor, index) => (
            <button
              key={index}
              onClick={() => setSelectedMentor(mentor)}
              className="group cursor-pointer transition-transform hover:scale-105"
            >
              <GlassCard neonOnHover neonColor="cyan" className="p-4">
                <div className="aspect-square relative mb-3 rounded-lg overflow-hidden">
                  <Image src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} fill className="object-cover" />
                </div>
                <p className="font-pixel text-xs text-brand-cyan text-center">{mentor.name}</p>
                <p className="font-mono text-xs text-brand-cyan/60 text-center mt-1">{mentor.company}</p>
              </GlassCard>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="glass-effect border-brand-cyan/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-pixel text-2xl text-brand-orange">
              {translations.mentors.modalTitle}
            </DialogTitle>
          </DialogHeader>

          {selectedMentor && (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedMentor.avatar || "/placeholder.svg"}
                    alt={selectedMentor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-pixel text-xl text-brand-yellow mb-1">{selectedMentor.name}</h3>
                  <p className="text-brand-cyan mb-1">{selectedMentor.title}</p>
                  <p className="font-mono text-sm text-brand-cyan/60">{selectedMentor.company}</p>
                </div>
              </div>

              <p className="text-brand-cyan leading-relaxed">{selectedMentor.bio}</p>

              <div className="flex gap-4">
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
