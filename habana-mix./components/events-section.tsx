import { EventCard } from '@/components/event-card'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { getEvents } from '@/lib/data'

export async function EventsSection() {
  const events = await getEvents()

  return (
    <section
      id="eventos"
      aria-labelledby="eventos-title"
      className="relative scroll-mt-16 px-5 py-20 sm:px-8 sm:py-28"
    >
      {/* Acento decorativo suave detrás de la sección */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.79_0.152_68/0.1),transparent_70%)]"
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Agenda"
          title="Próximos eventos"
          description="Fiestas, socials y talleres intensivos. Cada mes armamos algo nuevo para que salgas a bailar con la comunidad."
        />

        <h2 id="eventos-title" className="sr-only">
          Próximos eventos
        </h2>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6">
          {events.map((event, i) => (
            <Reveal
              key={event.id}
              delay={i * 110}
              className={event.featured ? 'sm:col-span-2' : undefined}
            >
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>

        {events.length === 0 && (
          <p className="text-muted-foreground border-border/60 mt-10 rounded-3xl border border-dashed p-10 text-center text-sm">
            No hay eventos publicados por ahora. Volvé pronto.
          </p>
        )}
      </div>
    </section>
  )
}
