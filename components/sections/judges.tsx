"use client"

import { useState } from "react"
import Image from "next/image"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Linkedin, Mail, Github, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useJudges, type Judge } from "@/hooks/use-judges"

interface JudgesProps {
    translations: any
}

function JudgeSkeleton() {
    return (
        <div className="p-4 animate-pulse">
            <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-brand-cyan/10" />
            <div className="h-3 bg-brand-cyan/10 rounded mb-2" />
            <div className="h-2 bg-brand-cyan/10 rounded w-2/3 mx-auto" />
        </div>
    )
}

export function Judges({ translations }: JudgesProps) {
    const { judges, loading, error } = useJudges()
    const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null)

    const t = translations.judges

    return (
        <section id="judges" className="pb-20 px-4">
            <div className="container mx-auto">
                <div className="flex flex-col items-center mb-12">
                    <div className="mb-8">
                        <p className="font-pixel text-md text-brand-yellow mb-2">{translations.auth.signup.endpoint?.split(" ")[0]}</p>
                        <p className="font-pixel text-lg text-brand-yellow">{translations.judges.endpoint}</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 max-w-md">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-red-400 text-sm font-pixel">{t.errorTitle}</p>
                                <p className="text-red-400/80 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <JudgeSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Coming soon — empty collection */}
                {!loading && !error && judges.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <Clock className="w-10 h-10 text-brand-cyan/30" />
                        <p className="font-pixel text-sm text-brand-cyan/40 uppercase tracking-widest">
                            {t.comingSoon}
                        </p>
                    </div>
                )}

                {/* Judges grid */}
                {!loading && !error && judges.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
                        {judges.map((judge, index) => (
                            <button
                                key={judge.id}
                                onClick={() => setSelectedJudge(judge)}
                                className={cn(
                                    "group cursor-pointer transition-transform hover:scale-105 animate-in fade-in zoom-in-95 duration-300",
                                    index >= judges.length - judges.length % 5 && "md:translate-x-[calc(50%+3px)]"
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="p-4">
                                    <div className="aspect-square relative mb-3 rounded-lg overflow-hidden border-2 border-brand-cyan/10 group-hover:border-brand-orange/40 transition-colors">
                                        <Image
                                            src={judge.avatar || "/placeholder.svg"}
                                            alt={judge.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="font-pixel text-xs text-brand-yellow text-center group-hover:text-brand-orange transition-colors">
                                        {judge.name}
                                    </p>
                                    <p className="text-xs opacity-60 text-center mt-1">{judge.company}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={!!selectedJudge} onOpenChange={() => setSelectedJudge(null)}>
                <DialogContent className="glass-effect w-[90vw] max-w-2xl" aria-description="Modal that shows judge information">
                    {selectedJudge && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-6">
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-brand-cyan/20">
                                    <Image
                                        src={selectedJudge.avatar || "/placeholder.svg"}
                                        alt={selectedJudge.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <DialogTitle className="font-pixel font-bold text-xs text-brand-yellow mb-2">
                                        {selectedJudge.name}
                                    </DialogTitle>
                                    <p className="text-brand-yellow">
                                        {t.role}:{" "}
                                        <span className="text-white">{selectedJudge.position}</span>
                                    </p>
                                    <p className="text-brand-yellow">
                                        {t.company}:{" "}
                                        <span className="text-white">{selectedJudge.company}</span>
                                    </p>
                                </div>
                            </div>

                            <p className="leading-relaxed">{selectedJudge.bio}</p>

                            <div className="flex gap-4 justify-center">
                                {selectedJudge.linkedin && (
                                    <a
                                        href={selectedJudge.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-cyan hover:text-brand-orange transition-colors"
                                    >
                                        <Linkedin size={24} />
                                    </a>
                                )}
                                {selectedJudge.github && (
                                    <a
                                        href={selectedJudge.github}
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