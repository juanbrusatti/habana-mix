import Link from 'next/link'
import { ArrowRight, Trophy } from 'lucide-react'
import { competitionInfo } from '@/lib/competition-info'

// COMPETENCIA TEMPORAL — ver lib/competition-info.ts para sacarla.

/** Acceso a la competencia dentro de la página del evento. Solo es un link. */
export function CompetitionInfoBlock() {
  return (
    <Link
      href={competitionInfo.href}
      className="group border-border/60 bg-card hover:border-primary/40 flex items-center gap-3 rounded-3xl border p-4 transition-colors sm:p-5"
    >
      <span className="bg-primary/12 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
        <Trophy className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Este evento tiene competencia</span>
        <span className="text-muted-foreground block text-sm">
          Mirá las categorías y descargá los reglamentos
        </span>
      </span>
      <ArrowRight className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
