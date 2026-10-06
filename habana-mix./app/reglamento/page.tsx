import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, FileText, Maximize2, Ticket } from 'lucide-react'
import { CompetitionInfoLogos } from '@/components/competition-info-logos'
import { Reveal } from '@/components/reveal'
import { competitionInfo } from '@/lib/competition-info'

// COMPETENCIA TEMPORAL — ver lib/competition-info.ts para sacarla.

export const metadata = {
  title: 'Competencia: categorías y reglamentos | Habana Mix',
  description: competitionInfo.intro,
}

export default function CompetitionInfoPage() {
  if (!competitionInfo.enabled) notFound()

  const eventHref = `/evento/${competitionInfo.eventSlugs[0]}`

  return (
    <div className="bg-background text-foreground min-h-screen pb-16">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Link>
          <p className="flex-1 text-center font-serif text-lg font-semibold">
            Habana<span className="text-primary">Mix</span>
          </p>
          <span className="w-14" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-14 px-4 pt-10 sm:px-8 sm:pt-14">
        {/* Encabezado */}
        <section className="animate-enter-up">
          <div className="flex items-center gap-3">
            <span className="bg-primary h-px w-6 sm:w-8" />
            <span className="text-primary text-[11px] font-semibold tracking-[0.24em] uppercase">
              Social de colores
            </span>
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            {competitionInfo.title}
          </h1>
          <p className="text-primary mt-2 font-serif text-xl sm:text-2xl">{competitionInfo.subtitle}</p>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
            {competitionInfo.intro}
          </p>
          <CompetitionInfoLogos className="mt-8" />
        </section>

        {/* Categorías */}
        <section aria-labelledby="categorias-title">
          <h2 id="categorias-title" className="font-serif text-2xl font-semibold sm:text-3xl">
            Categorías en competencia
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Tocá una imagen para verla completa.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {competitionInfo.categories.map((category, index) => (
              <Reveal key={category.name} delay={index * 80}>
                <a
                  href={category.image}
                  target="_blank"
                  rel="noreferrer"
                  className="group border-border/50 bg-card card-lift hover:border-primary/35 block overflow-hidden rounded-3xl border hover:-translate-y-1"
                >
                  <div className="bg-muted relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={category.image}
                      alt={`Categorías de ${category.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 330px"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <span className="absolute right-3 bottom-3 rounded-full bg-black/60 p-2 text-white backdrop-blur-md">
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <p className="font-serif text-xl font-semibold">{category.name}</p>
                    <p className="text-muted-foreground text-sm">{category.count} categorías</p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Reglamentos */}
        <section aria-labelledby="reglamentos-title">
          <h2 id="reglamentos-title" className="font-serif text-2xl font-semibold sm:text-3xl">
            Reglamentos
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Edades, niveles, vestuario, música, tiempos y todo lo que se evalúa.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {competitionInfo.documents.map((doc) => (
              <div
                key={doc.file}
                className="border-border/60 bg-card flex flex-col gap-4 rounded-3xl border p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="bg-primary/12 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-serif text-lg leading-tight font-semibold">{doc.title}</p>
                    <p className="text-muted-foreground text-sm">{doc.organization}</p>
                    <p className="text-muted-foreground/80 mt-1 text-xs">
                      PDF · {doc.pages} páginas · {doc.size}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                  <a
                    href={doc.file}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-transform active:scale-[0.97] sm:flex-1"
                  >
                    <FileText className="h-4 w-4" />
                    Ver reglamento
                  </a>
                  <a
                    href={doc.file}
                    download
                    className="border-border/70 hover:bg-secondary inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-transform active:scale-[0.97]"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vuelta al evento (solo un link: la compra sigue en la página del evento) */}
        <section className="border-primary/30 bg-primary/10 flex flex-col items-start gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="font-serif text-2xl font-semibold">¿Ya tenés tu entrada?</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Fecha, lugar y entradas de la Social de colores.
            </p>
          </div>
          <Link
            href={eventHref}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-transform active:scale-[0.97]"
          >
            <Ticket className="h-4 w-4" />
            Ver el evento
          </Link>
        </section>
      </main>
    </div>
  )
}
