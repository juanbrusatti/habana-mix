import { Mail } from 'lucide-react'
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from '@/components/brand-icons'
import { Reveal } from '@/components/reveal'
import { getLocationContent } from '@/lib/data'

const navGroups = [
  {
    title: 'La academia',
    links: [
      { label: 'Próximos eventos', href: '#eventos' },
      { label: 'Nuestras clases', href: '#clases' },
      { label: 'Quiénes somos', href: '#nosotros' },
      { label: 'Cómo llegar', href: '#como-llegar' },
    ],
  },
  {
    title: 'Estilos',
    links: [
      { label: 'Salsa cubana', href: '#clases' },
      { label: 'Bachata', href: '#clases' },
      { label: 'Timba', href: '#clases' },
      { label: 'Rueda de casino', href: '#clases' },
    ],
  },
]

const socials = [
  { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com' },
  { icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com' },
  { icon: YouTubeIcon, label: 'YouTube', href: 'https://youtube.com' },
]

export async function SiteFooter() {
  const loc = await getLocationContent()

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
              Salsa cubana, timba y bachata con el sabor de La Habana. Más que
              una academia: una comunidad.
            </p>

            <ul className="mt-5 flex gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="border-border/70 bg-card text-foreground/70 hover:border-primary/50 hover:text-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 active:scale-90"
                  >
                    <s.icon className="h-4.5 w-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {navGroups.map((group) => (
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
              <li>{loc.address}</li>
              <li>{loc.city}</li>
              <li>
                <a
                  href={`tel:${loc.phone.replace(/\s/g, '')}`}
                  className="hover:text-foreground transition-colors"
                >
                  {loc.phone}
                </a>
              </li>
              <li>
                <a
                  href="mailto:hola@habanamix.com"
                  className="hover:text-foreground inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  hola@habanamix.com
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
            Hecho con sabor cubano
          </p>
        </div>
      </div>
    </footer>
  )
}
