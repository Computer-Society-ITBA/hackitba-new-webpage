"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { Linkedin, Mail, Github } from "lucide-react"
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
  linkedin?: string
  email?: string
  github?: string
}

const mentors: Mentor[] = Array.from({ length: 9 }, (_, i) => ({
  name: "Matias Pinero",
  title: "IT Manager",
  company: "IOL Inversiones",
  bio: "Suspendisse vitae tellus, sollicitudin id iaculis id, auctor non neque. Lorem ipsum dolor, Nunc in leo nulla. Mauris integer mattis neque non ultrices. Ut occaecat veneonistis ligula id gravidas. Inveamus et malesuada sollicitudin felis. Duis vivam sapittis justo, quis tristique.",
  avatar: "/placeholder.svg?height=200&width=200",
  linkedin: "https://linkedin.com",
  email: "mentor@example.com",
  github: "https://github.com",
}))

export function Mentors({ translations }: MentorsProps) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)

  return (
    <section id="mentors" className="pb-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div>
            <p className="font-pixel text-md text-brand-yellow mb-2">GET</p>
            <p className="font-pixel text-lg text-brand-yellow">{translations.mentors.endpoint}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl mx-auto ">
          {mentors.map((mentor, index) => (
            <button
              key={index}
              onClick={() => setSelectedMentor(mentor)}
              className={cn("group cursor-pointer transition-transform hover:scale-105", index >= mentors.length - mentors.length % 5 && "md:translate-x-[calc(50%+3px)]")}
            >
              <div className="p-4">
                <div className="aspect-square relative mb-3 rounded-lg overflow-hidden">
                  <Image src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} fill className="object-cover" />
                </div>
                <p className="font-pixel text-xs text-brand-yellow text-center">{mentor.name}</p>
                <p className="text-xs opacity-60 text-center mt-1">{mentor.company}</p>
              </div>
            </button>
          ))}
        </div>

      </div>

      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="glass-effect max-w-2xl">

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
                  <p className="font-pixel font-bold text-xs text-brand-yellow mb-2">{selectedMentor.name}</p>
                  <p className="text-brand-yellow">"{translations.mentors.role}": <span className="text-white">"{selectedMentor.title}"</span></p>
                  <p className="text-brand-yellow">"{translations.mentors.company}": <span className="text-white">"{selectedMentor.company}"</span></p>
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