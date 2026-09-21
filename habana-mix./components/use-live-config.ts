'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { defaultLive, type LiveConfig } from '@/lib/live'

/** Cada cuánto se vuelve a preguntar si el vivo sigue encendido. */
const POLL_MS = 45_000

/**
 * Mantiene al día el estado del vivo.
 *
 * Se consulta por sondeo y no por Realtime a propósito: Realtime del plan
 * gratuito topea en 200 conexiones concurrentes, y acá el dato es un booleano
 * que cambia dos veces por evento. Sondear cada 45 s no tiene tope de
 * espectadores, no necesita tocar la publicación ni las políticas de la tabla,
 * y una respuesta pesa unos pocos cientos de bytes.
 *
 * Las pestañas en segundo plano no consultan, y al volver a primer plano se
 * refresca en el acto.
 */
export function useLiveConfig(initial: LiveConfig): LiveConfig {
  const [config, setConfig] = useState<LiveConfig>(initial)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const { data, error } = await supabase.rpc('get_live_config')
        if (error || !data || cancelled) return
        setConfig({ ...defaultLive, ...(data as object) } as LiveConfig)
      } catch {
        // Sin conexión: se conserva el último estado conocido.
      }
    }

    // La home se sirve con ISR de 30 s, así que el valor inicial puede venir
    // con algo de atraso: una consulta al montar lo pone al día enseguida.
    void load()

    const interval = window.setInterval(load, POLL_MS)
    document.addEventListener('visibilitychange', load)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', load)
    }
  }, [])

  return config
}

/** Host real del navegador: Twitch lo exige como `parent` del iframe. */
export function useEmbedHost(): string {
  const [host, setHost] = useState('')
  useEffect(() => setHost(window.location.hostname), [])
  return host
}
