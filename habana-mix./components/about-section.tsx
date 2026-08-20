'use client'

import { useState, useEffect } from 'react'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { supabase } from '@/lib/supabase'

interface StatEntry {
  value: string
  label: string
}

interface AboutConfig {
  eyebrow: string
  title: string
  image_url: string
  paragraphs: string[]
  stats: StatEntry[]
  show_badge: boolean
  badge_main_text: string
  badge_sub_text: string
}

const defaultConfig: AboutConfig = {
  eyebrow: 'Quiénes somos',
  title: 'Un pedacito de Cuba en tu ciudad',
  image_url: '/images/about-academia.png',
  paragraphs: [
    'Habana Mix nació de una idea simple: que cualquiera pueda sentir el sabor cubano sin importar de dónde venga ni cuánto haya bailado antes.',
    'Nuestros instructores se formaron en La Habana y llevan más de diez años enseñando salsa cubana, timba, bachata y rueda de casino. Acá no se copian pasos: se aprende a escuchar la música.',
    'Más que una academia, somos una comunidad. Se entra por una clase y se queda por la gente.'
  ],
  stats: [
    { value: '10+', label: 'Años enseñando' },
    { value: '1.200', label: 'Alumnos felices' },
    { value: '4', label: 'Estilos cubanos' },
    { value: '2', label: 'Fiestas al mes' }
  ],
  show_badge: true,
  badge_main_text: '100% cubano',
  badge_sub_text: 'Instructores de La Habana'
}

export function AboutSection() {
  const [config, setConfig] = useState<AboutConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_about_config')
      if (error) {
        console.error('Error cargando configuración de quienes somos:', error)
        return
      }
      if (data) {
        setConfig(data as AboutConfig)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section
        id="nosotros"
        aria-labelledby="nosotros-title"
        className="border-border/50 bg-card/25 relative scroll-mt-16 overflow-hidden border-y px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="nosotros"
      aria-labelledby="nosotros-title"
      className="border-border/50 bg-card/25 relative scroll-mt-16 overflow-hidden border-y px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.11_185/0.13),transparent_70%)]"
      />

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          {/* Imagen con marco y ligero parallax por hover */}
          <Reveal className="group relative order-1 lg:order-2">
            <div className="border-border/60 relative overflow-hidden rounded-3xl border">
              <img
                src={config.image_url || '/placeholder.svg'}
                alt="Clase de baile en la academia Habana Mix"
                className="h-[300px] w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06] sm:h-[440px]"
                loading="lazy"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-transparent"
              />
            </div>
            {/* Sello decorativo */}
            {config.show_badge && (
              <div className="border-border/60 bg-background/85 absolute -bottom-5 left-5 rounded-2xl border px-5 py-3 backdrop-blur-md sm:left-7">
                <p className="text-primary font-serif text-2xl leading-none font-semibold">
                  {config.badge_main_text}
                </p>
                <p className="text-muted-foreground mt-1 text-[11px] tracking-[0.16em] uppercase">
                  {config.badge_sub_text}
                </p>
              </div>
            )}
          </Reveal>

          {/* Texto */}
          <div className="order-2 lg:order-1">
            <SectionHeading eyebrow={config.eyebrow} title={config.title} />
            <h2 id="nosotros-title" className="sr-only">
              {config.title}
            </h2>

            <div className="mt-5 flex flex-col gap-4">
              {config.paragraphs.map((p, i) => (
                <Reveal key={i} delay={i * 90}>
                  <p className="text-muted-foreground text-[15px] leading-relaxed text-pretty sm:text-base">
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal
              delay={200}
              className="border-border/60 mt-9 grid grid-cols-2 gap-x-4 gap-y-6 border-t pt-7 sm:grid-cols-4"
            >
              {config.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-gradient-habana font-serif text-3xl leading-none font-semibold sm:text-4xl">
                    {s.value}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-snug">
                    {s.label}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
