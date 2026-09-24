/**
 * Link de fotos del evento.
 *
 * Las fotos viven en Google Drive (o Google Fotos): acá solo se guarda el link,
 * así que no se usa storage de Supabase ni ancho de banda de Vercel.
 */

const GOOGLE_HOSTS = ['drive.google.com', 'photos.google.com', 'photos.app.goo.gl', 'docs.google.com']

export type PhotosUrlCheck =
  | { ok: true; url: string; isGoogle: boolean }
  | { ok: false; error: string }

/** Valida lo que pega el admin. Vacío es válido: significa "sacar el link". */
export function checkPhotosUrl(raw: string): PhotosUrlCheck {
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
