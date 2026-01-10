import { GlassCard } from "@/components/ui/glass-card"

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
    <section id="timeline" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="font-pixel text-3xl md:text-5xl text-center text-brand-orange neon-glow-orange mb-16">
          {translations.timeline.title}
        </h2>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-brand-orange/30 -translate-x-1/2 hidden md:block" />

          <div className="space-y-12">
            {events.map((event, index) => (
              <div
                key={index}
                className={`flex items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <GlassCard neonOnHover neonColor="orange">
                    <h3 className="font-pixel text-xl md:text-2xl text-brand-yellow mb-3">{event.title}</h3>
                    <p className="text-brand-cyan leading-relaxed">{event.description}</p>
                  </GlassCard>
                </div>

                <div className="hidden md:flex w-4 h-4 rounded-full bg-brand-orange neon-border-orange flex-shrink-0" />

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
