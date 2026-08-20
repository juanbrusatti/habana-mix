import { Reveal } from '@/components/reveal'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  className?: string
  align?: 'left' | 'center'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = 'left',
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        'flex flex-col',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="bg-primary h-px w-6 sm:w-8" />
        <span className="text-primary text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-3 font-serif text-3xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-4 max-w-xl text-base leading-relaxed text-pretty',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  )
}
