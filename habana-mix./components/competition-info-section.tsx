import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CompetitionInfoLogos } from '@/components/competition-info-logos'
import { Reveal } from '@/components/reveal'
import { competitionInfo } from '@/lib/competition-info'

// COMPETENCIA TEMPORAL — ver lib/competition-info.ts para sacarla.

/** Acceso a la competencia desde la home, justo debajo de los eventos. */
export function CompetitionInfoSection() {
  if (!competitionInfo.enabled) return null

  return (
    <section aria-labelledby="competencia-title" className="px-4 pb-4 sm:px-8">
      <Reveal className="border-primary/30 bg-primary/[0.07] mx-auto max-w-6xl rounded-3xl border p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-primary text-[11px] font-semibold tracking-[0.24em] uppercase">
              Social de colores · {competitionInfo.title}
            </p>
            <h2 id="competencia-title" className="mt-2 font-serif text-3xl leading-tight font-semibold sm:text-4xl">
              {competitionInfo.subtitle}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
              {competitionInfo.intro}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {competitionInfo.categories.map((category) => (
                <li
                  key={category.name}
                  className="border-border/60 bg-background/50 rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {category.name} · {category.count}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5 lg:items-end">
            <CompetitionInfoLogos className="lg:justify-end" />
            <Link
              href={competitionInfo.href}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-transform active:scale-[0.97]"
            >
              Ver categorías y reglamentos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
