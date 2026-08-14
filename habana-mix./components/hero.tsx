'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Hero con parallax multicapa.
 *
 * Para usar tu video: dejá el mp4 en /public/videos/habana.mp4 y descomentá el
 * bloque <video>. La imagen queda automáticamente como poster/fallback.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const h = window.innerHeight || 1
        // 0 arriba del todo -> 1 cuando el hero salió de pantalla
        setProgress(Math.min(Math.max(window.scrollY / h, 0), 1))
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const scrollToNext = () => {
    document
      .getElementById('eventos')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      ref={sectionRef}
      className="relative isolate flex h-[100svh] min-h-[560px] w-full items-end overflow-hidden"
    >
      {/* Capa 1: media de fondo — se mueve más lento (parallax real) */}
      <div
        className="absolute inset-0 -z-20 will-change-transform"
        style={{
          transform: `translate3d(0, ${progress * 22}%, 0) scale(${1 + progress * 0.06})`,
        }}
      >
        {/*
        <video
          className="h-full w-full object-cover"
          autoPlay muted loop playsInline preload="metadata"
          poster="/images/hero-habana.png"
        >
          <source src="/videos/habana.mp4" type="video/mp4" />
        </video>
        */}
        <img
          src="/images/hero-habana.png"
          alt="Pareja bailando salsa cubana en una calle de La Habana de noche"
          className="animate-ken-burns h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      </div>

      {/* Capa 2: viñeta y degradados para legibilidad */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/25 to-background"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_10%,transparent_25%,oklch(0.16_0.015_40/0.85)_100%)]"
      />

      {/* Capa 3: contenido — se mueve más rápido y se desvanece */}
      <div
        className="relative z-10 w-full px-6 pb-16 will-change-transform sm:px-8 md:pb-24"
        style={{
          transform: `translate3d(0, ${progress * -46}px, 0)`,
          opacity: 1 - progress * 1.25,
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <span className="border-primary/30 bg-primary/10 text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium tracking-[0.22em] uppercase backdrop-blur-md">
            Academia de baile cubano
          </span>

          <h1 className="font-serif text-6xl leading-[0.88] font-semibold tracking-tight text-balance sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="text-gradient-habana">Habana</span>{' '}
            <span className="text-foreground">Mix</span>
          </h1>

          <p className="text-foreground/70 mt-5 max-w-md text-base leading-relaxed text-pretty sm:max-w-lg sm:text-lg">
            Donde el sabor de La Habana se aprende bailando. Salsa cubana,
            timba, bachata y rueda de casino.
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById('clases')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-13 rounded-full text-[15px] font-semibold shadow-[0_18px_45px_-18px_oklch(0.79_0.152_68/0.7)] transition-all duration-300 active:scale-[0.97] sm:px-9"
            >
              Ver clases
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document
                  .getElementById('eventos')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="border-foreground/20 bg-foreground/5 text-foreground hover:bg-foreground/10 h-13 rounded-full text-[15px] font-semibold backdrop-blur-md transition-all duration-300 active:scale-[0.97] sm:px-9"
            >
              Próximos eventos
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Bajar a la sección de eventos"
        className="text-foreground/50 hover:text-foreground focus-visible:ring-ring absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        style={{ opacity: 1 - progress * 2 }}
      >
        <span className="text-[10px] font-medium tracking-[0.3em] uppercase">
          Desliza
        </span>
        <ChevronDown className="animate-scroll-hint h-5 w-5" />
      </button>
    </header>
  )
}
