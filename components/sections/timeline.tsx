import { GlassCard } from "@/components/ui/glass-card"
import { NeonGlow } from "@/components/effects/neon-glow"

interface TimelineProps {
  translations: any
}

export function Timeline({ translations }: TimelineProps) {
  const events = [
    {
      title: translations.timeline.beginning.title,
      description: translations.timeline.beginning.description,
    },
    {
      title: translations.timeline.challenge.title,
      description: translations.timeline.challenge.description,
    },
    {
      title: translations.timeline.closing.title,
      description: translations.timeline.closing.description,
    },
    {
      title: translations.timeline.future.title,
      description: translations.timeline.future.description,
    },
  ]

  return (
    <section id="timeline" className="pb-40 md:px-40 overflow-x-hidden">
      <div className="container mx-auto">

        {/* Desktop View */}
        <div className="hidden lg:flex flex-col items-center max-w-4xl mx-auto">
          <div className="grid grid-cols-4 w-full gap-4">
            {/* Top Row */}
            <div className="flex flex-col justify-between h-full">
              <div className="mb-4">
                <h3 className="font-pixel text-sm text-brand-yellow mb-2">{events[0].title}</h3>
                <p className="text-md">{events[0].description}</p>
              </div>
              <div className="h-8 w-8 self-center neon-border-orange bg-brand-yellow translate-y-4 z-50"></div>
            </div>
            <div className="col-start-3 flex flex-col justify-between h-full">
              <div className="mb-4">
                <h3 className="font-pixel text-sm text-brand-yellow mb-2">{events[2].title}</h3>
                <p className="text-md">{events[2].description}</p>
              </div>
              <div className="h-8 w-8 self-center neon-border-orange bg-brand-yellow translate-y-4 z-50"></div>
            </div>
          </div>

          <div className="h-1 bg-brand-yellow w-full my-0 neon-border-orange relative z-10" />

          <div className="grid grid-cols-4 w-full gap-4">
            {/* Bottom Row */}
            <div className="col-start-2 flex flex-col justify-start h-full">
              <div className="h-8 w-8 self-center neon-border-orange bg-brand-yellow -translate-y-5 z-50"></div>
              <div className="mt-4">
                <h3 className="font-pixel text-sm text-brand-yellow mb-2">{events[1].title}</h3>
                <p className="text-md">{events[1].description}</p>
              </div>
            </div>
            <div className="col-start-4 flex flex-col justify-start h-full">
              <div className="h-8 w-8 self-center neon-border-orange bg-brand-yellow -translate-y-5 z-50"></div>
              <div className="mt-4">
                <h3 className="font-pixel text-sm text-brand-yellow mb-2">{events[3].title}</h3>
                <p className="text-md">{events[3].description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden relative">
          <div className="absolute left-4 top-0 bottom-0 w-1 bg-brand-yellow neon-border-orange" />

          <div className="space-y-12 pl-12">
            {events.map((event, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[38px] top-6 w-4 h-4 bg-brand-yellow neon-border-orange" />
                <div>
                  <h3 className="font-pixel text-sm text-brand-yellow mb-2">{event.title}</h3>
                  <p className="text-md leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
