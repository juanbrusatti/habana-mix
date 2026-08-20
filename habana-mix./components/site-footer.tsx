'use client'

import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from '@/components/brand-icons'
import { Reveal } from '@/components/reveal'
import { supabase } from '@/lib/supabase'

interface NavLink {
  label: string
  href: string
}

interface NavGroup {
  title: string
  links: NavLink[]
}

interface Social {
  label: string
  href: string
}

interface FooterConfig {
  description: string
  email: string
  copyright_text: string
  nav_groups: NavGroup[]
  socials: Social[]
}

interface LocationConfig {
  street: string
  street_number: string
  apartment: string
  city: string
  state: string
  country: string
}

const defaultConfig: FooterConfig = {
  description: 'Salsa cubana, timba y bachata con el sabor de La Habana. Más que una academia: una comunidad.',
  email: 'hola@habanamix.com',
  copyright_text: 'Hecho con sabor cubano',
  nav_groups: [
    {
      title: 'La academia',
      links: [
        { label: 'Próximos eventos', href: '#eventos' },
        { label: 'Quiénes somos', href: '#nosotros' },
        { label: 'Cómo llegar', href: '#como-llegar' }
      ]
    }
  ],
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'YouTube', href: 'https://youtube.com' }
  ]
}

const defaultLocation: LocationConfig = {
  street: 'Av. del Malecón',
  street_number: '1245',
  apartment: 'Local 3',
  city: 'Palermo',
  state: 'Buenos Aires',
  country: 'Argentina'
}

const socialIcons: Record<string, any> = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  YouTube: YouTubeIcon,
}

export function SiteFooter() {
  const [config, setConfig] = useState<FooterConfig>(defaultConfig)
  const [location, setLocation] = useState<LocationConfig>(defaultLocation)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const [footerData, locationData] = await Promise.all([
        supabase.rpc('get_footer_config'),
        supabase.rpc('get_location_config')
      ])

      if (footerData.data) {
        setConfig(footerData.data as FooterConfig)
      }

      if (locationData.data) {
        setLocation(locationData.data as LocationConfig)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = () => {
    const parts = [location.street, location.street_number]
    if (location.apartment) parts.push(location.apartment)
    return parts.join(', ')
  }

  const formatCity = () => {
    const parts = [location.city, location.state]
    if (location.country) parts.push(location.country)
    return parts.join(', ')
  }

  const getSocialIcon = (label: string) => {
    const iconKey = label.split(' ')[0] // Obtiene "Instagram" de "Instagram"
    return socialIcons[iconKey] || InstagramIcon
  }

  return (
    <footer className="relative overflow-hidden px-5 pt-16 pb-8 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(70%_100%_at_50%_0%,oklch(0.79_0.152_68/0.09),transparent_70%)]"
      />

      <div className="mx-auto max-w-6xl">
        <Reveal className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-serif text-3xl font-semibold tracking-tight">
              <span className="text-gradient-habana">Habana</span>{' '}
              <span className="text-foreground">Mix</span>
            </p>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed text-pretty">
              {config.description}
            </p>

            <ul className="mt-5 flex gap-2.5">
              {config.socials.map((s) => {
                const Icon = getSocialIcon(s.label)
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      className="border-border/70 bg-card text-foreground/70 hover:border-primary/50 hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 active:scale-90"
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {config.nav_groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
                {group.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
              Contacto
            </p>
            <ul className="text-muted-foreground mt-4 flex flex-col gap-2.5 text-sm">
              <li>{formatAddress()}</li>
              <li>{formatCity()}</li>
              <li>
                <a
                  href={`mailto:${config.email}`}
                  className="hover:text-foreground inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {config.email}
                </a>
              </li>
            </ul>
          </div>
        </Reveal>

        <div className="border-border/60 mt-12 flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Habana Mix. Todos los derechos
            reservados.
          </p>
          <p className="text-muted-foreground/70 text-xs">
            {config.copyright_text}
          </p>
        </div>
      </div>
    </footer>
  )
}
