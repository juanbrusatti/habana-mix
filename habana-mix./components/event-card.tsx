'use client'

import { useState } from 'react'
import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCardTheme } from '@/lib/card-theme'
import type { AcademyEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FreeAttendanceDialog } from '@/components/free-attendance-dialog'
import { PaidAttendanceDialog } from '@/components/paid-attendance-dialog'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function daysUntil(iso: string) {
  const diff = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / 86_400_000,
  )
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `En ${diff} días`
}

/**
 * Card de evento totalmente controlada por los campos de la fila:
 * theme, layout, tags, featured, overlay_opacity, accent_color.
 * El admin cambia esos campos y la card cambia de aspecto sin tocar código.
 */
export function EventCard({ event }: { event: AcademyEvent }) {
  const t = getCardTheme(event.theme)
  const accentStyle = event.accent_color
    ? { color: event.accent_color }
    : undefined

  const [open, setOpen] = useState(false)

  const isOverlay = event.layout === 'overlay'
  const isMinimal = event.layout === 'minimal'

  const ctaClassName =
    'mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-transparent text-[15px] font-semibold transition-all duration-300 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]'
  const ctaStyle = event.accent_color
    ? { backgroundColor: event.accent_color, color: '#1b1410' }
    : undefined

  return (
    <article
      className={cn(
        'group border-border/60 bg-card relative overflow-hidden rounded-3xl border ring-1 ring-transparent transition-all duration-500',
        'hover:-translate-y-1 active:scale-[0.99]',
        t.glow,
        `hover:${t.ring}`,
        event.featured && 'sm:col-span-2',
      )}
    >
      {/* --- Imagen --- */}
      {event.image_url && !isMinimal && (
        <div
          className={cn(
            'relative overflow-hidden',
            isOverlay
              ? event.featured
                ? 'h-[26rem] sm:h-[30rem]'
                : 'h-72'
              : 'h-52 sm:h-60',
          )}
        >
          <img
            src={event.image_url || '/placeholder.svg'}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
            loading="lazy"
          />
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 bg-gradient-to-t',
              t.overlay,
              isOverlay ? 'via-45%' : 'via-70%',
            )}
            style={{ opacity: event.overlay_opacity / 100 + 0.28 }}
          />

          {/* Contador de días, flotante */}
          <span className="border-border/50 bg-background/60 text-foreground absolute top-4 right-4 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-md">
            {daysUntil(event.starts_at)}
          </span>

          {/* Tags */}
          {event.tags.length > 0 && (
            <ul className="absolute top-4 left-4 flex max-w-[70%] flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <li
                  key={tag}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md',
                    t.accentBorder,
                    t.accentText,
                    'bg-background/40',
                  )}
                  style={accentStyle}
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {/* Título dentro de la imagen solo en layout overlay */}
          {isOverlay && (
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <h3 className="font-serif text-3xl leading-tight font-semibold text-balance sm:text-4xl">
                {event.title}
              </h3>
              {event.subtitle && (
                <p className="text-foreground/75 mt-1.5 text-sm sm:text-base">
                  {event.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- Cuerpo --- */}
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        {!isOverlay && (
          <div>
            {isMinimal && event.tags.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <li
                    key={tag}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase',
                      t.accentBorder,
                      t.accentText,
                    )}
                    style={accentStyle}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="font-serif text-2xl leading-tight font-semibold text-balance sm:text-3xl">
              {event.title}
            </h3>
            {event.subtitle && (
              <p className={cn('mt-1 text-sm font-medium', t.accentText)} style={accentStyle}>
                {event.subtitle}
              </p>
            )}
          </div>
        )}

        {event.description && (
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            {event.description}
          </p>
        )}

        <dl className="grid gap-2.5 text-sm">
          <div className="flex items-center gap-2.5">
            <CalendarDays
              className={cn('h-4 w-4 shrink-0', t.accentText)}
              style={accentStyle}
            />
            <dd className="text-foreground/85 capitalize">
              {formatDate(event.starts_at)}
            </dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock
              className={cn('h-4 w-4 shrink-0', t.accentText)}
              style={accentStyle}
            />
            <dd className="text-foreground/85">
              {formatTime(event.starts_at)} hs
            </dd>
          </div>
          {event.location && (
            <div className="flex items-center gap-2.5">
              <MapPin
                className={cn('h-4 w-4 shrink-0', t.accentText)}
                style={accentStyle}
              />
              <dd className="text-foreground/85">{event.location}</dd>
            </div>
          )}
          {event.price_label && (
            <div className="flex items-center gap-2.5">
              <Ticket
                className={cn('h-4 w-4 shrink-0', t.accentText)}
                style={accentStyle}
              />
              <dd className="text-foreground/85 font-medium">
                {event.price_label}
              </dd>
            </div>
          )}
        </dl>

        {/** Si el evento es gratuito abrimos el diálogo interno, si no usamos la URL o botón normal */}
        {event.is_free ? (
          <>
            <Button
              className={cn(ctaClassName, t.accentBg)}
              style={ctaStyle}
              onClick={() => setOpen(true)}
            >
              {event.cta_label ?? 'Reservar lugar'}
            </Button>
            <FreeAttendanceDialog
              eventId={event.id}
              eventTitle={event.title}
              open={open}
              onOpenChange={setOpen}
            />
          </>
        ) : event.price_amount ? (
          <>
            <Button
              className={cn(ctaClassName, t.accentBg)}
              style={ctaStyle}
              onClick={() => setOpen(true)}
            >
              {event.cta_label ?? 'Comprar entrada'}
            </Button>
            <PaidAttendanceDialog
              eventId={event.id}
              eventTitle={event.title}
              amount={event.price_amount}
              open={open}
              onOpenChange={setOpen}
            />
          </>
        ) : event.cta_url ? (
          <a
            href={event.cta_url}
            target="_blank"
            rel="noreferrer"
            className={cn(ctaClassName, t.accentBg)}
            style={ctaStyle}
          >
            {event.cta_label ?? 'Más información'}
          </a>
        ) : (
          <Button
            className={cn(ctaClassName, t.accentBg)}
            style={ctaStyle}
          >
            {event.cta_label ?? 'Más información'}
          </Button>
        )}
      </div>
    </article>
  )
}

