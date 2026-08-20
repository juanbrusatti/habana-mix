'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface HeroConfig {
  badge_text: string
  title: string
  subtitle: string
  image_url: string
  title_color: string
  subtitle_color: string
  badge_color: string
  badge_text_color: string
  title_size: string
  subtitle_size: string
}

const defaultConfig: HeroConfig = {
  badge_text: 'Academia de baile cubano',
  title: 'Habana Mix',
  subtitle: 'Donde el sabor de La Habana se aprende bailando. Salsa cubana, timba, bachata y rueda de casino.',
  image_url: '/images/hero-habana.png',
  title_color: '#ffffff',
  subtitle_color: 'rgba(255,255,255,0.7)',
  badge_color: 'rgba(255,255,255,0.1)',
  badge_text_color: '#ffffff',
  title_size: 'text-9xl',
  subtitle_size: 'text-lg'
}

/**
 * Hero con parallax multicapa.
 *
 * Para usar tu video: dejá el mp4 en /public/videos/habana.mp4 y descomentá el
 * bloque <video>. La imagen queda automáticamente como poster/fallback.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)
  const [config, setConfig] = useState<HeroConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_hero_config')
      if (error) {
        console.error('Error cargando configuración del hero:', error)
        return
      }
      if (data) {
        setConfig(data as HeroConfig)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <header className="relative isolate flex h-[100svh] min-h-[560px] w-full items-end overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-muted" />
        <div className="relative z-10 w-full px-6 pb-16 sm:px-8 md:pb-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </header>
    )
  }

  const getTailwindSize = (size: string) => {
    const sizeMap: Record<string, string> = {
      'text-6xl': 'text-6xl',
      'text-7xl': 'text-7xl', 
      'text-8xl': 'text-8xl',
      'text-9xl': 'text-9xl',
      'text-sm': 'text-sm',
      'text-base': 'text-base',
      'text-lg': 'text-lg',
      'text-xl': 'text-xl'
    }
    return sizeMap[size] || size
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
          src={config.image_url}
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
          <span 
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium tracking-[0.22em] uppercase backdrop-blur-md"
            style={{
              backgroundColor: config.badge_color,
              borderColor: config.badge_text_color + '30',
              color: config.badge_text_color
            }}
          >
            {config.badge_text}
          </span>

          <h1 
            className={`font-serif leading-[0.88] font-semibold tracking-tight text-balance sm:text-7xl md:text-8xl ${getTailwindSize(config.title_size)}`}
            style={{ color: config.title_color }}
          >
            {config.title}
          </h1>

          <p 
            className={`mt-5 max-w-md leading-relaxed text-pretty sm:max-w-lg ${getTailwindSize(config.subtitle_size)}`}
            style={{ color: config.subtitle_color }}
          >
            {config.subtitle}
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById('eventos')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-13 rounded-full text-[15px] font-semibold shadow-[0_18px_45px_-18px_oklch(0.79_0.152_68/0.7)] transition-all duration-300 active:scale-[0.97] sm:px-9"
            >
              Ver eventos
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
