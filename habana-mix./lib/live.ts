/**
 * Helpers de la transmisión en vivo.
 *
 * El video nunca pasa por nuestro servidor: se arma la URL del reproductor del
 * proveedor y el stream viaja de su CDN al espectador. Vercel solo sirve el
 * HTML, así que esto no consume ancho de banda del plan gratuito.
 */

export type LiveProvider = 'twitch' | 'youtube'

export interface LiveConfig {
  is_live: boolean
  provider: LiveProvider
  channel: string
  title: string
  subtitle: string
  show_chat: boolean
  started_at: string | null
}

export const defaultLive: LiveConfig = {
  is_live: false,
  provider: 'twitch',
  channel: '',
  title: 'Transmisión en vivo',
  subtitle: 'Estamos transmitiendo ahora mismo.',
  show_chat: true,
  started_at: null,
}

/**
 * Acepta lo que el admin tenga a mano y lo deja en el identificador que el
 * reproductor necesita: el nombre del canal en Twitch, el id del video en
 * YouTube. Así da igual si pegan el link completo o solo el nombre.
 */
export function normalizeChannel(raw: string, provider: LiveProvider): string {
  const value = String(raw || '').trim()
  if (!value) return ''

  if (provider === 'twitch') {
    // habanamix · twitch.tv/habanamix · https://www.twitch.tv/habanamix?foo=1
    const match = value.match(/twitch\.tv\/([^/?#\s]+)/i)
    const channel = match ? match[1] : value
    return channel.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
  }

  // YouTube: youtu.be/ID · watch?v=ID · /live/ID · /embed/ID · ID pelado
  const patterns = [
    /[?&]v=([\w-]{6,})/i,
    /youtu\.be\/([\w-]{6,})/i,
    /\/live\/([\w-]{6,})/i,
    /\/embed\/([\w-]{6,})/i,
  ]
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }
  return value.replace(/[^\w-]/g, '')
}

/**
 * Twitch exige que `parent` sea el dominio que muestra el iframe, por eso el
 * host se toma en el navegador: así funciona igual en localhost, en los
 * previews de Vercel y en el dominio final, sin configurar nada.
 */
export function buildPlayerUrl(config: LiveConfig, host: string): string | null {
  const channel = normalizeChannel(config.channel, config.provider)
  if (!channel || !host) return null

  if (config.provider === 'twitch') {
    const params = new URLSearchParams({
      channel,
      parent: host,
      autoplay: 'true',
      // Arranca sin sonido porque los navegadores bloquean el autoplay con
      // audio; el espectador lo activa con un toque en el propio reproductor.
      muted: 'true',
    })
    return `https://player.twitch.tv/?${params.toString()}`
  }

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    rel: '0',
    playsinline: '1',
  })
  return `https://www.youtube.com/embed/${channel}?${params.toString()}`
}

export function buildChatUrl(config: LiveConfig, host: string): string | null {
  const channel = normalizeChannel(config.channel, config.provider)
  if (!channel || !host || !config.show_chat) return null

  if (config.provider === 'twitch') {
    return `https://www.twitch.tv/embed/${channel}/chat?parent=${encodeURIComponent(host)}&darkpopout`
  }
  return `https://www.youtube.com/live_chat?v=${channel}&embed_domain=${encodeURIComponent(host)}`
}

/** Link para abrir la transmisión en la plataforma (fallback si el iframe falla). */
export function platformUrl(config: LiveConfig): string | null {
  const channel = normalizeChannel(config.channel, config.provider)
  if (!channel) return null
  return config.provider === 'twitch'
    ? `https://www.twitch.tv/${channel}`
    : `https://www.youtube.com/watch?v=${channel}`
}

/** true solo si además de estar encendido hay un canal cargado. */
export function isStreamReady(config: LiveConfig | null | undefined): boolean {
  if (!config?.is_live) return false
  return Boolean(normalizeChannel(config.channel || '', config.provider || 'twitch'))
}
