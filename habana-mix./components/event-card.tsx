import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { SmartImage } from '@/components/smart-image'
import { getCardTheme } from '@/lib/card-theme'
import {
  daysUntil,
  eventHref,
  formatDateTimeRange,
  isImminent,
  isPastEvent,
  normalizeTags,
  resolvePrice,
} from '@/lib/event-format'
import type { AcademyEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Card de evento. Server Component: solo el botón de compra es cliente.
 *
 * Prioridad de lectura pensada para quien entra a comprar:
 * qué es → cuándo → dónde → cuánto → comprar.
 */
export function EventCard({
  event,
  featured = false,
  priority = false,
}: {
  event: AcademyEvent
  /** El próximo evento se muestra más grande y ocupa el ancho completo. */
  featured?: boolean
  /** La primera imagen de la grilla se precarga; el resto va lazy. */
  priority?: boolean
}) {
  const theme = getCardTheme(event.theme)
  const tags = normalizeTags(event.tags).slice(0, featured ? 3 : 2)
  const price = resolvePrice(event)
  const countdown = daysUntil(event.starts_at)
  const urgent = isImminent(event.starts_at)
  const past = isPastEvent(event)
  const href = eventHref(event)
  const accentStyle = event.accent_color ? { color: event.accent_color } : undefined

  return (
    <article
      className={cn(
        'group border-border/50 bg-card card-lift relative flex flex-col overflow-hidden rounded-3xl border',
        'hover:border-primary/35 hover:-translate-y-1 hover:shadow-[0_18px_45px_-25px_oklch(0_0_0/0.9)]',
        featured && 'sm:col-span-2',
        past && 'opacity-70',
      )}
    >
      <Link href={href} className="relative block" aria-label={`Ver detalles de ${event.title}`}>
        <div
          className={cn(
            'relative overflow-hidden bg-muted',
            featured ? 'aspect-[4/3] sm:aspect-[21/9]' : 'aspect-[4/3]',
          )}
        >
          {event.image_url ? (
            <SmartImage
              src={event.image_url}
              alt={event.title}
              priority={priority}
              sizes={featured ? '(max-width: 640px) 100vw, 1100px' : '(max-width: 640px) 100vw, 540px'}
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="from-secondary to-card absolute inset-0 bg-gradient-to-br" />
          )}

          <div
            aria-hidden
            className={cn('absolute inset-0 bg-gradient-to-t', theme.overlay)}
            style={{ opacity: Math.min(event.overlay_opacity / 100 + 0.32, 1) }}
          />

          {/* Cuándo falta: en rojo y con pulso muy suave solo si es hoy o mañana. */}
          {countdown && (
            <span
              className={cn(
                'absolute top-3 right-3 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md',
                urgent
                  ? 'bg-accent text-accent-foreground border-transparent'
                  : 'border-border/50 bg-background/65 text-foreground',
              )}
            >
              <span className={cn(urgent && 'animate-soft-pulse')}>{countdown}</span>
            </span>
          )}
          {past && (
            <span className="border-border/50 bg-background/80 text-muted-foreground absolute top-3 right-3 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
              Finalizado
            </span>
          )}

          {tags.length > 0 && (
            <ul className="absolute top-3 left-3 flex max-w-[65%] flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <li
                  key={`${index}-${tag}`}
                  className={cn(
                    'bg-background/45 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md',
                    theme.accentBorder,
                    theme.accentText,
                  )}
                  style={accentStyle}
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h3
              className={cn(
                'font-serif leading-tight font-semibold text-balance',
                featured ? 'text-3xl sm:text-4xl' : 'text-2xl',
              )}
            >
              {event.title}
            </h3>
            {event.subtitle && (
              <p className="text-foreground/80 mt-1 line-clamp-2 text-sm sm:text-base">
                {event.subtitle}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <dl className="grid gap-2 text-sm">
          <div className="flex items-start gap-2.5">
            <CalendarDays className={cn('mt-0.5 h-4 w-4 shrink-0', theme.accentText)} style={accentStyle} />
            <dd className="text-foreground/90 first-letter:uppercase">
              {formatDateTimeRange(event.starts_at, event.ends_at)}
            </dd>
          </div>
          {event.location && (
            <div className="flex items-start gap-2.5">
              <MapPin className={cn('mt-0.5 h-4 w-4 shrink-0', theme.accentText)} style={accentStyle} />
              <dd className="text-foreground/90">{event.location}</dd>
            </div>
          )}
        </dl>

        {event.description && featured && (
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed text-pretty">
            {event.description}
          </p>
        )}

        {/* Precio real, no una etiqueta de texto libre que puede venir vacía. */}
        <div className="border-border/50 mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">
              {event.is_free ? 'Entrada' : 'Precio'}
            </p>
            <p className="font-serif text-2xl leading-none font-semibold">{price.main}</p>
            {price.note && <p className="text-muted-foreground mt-1 text-xs">{price.note}</p>}
          </div>
          <Link
            href={href}
            className="text-muted-foreground hover:text-primary text-sm font-medium underline-offset-4 transition-colors hover:underline"
          >
            Ver detalles
          </Link>
        </div>

        {!past && (
          <BuyButton
            eventId={event.id}
            eventTitle={event.title}
            eventDate={event.starts_at}
            eventLocation={event.location}
            isFree={event.is_free}
            priceAmount={event.price_amount}
            priceLabel={event.price_label}
            ctaLabel={event.cta_label}
          />
        )}
      </div>
    </article>
  )
}
