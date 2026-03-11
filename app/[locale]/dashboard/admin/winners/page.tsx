// app/[locale]/dashboard/admin/winners/page.tsx
//
// Protected under your existing admin layout.
// Place this file at the path above.

import { WinnersReveal } from "@/components/admin/winners-reveal"

export const metadata = {
    title: "Ganadores — HackITBA 2026",
}

export default function WinnersPage() {
    return (
        <main
            className="relative min-h-screen w-full overflow-hidden"
            style={{ background: "#020617" }}
        >
            <WinnersReveal />
        </main>
    )
}