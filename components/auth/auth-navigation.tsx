"use client"

import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AuthNavigationProps {
    locale: string
}

export function AuthNavigation({ locale }: AuthNavigationProps) {
    const router = useRouter()

    return (
        <div className="relative md:absolute top-0 left-0 md:top-4 md:left-4 z-20 flex gap-2 p-4 md:p-0 w-full md:w-auto">
            <button
                onClick={() => router.back()}
                className="p-2 text-brand-cyan hover:text-brand-orange hover:neon-glow-orange transition-colors"
                title="Go back"
            >
                <ArrowLeft size={24} />
            </button>
            <Link
                href={`/${locale}`}
                className="p-2 text-brand-cyan hover:text-brand-orange hover:neon-glow-orange transition-colors"
                title="Home"
            >
                <Home size={24} />
            </Link>
        </div>
    )
}
