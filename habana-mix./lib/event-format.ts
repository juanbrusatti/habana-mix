import type { AcademyEvent } from '@/lib/types'

/**
 * Formato de eventos, en un solo lugar.
 * Antes estas funciones estaban duplicadas en la card y en el detalle, y ya
 * habían empezado a divergir.
 */

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const shortDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatDateTimeRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return 'Fecha a confirmar'

  const end = endsAt ? new Date(endsAt) : null
  const dateStr = dateFormatter.format(start)
  const startTime = timeFormatter.format(start)

  if (!end || Number.isNaN(end.getTime())) return `${dateStr} · ${startTime}`

  const endTime = timeFormatter.format(end)
  if (start.toDateString() === end.toDateString()) {
    return `${dateStr} · ${startTime} a ${endTime}`
  }
  return `${dateStr} ${startTime} — ${dateFormatter.format(end)} ${endTime}`
}

/** Versión compacta para chips y barras fijas: "sáb 6 sep · 01:00". */
export function formatShortDateTime(startsAt: string) {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return 'A confirmar'
  return `${shortDateFormatter.format(start)} · ${timeFormatter.format(start)}`
}

export function daysUntil(iso: string) {
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return null
  const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000)
  if (diff < 0) return null
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff <= 7) return `En ${diff} días`
  return `En ${Math.ceil(diff / 7)} semanas`
}

/** true cuando el evento ya pasó (usa fin si existe, si no el inicio). */
export function isPastEvent(event: Pick<AcademyEvent, 'starts_at' | 'ends_at'>) {
  const reference = new Date(event.ends_at || event.starts_at)
  if (Number.isNaN(reference.getTime())) return false
  return reference.getTime() < Date.now()
}

/** Urgencia real: hoy o mañana. Se usa para destacar, no para presionar. */
export function isImminent(iso: string) {
  const label = daysUntil(iso)
  return label === 'Hoy' || label === 'Mañana'
}

export function formatPrice(amount: number | null, currency = 'ARS') {
  if (!amount || amount <= 0) return null
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${Math.round(amount).toLocaleString('es-AR')}`
  }
}

/**
 * Qué mostrar como precio.
 * El monto real manda; `price_label` (texto libre del admin) queda como
 * aclaración. Antes, si el admin dejaba la etiqueta vacía, el evento se
 * mostraba sin precio aunque tuviera monto cargado.
 */
export function resolvePrice(event: AcademyEvent) {
  if (event.is_free) {
    return { main: 'Gratis', note: event.price_label || null }
  }
  const formatted = formatPrice(event.price_amount, event.price_currency)
  if (formatted) {
    // Si la etiqueta del admin solo repite el mismo número ("Entrada $18.000"),
    // no la mostramos: el precio ya está arriba y en grande.
    const digits = (value: string) => value.replace(/\D/g, '')
    const labelDigits = digits(event.price_label || '')
    const redundant =
      !event.price_label ||
      (labelDigits.length > 0 && labelDigits === digits(formatted))
    return { main: formatted, note: redundant ? null : event.price_label }
  }
  return { main: event.price_label || 'Consultar', note: null }
}

/** Normaliza tags desde DB (array, string separado por comas o valor raro). */
export function normalizeTags(
  tags: AcademyEvent['tags'] | string | null | undefined,
): string[] {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean)
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

export function eventHref(event: Pick<AcademyEvent, 'slug' | 'id'>) {
  return `/evento/${event.slug || event.id}`
}

/**
 * next/image solo puede optimizar hosts declarados en next.config.
 * Si algún día entra una URL de otro dominio, esto evita que la página
 * explote: se cae a una <img> normal en vez de romper el render.
 */
export function isOptimizableImage(url: string | null | undefined) {
  if (!url) return false
  if (url.startsWith('/')) return true
  try {
    return new URL(url).hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}
