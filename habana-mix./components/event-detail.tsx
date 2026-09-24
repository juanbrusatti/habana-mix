import Link from 'next/link'
import { ArrowLeft, CalendarDays, ImageIcon, MapPin, Ticket } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { EventGallery } from '@/components/event-gallery'
import { EventPhotosBlock } from '@/components/event-photos-block'
import { Reveal } from '@/components/reveal'
import { SmartImage } from '@/components/smart-image'
import { getCardTheme } from '@/lib/card-theme'
import {
  daysUntil,
  formatDateTimeRange,
  isImminent,
  isPastEvent,
  normalizeTags,
  resolvePrice,
} from '@/lib/event-format'
import type { AcademyEvent, EventSection } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Detalle de evento. Server Component: solo la galería y el botón de compra
 * corren en el cliente.
 *
 * Cambios de conversión respecto de la versión anterior:
 *  - barra de compra fija abajo en mobile, con precio siempre a la vista
 *  - precio real formateado en vez de una etiqueta de texto libre
 *  - el CTA aparece antes de la descripción, no enterrado bajo la galería
 */
export function EventDetail({
  event,
  sections,
}: {
  event: AcademyEvent
  sections: EventSection[]
}) {
  const theme = getCardTheme(event.theme)
  const tags = normalizeTags(event.tags)
  const price = resolvePrice(event)
  const countdown = daysUntil(event.starts_at)
  const urgent = isImminent(event.starts_at)
  const past = isPastEvent(event)
  const accentStyle = event.accent_color ? { color: event.accent_color } : undefined
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 sm:pb-20">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link
            href="/#eventos"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Link>

          <p className="flex-1 truncate px-2 text-center text-sm font-semibold sm:text-base">
            {event.title}
          </p>

          <div className="flex w-16 justify-end">
            {countdown && (
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  urgent
                    ? 'bg-accent text-accent-foreground border-transparent'
                    : 'border-primary/25 bg-primary/10 text-primary',
                )}
              >
                {countdown}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-4 sm:space-y-8 sm:pt-6">
        {event.image_url && (
          <div className="border-border/40 bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-3xl border sm:aspect-[16/9]">
            <SmartImage
              src={event.image_url}
              alt={event.title}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
            <div
              aria-hidden
              className={cn('absolute inset-0 bg-gradient-to-t', theme.overlay)}
            />

            {tags.length > 0 && (
              <ul className="absolute top-4 left-4 flex max-w-[80%] flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <li
                    key={`${index}-${tag}`}
                    className={cn(
                      'bg-background/45 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md',
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

            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
              <h1 className="font-serif text-3xl leading-tight font-semibold drop-shadow-sm sm:text-5xl">
                {event.title}
              </h1>
              {event.subtitle && (
                <p className="text-foreground/85 mt-1 text-sm font-medium sm:text-base">
                  {event.subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Si ya hay fotos, es lo primero que viene a buscar la gente. */}
        {event.photos_url && <EventPhotosBlock photosUrl={event.photos_url} />}

        {/* Bloque de decisión: datos duros + precio + comprar, todo junto y arriba. */}
        <section className="border-border/60 bg-card space-y-5 rounded-3xl border p-5 sm:p-7">
          {!event.image_url && (
            <div>
              <h1 className="font-serif text-3xl font-semibold">{event.title}</h1>
              {event.subtitle && (
                <p className="text-muted-foreground mt-1 text-base">{event.subtitle}</p>
              )}
            </div>
          )}

          <dl className="grid gap-3 text-sm">
            <div className="text-foreground/90 flex items-center gap-3">
              <span className="bg-primary/12 text-primary rounded-xl p-2">
                <CalendarDays className="h-5 w-5 shrink-0" />
              </span>
              <div>
                <dt className="text-muted-foreground text-xs">Fecha y hora</dt>
                <dd className="font-medium first-letter:uppercase">
                  {formatDateTimeRange(event.starts_at, event.ends_at)}
                </dd>
              </div>
            </div>

            {event.location && (
              <div className="text-foreground/90 flex items-center gap-3">
                <span className="bg-primary/12 text-primary rounded-xl p-2">
                  <MapPin className="h-5 w-5 shrink-0" />
                </span>
                <div>
                  <dt className="text-muted-foreground text-xs">Lugar</dt>
                  <dd className="font-medium">{event.location}</dd>
                </div>
              </div>
            )}

            <div className="text-foreground/90 flex items-center gap-3">
              <span className="bg-primary/12 text-primary rounded-xl p-2">
                <Ticket className="h-5 w-5 shrink-0" />
              </span>
              <div>
                <dt className="text-muted-foreground text-xs">Entrada</dt>
                <dd className="font-serif text-xl leading-none font-semibold">{price.main}</dd>
                {price.note && (
                  <dd className="text-muted-foreground mt-1 text-xs">{price.note}</dd>
                )}
              </div>
            </div>
          </dl>

          {past ? (
            <p className="border-border/60 text-muted-foreground rounded-2xl border border-dashed p-4 text-center text-sm">
              Este evento ya pasó. Mirá los{' '}
              <Link href="/#eventos" className="text-primary font-medium underline-offset-4 hover:underline">
                próximos eventos
              </Link>
              .
            </p>
          ) : (
            <div className="hidden sm:block">
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
            </div>
          )}

          {event.description && (
            <div className="border-border/40 border-t pt-5">
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line sm:text-base">
                {event.description}
              </p>
            </div>
          )}
        </section>

        {sortedSections.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-lg p-1.5">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <h2 className="font-serif text-lg font-semibold sm:text-xl">Galería</h2>
              </div>
              <span className="text-muted-foreground bg-muted rounded-full px-2.5 py-1 text-xs font-medium">
                {sortedSections.length} {sortedSections.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            <Reveal>
              <EventGallery sections={sortedSections} />
            </Reveal>
          </section>
        )}
      </main>

      {/* Barra de compra fija en mobile: el precio y el botón nunca se pierden de vista. */}
      {!past && (
        <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg sm:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px] tracking-[0.16em] uppercase">
                {event.is_free ? 'Entrada' : 'Precio'}
              </p>
              <p className="font-serif text-xl leading-none font-semibold">{price.main}</p>
            </div>
            <div className="ml-auto w-40">
              <BuyButton
                eventId={event.id}
                eventTitle={event.title}
                eventDate={event.starts_at}
                eventLocation={event.location}
                isFree={event.is_free}
                priceAmount={event.price_amount}
                priceLabel={event.price_label}
                ctaLabel={event.cta_label}
                compact
                className="h-12"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
