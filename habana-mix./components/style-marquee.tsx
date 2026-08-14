const styles = [
  'Salsa Cubana',
  'Timba',
  'Bachata',
  'Rueda de Casino',
  'Son',
  'Afro-Cubano',
  'Ladies Style',
  'Cha Cha Chá',
]

/** Banda infinita que separa el hero de la agenda. Puro CSS, cero JS. */
export function StyleMarquee() {
  const items = [...styles, ...styles]

  return (
    <div
      aria-hidden
      className="border-border/50 bg-card/40 relative flex overflow-hidden border-y py-4 select-none"
    >
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
        {items.map((s, i) => (
          <span key={i} className="flex shrink-0 items-center gap-8">
            <span className="text-foreground/45 font-serif text-lg whitespace-nowrap sm:text-xl">
              {s}
            </span>
            <span className="bg-primary/60 h-1.5 w-1.5 shrink-0 rounded-full" />
          </span>
        ))}
      </div>
      {/* Máscaras laterales para un fundido premium */}
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent" />
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent" />
    </div>
  )
}
