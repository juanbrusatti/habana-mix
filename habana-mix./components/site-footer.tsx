import { Mail } from 'lucide-react'
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from '@/components/brand-icons'
import { Reveal } from '@/components/reveal'
import type { FooterConfig, LocationConfig } from '@/lib/site-content'

const socialIcons: Record<string, typeof InstagramIcon> = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  YouTube: YouTubeIcon,
}

/**
 * Server Component. Antes pedía su propia config Y la ubicación, con lo cual
 * `get_location_config` se consultaba dos veces por visita (una acá y otra en
 * la sección de ubicación). Ahora ambas llegan por props, resueltas una vez.
 */
export function SiteFooter({
  config,
  location,
}: {
  config: FooterConfig
  location: LocationConfig
}) {
  const address = [location.street, location.street_number, location.apartment]
    .filter(Boolean)
    .join(', ')
  const city = [location.city, location.state, location.country].filter(Boolean).join(', ')

  return (
    <footer className="relative overflow-hidden px-5 pt-16 pb-8 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(70%_100%_at_50%_0%,oklch(0.91_0.17_100/0.07),transparent_70%)]"
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
              {config.socials?.map((social) => {
                const Icon = socialIcons[social.label.split(' ')[0]] || InstagramIcon
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="border-border/70 bg-card text-foreground/70 hover:border-primary/50 hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 active:scale-90"
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {config.nav_groups?.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
                {group.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.links?.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                    >
                      {link.label}
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
              <li>{address}</li>
              <li>{city}</li>
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

            {/* Soporte post-compra: acá, y no encima del botón de comprar. */}
            <a
              href="https://wa.me/5493584178955?text=Hola,%20tengo%20problemas%20con%20mi%20entrada.%20%C2%BFPodr%C3%ADan%20ayudarme?"
              target="_blank"
              rel="noreferrer"
              className="border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              ¿Problemas con tu entrada o tu QR?
            </a>
          </div>
        </Reveal>

        <div className="border-border/60 mt-12 flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Habana Mix. Todos los derechos reservados.
          </p>
          <p className="text-muted-foreground/70 text-xs">{config.copyright_text}</p>
        </div>
      </div>
    </footer>
  )
}
