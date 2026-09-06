import { ExternalLink, MapPin } from 'lucide-react'
import { WhatsAppIcon } from '@/components/brand-icons'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import type { LocationConfig } from '@/lib/site-content'

/** Server Component: la config llega resuelta desde la página, sin spinner. */
export function LocationSection({ config }: { config: LocationConfig }) {
  const address = [
    config.street,
    config.street_number,
    config.apartment,
    config.city,
    config.state,
  ]
    .filter(Boolean)
    .join(', ')

  const encoded = encodeURIComponent(address)
  const embedUrl = `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  const linkUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`

  return (
    <section
      id="como-llegar"
      aria-labelledby="como-llegar-title"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-28"
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
          <Reveal className="border-border/60 bg-card relative overflow-hidden rounded-3xl border">
            <iframe
              title="Mapa de la ubicación de Habana Mix"
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[300px] w-full border-0 grayscale-[35%] transition-all duration-700 hover:grayscale-0 sm:h-[420px]"
            />
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="border-border/70 bg-background/85 text-foreground hover:bg-background absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition-transform duration-300 active:scale-95"
            >
              Abrir en Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Reveal>

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
                {config.hours?.map((hour) => (
                  <div key={hour.label} className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{hour.label}</dt>
                    <dd className="text-foreground font-medium tabular-nums">{hour.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-border/60 mt-auto flex flex-col gap-2.5 border-t pt-5">
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97]"
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
