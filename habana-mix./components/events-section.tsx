'use client'

import { useState, useEffect } from 'react'
import { EventCard } from '@/components/event-card'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  is_free: boolean
  price_label: string | null
  price_amount: number | null
  price_currency: string
  cta_label: string
  cta_url: string | null
  theme: string
  layout: string
  tags: string[]
  featured: boolean
  overlay_opacity: number
  accent_color: string | null
  status: string
  sort_order: number
}

export function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('starts_at', { ascending: true })

      if (error) {
        console.error('Error cargando eventos:', error)
        return
      }
      if (data) {
        setEvents(data)
      }
    } catch (error) {
      console.error('Error cargando eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section
        id="eventos"
        aria-labelledby="eventos-title"
        className="relative scroll-mt-16 px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

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
              <EventCard event={event as any} />
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
