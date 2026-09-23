'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink, Radio } from 'lucide-react'
import { useEmbedHost, useLiveConfig } from '@/components/use-live-config'
import { buildChatUrl, buildPlayerUrl, isStreamReady, platformUrl, type LiveConfig } from '@/lib/live'

/**
 * Página del vivo.
 *
 * El iframe trae el video directo desde la CDN del proveedor: no pasa un solo
 * byte de video por Vercel, así que da igual cuánta gente esté mirando.
 */
export function LiveStage({ initial }: { initial: LiveConfig }) {
  const config = useLiveConfig(initial)
  const host = useEmbedHost()

  const live = isStreamReady(config)
  const playerUrl = live ? buildPlayerUrl(config, host) : null
  const chatUrl = live ? buildChatUrl(config, host) : null
  const external = platformUrl(config)

  if (!live) {
    return (
      <div className="border-border/60 bg-card mx-auto w-full max-w-md rounded-3xl border p-8 text-center">
        <span className="bg-muted text-muted-foreground mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <Radio className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-semibold">No hay transmisión ahora</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Cuando estemos en vivo lo vas a ver acá y en la portada. Mientras tanto, mirá qué se
          viene.
        </p>
        <Link
          href="/#eventos"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 inline-flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition-transform active:scale-[0.98]"
        >
          Ver próximos eventos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <span className="border-accent/40 bg-accent/15 text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
          <span className="bg-accent animate-soft-pulse h-2 w-2 rounded-full" />
          En vivo
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="border-border/60 bg-muted relative aspect-video w-full overflow-hidden rounded-2xl border">
            {playerUrl ? (
              <iframe
                key={playerUrl}
                src={playerUrl}
                title={config.title}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              // host todavía vacío durante el primer render del cliente
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
              </div>
            )}
          </div>

          <div className="mt-4">
            <h1 className="font-serif text-2xl leading-tight font-semibold sm:text-3xl">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">{config.subtitle}</p>
            )}

            <p className="text-muted-foreground mt-3 text-xs">
              El video arranca sin sonido: tocá el ícono de volumen en el reproductor para
              activarlo.
            </p>

            {external && (
              <a
                href={external}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                ¿No carga? Abrilo en {config.provider === 'twitch' ? 'Twitch' : 'YouTube'}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {chatUrl && (
          <div className="border-border/60 bg-card h-[420px] overflow-hidden rounded-2xl border lg:h-auto lg:min-h-[520px]">
            <iframe
              key={chatUrl}
              src={chatUrl}
              title="Chat de la transmisión"
              className="h-full w-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  )
}
