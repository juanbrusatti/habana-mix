'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  MessageCircle,
  ImageIcon,
  Maximize2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FreeAttendanceDialog } from '@/components/free-attendance-dialog'
import { PaidAttendanceDialog } from '@/components/paid-attendance-dialog'
import type { AcademyEvent, EventSection } from '@/lib/types'
import { getCardTheme } from '@/lib/card-theme'
import { cn } from '@/lib/utils'

interface EventDetailProps {
  event: AcademyEvent
  sections: EventSection[]
}

function formatDateTimeRange(startsAt: string, endsAt: string | null) {
  const startDate = new Date(startsAt)
  const endDate = endsAt ? new Date(endsAt) : null

  const dateStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(startDate)

  const startTimeStr = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(startDate)

  if (endDate) {
    const endTimeStr = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(endDate)

    if (startDate.toDateString() === endDate.toDateString()) {
      return `${dateStr} · ${startTimeStr} - ${endTimeStr}`
    }

    const endDateStr = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(endDate)

    return `${dateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`
  }

  return `${dateStr} · ${startTimeStr}`
}

function daysUntil(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `En ${diff} días`
}

function normalizeTags(tags: AcademyEvent['tags'] | string | null | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

export function EventDetail({ event, sections }: EventDetailProps) {
  const [openAttendance, setOpenAttendance] = useState(false)
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null)

  const theme = getCardTheme(event.theme)
  const tags = normalizeTags(event.tags)
  const accentStyle = event.accent_color ? { color: event.accent_color } : undefined
  const ctaStyle = event.accent_color
    ? { backgroundColor: event.accent_color, color: '#1b1410' }
    : undefined

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Sticky con navegación Mobile First */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/60 transition-all">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href="/#eventos"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Link>

          <h1 className="text-sm sm:text-base font-semibold truncate flex-1 text-center px-2">
            {event.title}
          </h1>

          <div className="w-14 flex justify-end">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {daysUntil(event.starts_at)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {/* Imagen principal de portada */}
        {event.image_url && (
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-border/40 bg-muted">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              priority-img="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Tags flotantes */}
            {tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[80%]">
                {tags.map((tag, i) => (
                  <span
                    key={`${i}-${tag}`}
                    className="rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Título en portada para mobile */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
              <h2 className="text-2xl sm:text-4xl font-bold font-serif leading-tight drop-shadow-sm">
                {event.title}
              </h2>
              {event.subtitle && (
                <p className="text-sm sm:text-base text-white/90 mt-1 font-medium drop-shadow-sm">
                  {event.subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tarjeta de Información y Reserva */}
        <section className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-5 sm:p-7 shadow-sm space-y-5">
          {!event.image_url && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif">{event.title}</h2>
              {event.subtitle && (
                <p className="text-base text-muted-foreground mt-1">{event.subtitle}</p>
              )}
            </div>
          )}

          {event.description && (
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          )}

          {/* Datos rápidos del evento */}
          <div className="grid gap-3 pt-1 border-t border-border/40 text-sm">
            <div className="flex items-center gap-3 text-foreground/90">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CalendarDays className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha y hora</p>
                <p className="font-medium capitalize">{formatDateTimeRange(event.starts_at, event.ends_at)}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-foreground/90">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lugar</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {event.price_label && (
              <div className="flex items-center gap-3 text-foreground/90">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Ticket className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entrada</p>
                  <p className="font-medium">{event.price_label}</p>
                </div>
              </div>
            )}
          </div>

          {/* Botón de acción principal */}
          <div className="pt-2">
            {event.is_free ? (
              <>
                <Button
                  className={cn(
                    'h-12 w-full text-base font-semibold rounded-full shadow-md transition-all active:scale-[0.98]',
                    theme.accentBg
                  )}
                  style={ctaStyle}
                  onClick={() => setOpenAttendance(true)}
                >
                  {event.cta_label ?? 'Reservar lugar'}
                </Button>
                <FreeAttendanceDialog
                  eventId={event.id}
                  eventTitle={event.title}
                  open={openAttendance}
                  onOpenChange={setOpenAttendance}
                />
              </>
            ) : (
              <>
                <Button
                  className={cn(
                    'h-12 w-full text-base font-semibold rounded-full shadow-md transition-all active:scale-[0.98]',
                    theme.accentBg
                  )}
                  style={ctaStyle}
                  onClick={() => setOpenAttendance(true)}
                  disabled={!event.price_amount}
                >
                  {event.cta_label ?? 'Comprar entrada'}
                </Button>
                {event.price_amount ? (
                  <PaidAttendanceDialog
                    eventId={event.id}
                    eventTitle={event.title}
                    amount={event.price_amount}
                    open={openAttendance}
                    onOpenChange={setOpenAttendance}
                  />
                ) : null}
              </>
            )}
          </div>

          {/* Ayuda por WhatsApp */}
          <div className="text-center pt-1">
            <a
              href={`https://wa.me/5493584178955?text=Hola,%20quisiera%20más%20información%20sobre%20${encodeURIComponent(event.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              ¿Dudas o consultas? Escribinos al WhatsApp
            </a>
          </div>
        </section>

        {/* Sección de Galería de Imágenes (Mobile-First) */}
        {sortedSections.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif">
                  Galería de fotos
                </h3>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
                {sortedSections.length} {sortedSections.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            <div className="space-y-6">
              {sortedSections.map((section, idx) => (
                <div
                  key={section.id}
                  className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm transition-all hover:border-border"
                >
                  {/* Foto con tap para ampliar en móvil */}
                  <div
                    className="relative w-full aspect-[4/5] sm:aspect-[16/10] bg-muted overflow-hidden cursor-pointer group"
                    onClick={() => setActiveImagePreview(section.image_url)}
                  >
                    <img
                      src={section.image_url}
                      alt={section.title || `Foto ${idx + 1} del evento`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      loading="lazy"
                    />

                    {/* Botón flotante para ver pantalla completa */}
                    <button
                      type="button"
                      aria-label="Ver imagen completa"
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white opacity-90 transition-opacity hover:opacity-100"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Texto y descripción de la foto si fue cargado */}
                  {(section.title || section.description) && (
                    <div className="p-4 sm:p-5 space-y-1.5">
                      {section.title && (
                        <h4 className="text-base sm:text-lg font-semibold font-serif">
                          {section.title}
                        </h4>
                      )}
                      {section.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {section.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Lightbox para ver la imagen ampliada en pantalla completa */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveImagePreview(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImagePreview(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Cerrar vista previa"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={activeImagePreview}
            alt="Vista ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
