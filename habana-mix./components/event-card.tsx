'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Ticket, MessageCircle, ChevronRight } from 'lucide-react'
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

function formatDateTimeRange(startsAt: string, endsAt: string | null) {
  const startDate = new Date(startsAt)
  const endDate = endsAt ? new Date(endsAt) : null

  // Formato de fecha
  const dateStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(startDate)

  // Formato de hora inicio
  const startTimeStr = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(startDate)

  // Si hay hora de fin, mostrar rango
  if (endDate) {
    const endTimeStr = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(endDate)

    // Si es el mismo día
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${dateStr} · ${startTimeStr} - ${endTimeStr}`
    }

    // Si son días diferentes
    const endDateStr = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(endDate)

    return `${dateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`
  }

  // Si no hay hora de fin, solo mostrar inicio
  return `${dateStr} · ${startTimeStr}`
}

function daysUntil(iso: string) {
  const diff = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / 86_400_000,
  )
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `En ${diff} días`
}

/** Normaliza tags desde DB (array, string o valor raro) a lista limpia. */
function normalizeTags(tags: AcademyEvent['tags'] | string | null | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

/**
 * Card de evento controlada por theme, layout, tags, overlay_opacity y accent_color.
 * El botón: gratuito → reserva interna; de pago → MercadoPago.
 */
export function EventCard({ event }: { event: AcademyEvent }) {
  const t = getCardTheme(event.theme)
  const accentStyle = event.accent_color
    ? { color: event.accent_color }
    : undefined

  const [open, setOpen] = useState(false)
  const tags = normalizeTags(event.tags)

  const isOverlay = event.layout === 'overlay'
  const isMinimal = event.layout === 'minimal'

  const ctaClassName =
    'mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-transparent text-[15px] font-semibold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.97]'
  const ctaStyle = event.accent_color
    ? { backgroundColor: event.accent_color, color: '#1b1410' }
    : undefined

  return (
    <article
      className={cn(
        'group border-border/40 bg-card relative overflow-hidden rounded-2xl border transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-border/60',
      )}
    >
      {/* --- Imagen --- */}
      {event.image_url && !isMinimal && (
        <div
          className={cn(
            'relative overflow-hidden',
            isOverlay ? 'h-72' : 'h-52 sm:h-60',
          )}
        >
          <img
            src={event.image_url || '/placeholder.svg'}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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
          {tags.length > 0 && (
            <ul className="absolute top-4 left-4 flex max-w-[70%] flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <li
                  key={`${i}-${tag}`}
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
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <h3 className="font-serif text-2xl leading-tight font-semibold text-balance sm:text-3xl">
                {event.title}
              </h3>
              {event.subtitle && (
                <p className="text-foreground/75 mt-1 text-sm sm:text-base">
                  {event.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- Cuerpo --- */}
      <div className="flex flex-col gap-3.5 p-4 sm:gap-4 sm:p-5">
        {!isOverlay && (
          <div>
            {isMinimal && tags.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <li
                    key={`${i}-${tag}`}
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
            <h3 className="font-serif text-xl leading-tight font-semibold text-balance sm:text-2xl">
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

        <dl className="grid gap-2 text-sm">
          <div className="flex items-center gap-2.5">
            <CalendarDays
              className={cn('h-4 w-4 shrink-0', t.accentText)}
              style={accentStyle}
            />
            <dd className="text-foreground/85">
              {formatDateTimeRange(event.starts_at, event.ends_at)}
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

        <div className="flex flex-col gap-2 pt-1">
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
          ) : (
            <>
              <Button
                className={cn(ctaClassName, t.accentBg)}
                style={ctaStyle}
                onClick={() => setOpen(true)}
                disabled={!event.price_amount}
              >
                {event.cta_label ?? 'Comprar entrada'}
              </Button>
              {event.price_amount ? (
                <PaidAttendanceDialog
                  eventId={event.id}
                  eventTitle={event.title}
                  amount={event.price_amount}
                  open={open}
                  onOpenChange={setOpen}
                />
              ) : null}
            </>
          )}

          <Link
            href={`/evento/${event.slug || event.id}`}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 hover:bg-secondary text-foreground text-[14px] font-medium transition-all duration-200 active:scale-[0.98]"
          >
            <span>Ver detalles</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
        
        {/* Botón de contacto por WhatsApp para problemas con códigos QR */}
        <a
          href={`https://wa.me/5493584178955?text=Hola,%20tengo%20problemas%20con%20mi%20entrada%20para%20${encodeURIComponent(event.title)}.%20¿Podrían%20ayudarme?`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 mt-2 text-xs text-green-600 hover:text-green-700 transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          ¿No te llegó tu código QR? Contactanos
        </a>
      </div>
    </article>
  )
}

