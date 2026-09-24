/**
 * Álbumes de fotos.
 *
 * Las fotos viven en Google Drive: acá solo se guarda el link, así que no se
 * usa storage de Supabase ni ancho de banda de Vercel.
 */

export interface PhotoAlbum {
  id: string
  title: string
  description: string | null
  /** Fecha del álbum en formato YYYY-MM-DD (sin hora). */
  album_date: string | null
  cover_url: string | null
  drive_url: string
  is_published: boolean
  created_at: string
  updated_at?: string
}

const GOOGLE_HOSTS = ['drive.google.com', 'photos.google.com', 'photos.app.goo.gl', 'docs.google.com']

export type UrlCheck = { ok: true; url: string; isGoogle: boolean } | { ok: false; error: string }

/** Valida un link. Vacío es válido (los campos opcionales se chequean aparte). */
export function checkPhotosUrl(raw: string): UrlCheck {
  const value = String(raw || '').trim()
  if (!value) return { ok: true, url: '', isGoogle: false }

  let parsed: URL
  try {
    parsed = new URL(value.startsWith('http') ? value : `https://${value}`)
  } catch {
    return { ok: false, error: 'Eso no parece un link. Copiá el enlace completo desde Drive.' }
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'El link tiene que empezar con https://' }
  }

  const isGoogle = GOOGLE_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  )
  return { ok: true, url: parsed.toString(), isGoogle }
}

const albumDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  // `album_date` es una fecha sin hora: se interpreta como UTC para que no se
  // corra un día al mostrarla en Argentina (UTC-3).
  timeZone: 'UTC',
})

export function formatAlbumDate(date: string | null | undefined) {
  if (!date) return null
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return albumDateFormatter.format(parsed)
}

export interface AlbumInput {
  title: string
  description: string | null
  album_date: string | null
  cover_url: string | null
  drive_url: string
  is_published: boolean
}

/**
 * Valida y normaliza lo que manda el admin. Se usa en el servidor (la palabra
 * final) y en el formulario (para avisar antes de enviar).
 * Con `partial`, solo valida los campos presentes (para publicar/ocultar).
 */
export function parseAlbumInput(
  body: Record<string, unknown>,
  { partial = false } = {},
): { ok: true; data: Partial<AlbumInput> } | { ok: false; error: string } {
  const data: Partial<AlbumInput> = {}
  const has = (key: string) => !partial || key in body

  if (has('title')) {
    const title = String(body.title ?? '').trim()
    if (!title) return { ok: false, error: 'Poné un título para el álbum' }
    if (title.length > 120) return { ok: false, error: 'El título es demasiado largo' }
    data.title = title
  }

  if (has('drive_url')) {
    const check = checkPhotosUrl(String(body.drive_url ?? ''))
    if (!check.ok) return { ok: false, error: check.error }
    if (!check.url) return { ok: false, error: 'Falta el link de la carpeta de Drive' }
    data.drive_url = check.url
  }

  if (has('cover_url')) {
    const check = checkPhotosUrl(String(body.cover_url ?? ''))
    if (!check.ok) return { ok: false, error: `Portada: ${check.error}` }
    data.cover_url = check.url || null
  }

  if (has('album_date')) {
    const raw = String(body.album_date ?? '').trim()
    if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { ok: false, error: 'La fecha no es válida' }
    }
    data.album_date = raw || null
  }

  if (has('description')) {
    const description = String(body.description ?? '').trim()
    if (description.length > 600) return { ok: false, error: 'La descripción es demasiado larga' }
    data.description = description || null
  }

  if (has('is_published')) {
    data.is_published = body.is_published === undefined ? true : Boolean(body.is_published)
  }

  return { ok: true, data }
}
