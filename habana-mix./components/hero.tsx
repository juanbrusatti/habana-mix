import Link from 'next/link'
import { ArrowRight, CalendarDays, ChevronDown } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { HeroMotion } from '@/components/hero-motion'
import { SmartImage } from '@/components/smart-image'
import { eventHref, formatShortDateTime, isPastEvent, resolvePrice } from '@/lib/event-format'
import type { HeroConfig } from '@/lib/site-content'
import type { AcademyEvent } from '@/lib/types'

/** Tamaños de título permitidos desde el admin, acotados a una escala legible. */
const titleSizes: Record<string, string> = {
  'text-6xl': 'text-5xl sm:text-6xl md:text-7xl',
  'text-7xl': 'text-5xl sm:text-7xl md:text-8xl',
  'text-8xl': 'text-6xl sm:text-8xl md:text-9xl',
  'text-9xl': 'text-6xl sm:text-8xl md:text-9xl',
}

const subtitleSizes: Record<string, string> = {
  'text-sm': 'text-sm sm:text-base',
  'text-base': 'text-base sm:text-lg',
  'text-lg': 'text-base sm:text-lg',
  'text-xl': 'text-lg sm:text-xl',
}

/**
 * Hero. Server Component: la imagen viene en el HTML y el navegador la empieza a
 * bajar de inmediato (antes había que esperar a que ejecutara JS y consultara
 * Supabase para recién descubrir la URL).
 *
 * Además baja de 100svh a 88svh y trae el próximo evento a la primera pantalla:
 * quien entra a comprar ya ve qué hay, cuándo y cuánto sale, sin scrollear.
 */
export function Hero({
  config,
  nextEvent,
}: {
  config: HeroConfig
  nextEvent: AcademyEvent | null
}) {
  const titleClass = titleSizes[config.title_size] || titleSizes['text-6xl']
  const subtitleClass = subtitleSizes[config.subtitle_size] || subtitleSizes['text-base']
  const upcoming = nextEvent && !isPastEvent(nextEvent) ? nextEvent : null
  const price = upcoming ? resolvePrice(upcoming) : null

  return (
    <header
      data-hero
      className="relative isolate flex min-h-[88svh] w-full flex-col justify-end overflow-hidden"
    >
      <HeroMotion />

      <div className="hero-parallax-bg absolute inset-0 -z-20">
        <div className="bg-muted absolute inset-0">
          <SmartImage
            src={config.image_url}
            alt="Habana Mix"
            priority
            sizes="100vw"
            className="animate-ken-burns object-cover object-center"
          />
        </div>
      </div>

      <div
        aria-hidden
        className="from-background/70 via-background/25 to-background absolute inset-0 -z-10 bg-gradient-to-b"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-10%,transparent_20%,oklch(0.155_0.016_45/0.75)_75%)]"
      />

      <div className="hero-parallax-content relative z-10 w-full px-4 pt-24 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <span
            className="animate-enter-up mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-medium tracking-[0.25em] uppercase backdrop-blur-md"
            style={{
              backgroundColor: config.badge_color,
              borderColor: `${config.badge_text_color}25`,
              color: config.badge_text_color,
              animationDelay: '60ms',
            }}
          >
            {config.badge_text}
          </span>

          <h1
            className={`animate-enter-up font-serif leading-[0.92] font-semibold tracking-tight text-balance ${titleClass}`}
            style={{ color: config.title_color, animationDelay: '120ms' }}
          >
            {config.title}
          </h1>

          <p
            className={`animate-enter-up mt-4 max-w-xl leading-relaxed text-pretty ${subtitleClass}`}
            style={{ color: config.subtitle_color, animationDelay: '200ms' }}
          >
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Próximo evento, ya en la primera pantalla. */}
      <div className="relative z-10 w-full px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mx-auto max-w-3xl">
          {upcoming ? (
            <div
              className="animate-enter-up border-border/60 bg-background/75 rounded-3xl border p-3 shadow-[0_20px_60px_-30px_oklch(0_0_0/0.95)] backdrop-blur-xl sm:p-4"
              style={{ animationDelay: '280ms' }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href={eventHref(upcoming)}
                  className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:block"
                  aria-hidden
                  tabIndex={-1}
                >
                  {upcoming.image_url && (
                    <SmartImage
                      src={upcoming.image_url}
                      alt=""
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="text-primary flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase">
                    <CalendarDays className="h-3 w-3" />
                    Próximo evento
                  </p>
                  <Link href={eventHref(upcoming)} className="block">
                    <p className="mt-1 line-clamp-2 font-serif text-lg leading-tight font-semibold sm:text-xl">
                      {upcoming.title}
                    </p>
                  </Link>
                  <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
                    {formatShortDateTime(upcoming.starts_at)}
                    {price ? ` · ${price.main}` : ''}
                  </p>
                </div>

                <div className="w-[7.5rem] shrink-0 sm:w-40">
                  <BuyButton
                    eventId={upcoming.id}
                    eventTitle={upcoming.title}
                    eventDate={upcoming.starts_at}
                    eventLocation={upcoming.location}
                    isFree={upcoming.is_free}
                    priceAmount={upcoming.price_amount}
                    priceLabel={upcoming.price_label}
                    ctaLabel={upcoming.cta_label}
                    compact
                    className="h-11 text-sm sm:h-12 sm:text-[15px]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link
                href="#eventos"
                className="bg-primary text-primary-foreground hover:bg-primary/90 cta-shine inline-flex h-13 items-center gap-2 rounded-full px-8 text-[15px] font-semibold transition-transform duration-200 active:scale-[0.97]"
              >
                Ver eventos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <Link
              href="#eventos"
              className="text-foreground/55 hover:text-foreground flex flex-col items-center gap-1 rounded-full p-2 text-[10px] font-medium tracking-[0.3em] uppercase transition-colors"
            >
              Todos los eventos
              <ChevronDown className="animate-scroll-hint h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
