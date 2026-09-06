import { EventCard } from '@/components/event-card'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { isPastEvent } from '@/lib/event-format'
import type { AcademyEvent } from '@/lib/types'

/**
 * Agenda. Server Component: los eventos llegan resueltos desde la página, así
 * que el HTML ya sale con las cards (antes había un spinner y una consulta a
 * Supabase que recién arrancaba cuando el navegador terminaba de ejecutar JS).
 *
 * El primer evento próximo se muestra destacado y a ancho completo.
 */
export function EventsSection({ events }: { events: AcademyEvent[] }) {
  const upcoming = events.filter((event) => !isPastEvent(event))
  const [featured, ...rest] = upcoming.length > 0 ? upcoming : events

  return (
    <section
      id="eventos"
      aria-labelledby="eventos-title"
      className="relative scroll-mt-20 px-4 py-16 sm:px-8 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.91_0.17_100/0.08),transparent_70%)]"
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Agenda"
          title="Próximos eventos"
          description="Fiestas, socials y talleres. Elegís, comprás y te llega el QR al mail."
        />

        <h2 id="eventos-title" className="sr-only">
          Próximos eventos
        </h2>

        {featured ? (
          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5">
            <Reveal className="sm:col-span-2">
              <EventCard event={featured} featured priority />
            </Reveal>

            {rest.map((event, index) => (
              <Reveal key={event.id} delay={Math.min(index * 90, 270)}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground border-border/60 mt-10 rounded-3xl border border-dashed p-10 text-center text-sm">
            No hay eventos publicados por ahora. Volvé pronto.
          </p>
        )}
      </div>
    </section>
  )
}
