import Link from 'next/link'
import { CalendarDays, Camera, MapPin } from 'lucide-react'
import { SmartImage } from '@/components/smart-image'
import { eventHref, formatDateTimeRange } from '@/lib/event-format'
import type { AcademyEvent } from '@/lib/types'

/** Card de un álbum de fotos: lleva a la página del evento, donde está el link a Drive. */
export function PhotoAlbumCard({ event, priority = false }: { event: AcademyEvent; priority?: boolean }) {
  return (
    <Link
      href={`${eventHref(event)}#fotos`}
      className="group border-border/50 bg-card card-lift hover:border-primary/35 block overflow-hidden rounded-3xl border hover:-translate-y-1"
    >
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {event.image_url ? (
          <SmartImage
            src={event.image_url}
            alt={event.title}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="from-secondary to-card absolute inset-0 bg-gradient-to-br" />
        )}
        <div aria-hidden className="from-background/85 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
        <span className="bg-primary text-primary-foreground absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold">
          <Camera className="h-3.5 w-3.5" />
          Fotos
        </span>
        <h3 className="absolute inset-x-0 bottom-0 p-4 font-serif text-xl leading-tight font-semibold text-balance">
          {event.title}
        </h3>
      </div>

      <div className="space-y-1.5 p-4 text-sm">
        <p className="text-foreground/85 flex items-start gap-2 first-letter:uppercase">
          <CalendarDays className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <span className="first-letter:uppercase">{formatDateTimeRange(event.starts_at, null)}</span>
        </p>
        {event.location && (
          <p className="text-foreground/85 flex items-start gap-2">
            <MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            {event.location}
          </p>
        )}
        <p className="text-primary pt-1.5 text-sm font-semibold">
          Buscá tu foto <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  )
}
