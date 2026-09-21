'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import { useLiveConfig } from '@/components/use-live-config'
import { isStreamReady, type LiveConfig } from '@/lib/live'

/**
 * Ocupa el lugar del "próximo evento" en el hero cuando hay transmisión.
 *
 * Recibe ya renderizada la tarjeta del próximo evento (`children`, armada en el
 * servidor) y decide cuál mostrar. Así el hero sigue saliendo del servidor y
 * esto es solo el interruptor.
 */
export function LiveHeroSlot({
  initial,
  children,
}: {
  initial: LiveConfig
  children: ReactNode
}) {
  const config = useLiveConfig(initial)

  if (!isStreamReady(config)) return <>{children}</>

  return (
    <Link
      href="/vivo"
      className="animate-enter-up border-accent/60 bg-background/80 hover:border-accent group block rounded-3xl border p-3 shadow-[0_20px_60px_-30px_oklch(0_0_0/0.95)] backdrop-blur-xl transition-colors sm:p-4"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="bg-accent text-accent-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16">
          <Radio className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-accent flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase">
            <span className="bg-accent animate-soft-pulse h-2 w-2 rounded-full" />
            En vivo ahora
          </p>
          <p className="mt-1 line-clamp-2 font-serif text-lg leading-tight font-semibold sm:text-xl">
            {config.title}
          </p>
          {config.subtitle && (
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs sm:text-sm">
              {config.subtitle}
            </p>
          )}
        </div>

        <span className="bg-accent text-accent-foreground inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-transform group-hover:scale-[1.03] group-active:scale-95 sm:h-12 sm:px-6 sm:text-[15px]">
          Ver
        </span>
      </div>
    </Link>
  )
}
