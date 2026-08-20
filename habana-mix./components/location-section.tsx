'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { WhatsAppIcon } from '@/components/brand-icons'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { supabase } from '@/lib/supabase'

interface HourEntry {
  label: string
  value: string
}

interface LocationConfig {
  title: string
  street: string
  street_number: string
  apartment: string
  city: string
  state: string
  country: string
  postal_code: string
  directions_note: string
  phone: string
  whatsapp: string
  hours: HourEntry[]
}

const defaultConfig: LocationConfig = {
  title: 'Cómo llegar',
  street: 'Av. del Malecón',
  street_number: '1245',
  apartment: 'Local 3',
  city: 'Palermo',
  state: 'Buenos Aires',
  country: 'Argentina',
  postal_code: 'C1414',
  directions_note: 'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  phone: '+54 11 5555 1234',
  whatsapp: '5491155551234',
  hours: [
    { label: 'Lunes a viernes', value: '17:00 – 23:00' },
    { label: 'Sábados', value: '11:00 – 20:00' },
    { label: 'Domingos', value: 'Solo eventos' }
  ]
}

export function LocationSection() {
  const [config, setConfig] = useState<LocationConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_location_config')
      if (error) {
        console.error('Error cargando configuración de ubicación:', error)
        return
      }
      if (data) {
        setConfig(data as LocationConfig)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = () => {
    const parts = [config.street, config.street_number]
    if (config.apartment) parts.push(config.apartment)
    parts.push(config.city)
    parts.push(config.state)
    return parts.join(', ')
  }

  const generateGoogleMapsEmbedUrl = () => {
    const address = formatAddress()
    const encodedAddress = encodeURIComponent(address)
    // Nota: Para usar Google Maps embed necesitas una API key
    // Por ahora usamos la versión gratuita sin API key
    return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }

  const generateGoogleMapsLinkUrl = () => {
    const address = formatAddress()
    const encodedAddress = encodeURIComponent(address)
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  }

  if (loading) {
    return (
      <section
        id="como-llegar"
        aria-labelledby="como-llegar-title"
        className="scroll-mt-16 px-5 py-20 sm:px-8 sm:py-28"
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
      id="como-llegar"
      aria-labelledby="como-llegar-title"
      className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Ubicación"
          title={config.title}
          description={config.directions_note}
        />

        <h2 id="como-llegar-title" className="sr-only">
          Cómo llegar
        </h2>

        <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
          {/* Mapa */}
          <Reveal className="border-border/60 bg-card relative overflow-hidden rounded-3xl border">
            <iframe
              title="Mapa de la ubicación de Habana Mix"
              src={generateGoogleMapsEmbedUrl()}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[300px] w-full border-0 grayscale-[35%] transition-all duration-700 hover:grayscale-0 sm:h-[420px]"
            />
            <a
              href={generateGoogleMapsLinkUrl()}
              target="_blank"
              rel="noreferrer"
              className="border-border/70 bg-background/85 text-foreground hover:bg-background absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition-all duration-300 active:scale-95"
            >
              Abrir en Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Reveal>

          {/* Datos */}
          <Reveal
            delay={120}
            className="border-border/60 bg-card flex flex-col gap-6 rounded-3xl border p-6 sm:p-7"
          >
            <div className="flex gap-3.5">
              <span className="bg-primary/12 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-foreground font-serif text-lg font-semibold">
                  {config.street} {config.street_number}
                  {config.apartment && `, ${config.apartment}`}
                </p>
                <p className="text-muted-foreground text-sm">
                  {config.city}, {config.state}
                  {config.country && `, ${config.country}`}
                </p>
              </div>
            </div>

            <div className="border-border/60 border-t pt-5">
              <p className="text-primary mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase">
                Horarios
              </p>
              <dl className="grid gap-2.5">
                {config.hours.map((h, index) => (
                  <div
                    key={index}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <dt className="text-muted-foreground">{h.label}</dt>
                    <dd className="text-foreground font-medium tabular-nums">
                      {h.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-border/60 mt-auto flex flex-col gap-2.5 border-t pt-5">
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-ring/50 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform outline-none focus-visible:ring-3 active:scale-[0.97]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Escribinos por WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
