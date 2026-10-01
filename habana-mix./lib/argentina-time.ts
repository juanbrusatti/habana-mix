/**
 * Hora argentina, en un solo lugar.
 *
 * Las fechas se guardan en la base en UTC (correcto). El problema era
 * mostrarlas y editarlas:
 *  - Vercel corre en UTC, así que el sitio mostraba "8 nov 02:00" para un
 *    evento del 7 nov a las 23:00.
 *  - El admin cargaba el input con la hora UTC y al guardar la interpretaba
 *    como hora argentina: cada edición corría el evento 3 horas.
 *
 * Todo lo que muestra o edita fechas pasa por acá con la zona fija de
 * Argentina, sin importar dónde corra el código.
 */

export const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires'

/**
 * Argentina no tiene horario de verano desde 2009: está fija en UTC-3.
 * Se usa solo para interpretar lo que el admin escribe en el formulario.
 */
const AR_UTC_OFFSET = '-03:00'

const inputPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: AR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "2026-11-08T02:00:00Z" → "2026-11-07T23:00" (valor para un <input type="datetime-local">). */
export function toArgentinaInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = Object.fromEntries(
    inputPartsFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

/** "2026-11-07T23:00" (lo que escribió el admin, hora argentina) → ISO en UTC para guardar. */
export function fromArgentinaInputValue(value: string | null | undefined): string | null {
  // Solo el formato exacto del input; cualquier otra cosa se descarta.
  const match = String(value || '').match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  if (!match) return null
  const date = new Date(`${match[0]}:00${AR_UTC_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: AR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** true si las dos fechas caen el mismo día en Argentina. */
export function isSameArgentinaDay(a: Date, b: Date) {
  return dayKeyFormatter.format(a) === dayKeyFormatter.format(b)
}
