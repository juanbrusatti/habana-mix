'use client'

import { CalendarClock, GraduationCap, Timer, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCardTheme } from '@/lib/card-theme'
import type { DanceClass } from '@/lib/types'
import { cn } from '@/lib/utils'

const levelLabel: Record<DanceClass['level'], string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  todos: 'Todos los niveles',
}

export function ClassCard({
  danceClass: c,
  onEnroll,
}: {
  danceClass: DanceClass
  onEnroll: (c: DanceClass) => void
}) {
  const t = getCardTheme(c.theme)
  const accentStyle = c.accent_color ? { color: c.accent_color } : undefined
  const almostFull =
    c.spots_left !== null && c.capacity !== null && c.spots_left <= c.capacity * 0.25

  return (
    <article
      className={cn(
        'group border-border/60 bg-card relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-500',
        'hover:-translate-y-1',
        t.glow,
        c.featured && 'sm:col-span-2 sm:flex-row',
      )}
    >
      {c.image_url && c.layout !== 'minimal' && (
        <div
          className={cn(
            'relative overflow-hidden',
            c.featured ? 'h-56 sm:h-auto sm:w-[42%]' : 'h-48',
          )}
        >
          <img
            src={c.image_url || '/placeholder.svg'}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
            loading="lazy"
          />
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 bg-gradient-to-t via-65%',
              t.overlay,
              c.featured && 'sm:bg-gradient-to-r',
            )}
            style={{ opacity: c.overlay_opacity / 100 + 0.2 }}
          />
          <span
            className={cn(
              'absolute top-4 left-4 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md',
              t.accentBorder,
              t.accentText,
              'bg-background/45',
            )}
            style={accentStyle}
          >
            {levelLabel[c.level]}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <p
            className={cn('text-[11px] font-semibold tracking-[0.18em] uppercase', t.accentText)}
            style={accentStyle}
          >
            {c.style}
          </p>
          <h3 className="mt-1.5 font-serif text-2xl leading-tight font-semibold text-balance sm:text-3xl">
            {c.title}
          </h3>
        </div>

        {c.description && (
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            {c.description}
          </p>
        )}

        {c.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {c.tags.map((tag) => (
              <li
                key={tag}
                className="border-border/70 bg-muted/40 text-foreground/70 rounded-full border px-2.5 py-1 text-[11px] font-medium"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <dl className="border-border/50 grid gap-2.5 border-t pt-4 text-sm">
          <div className="flex items-start gap-2.5">
            <CalendarClock
              className={cn('mt-0.5 h-4 w-4 shrink-0', t.accentText)}
              style={accentStyle}
            />
            <dd className="text-foreground/85">{c.schedule.join(' · ')}</dd>
          </div>
          {c.instructor && (
            <div className="flex items-center gap-2.5">
              <UserRound
                className={cn('h-4 w-4 shrink-0', t.accentText)}
                style={accentStyle}
              />
              <dd className="text-foreground/85">{c.instructor}</dd>
            </div>
          )}
          {c.duration_min && (
            <div className="flex items-center gap-2.5">
              <Timer
                className={cn('h-4 w-4 shrink-0', t.accentText)}
                style={accentStyle}
              />
              <dd className="text-foreground/85">{c.duration_min} minutos</dd>
            </div>
          )}
          {c.spots_left !== null && (
            <div className="flex items-center gap-2.5">
              <GraduationCap
                className={cn('h-4 w-4 shrink-0', t.accentText)}
                style={accentStyle}
              />
              <dd
                className={cn(
                  'text-foreground/85',
                  almostFull && 'text-accent font-semibold',
                )}
              >
                {almostFull
                  ? `¡Solo ${c.spots_left} lugares!`
                  : `${c.spots_left} lugares disponibles`}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4 pt-2">
          <p className="leading-none">
            <span className="font-serif text-3xl font-semibold">
              ${Number(c.price_amount).toLocaleString('es-ES')}
            </span>
            {c.price_period && (
              <span className="text-muted-foreground ml-1 text-sm">
                /{c.price_period}
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={() => onEnroll(c)}
          className={cn(
            'h-12 w-full rounded-full text-[15px] font-semibold transition-all duration-300 active:scale-[0.97]',
            t.accentBg,
          )}
          style={
            c.accent_color
              ? { backgroundColor: c.accent_color, color: '#1b1410' }
              : undefined
          }
        >
          Inscribirme
        </Button>
      </div>
    </article>
  )
}
