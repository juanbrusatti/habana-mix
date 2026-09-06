import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { SmartImage } from '@/components/smart-image'
import type { AboutConfig } from '@/lib/site-content'

/** Server Component: la config llega resuelta desde la página, sin spinner. */
export function AboutSection({ config }: { config: AboutConfig }) {
  return (
    <section
      id="nosotros"
      aria-labelledby="nosotros-title"
      className="border-border/50 bg-card/25 relative scroll-mt-20 overflow-hidden border-y px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.52_0.2_27/0.16),transparent_70%)]"
      />

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <Reveal className="group relative order-1 lg:order-2">
            <div className="border-border/60 relative h-[300px] overflow-hidden rounded-3xl border sm:h-[440px]">
              <SmartImage
                src={config.image_url}
                alt="Clase de baile en la academia Habana Mix"
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
              />
              <div
                aria-hidden
                className="from-background/55 absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
              />
            </div>
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

          <div className="order-2 lg:order-1">
            <SectionHeading eyebrow={config.eyebrow} title={config.title} />
            <h2 id="nosotros-title" className="sr-only">
              {config.title}
            </h2>

            <div className="mt-5 flex flex-col gap-4">
              {config.paragraphs?.map((paragraph, index) => (
                <Reveal key={paragraph} delay={index * 80}>
                  <p className="text-muted-foreground text-[15px] leading-relaxed text-pretty sm:text-base">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal
              delay={180}
              className="border-border/60 mt-9 grid grid-cols-2 gap-x-4 gap-y-6 border-t pt-7 sm:grid-cols-4"
            >
              {config.stats?.map((stat) => (
                <div key={stat.label}>
                  <p className="text-gradient-habana font-serif text-3xl leading-none font-semibold sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-snug">{stat.label}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
