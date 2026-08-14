'use client'

import { useState } from 'react'
import { KeyRound, ShieldCheck, Upload } from 'lucide-react'
import { ClassCard } from '@/components/class-card'
import { EnrollDialog } from '@/components/enroll-dialog'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import type { DanceClass } from '@/lib/types'

const steps = [
  {
    icon: Upload,
    title: 'Subís el comprobante',
    text: 'Elegís tu clase, te registrás y adjuntás la captura de tu pago.',
  },
  {
    icon: ShieldCheck,
    title: 'Lo aprobamos',
    text: 'El equipo verifica el pago desde el panel de administración.',
  },
  {
    icon: KeyRound,
    title: 'Recibís tu código',
    text: 'Un código único que mostrás en recepción para entrar a bailar.',
  },
]

export function ClassesSection({ classes }: { classes: DanceClass[] }) {
  const [selected, setSelected] = useState<DanceClass | null>(null)
  const [open, setOpen] = useState(false)

  const handleEnroll = (c: DanceClass) => {
    setSelected(c)
    setOpen(true)
  }

  return (
    <section
      id="clases"
      aria-labelledby="clases-title"
      className="border-border/50 bg-card/25 relative scroll-mt-16 border-y px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Formación"
          title="Nuestras clases"
          description="Grupos reducidos, progresión clara y mucha práctica en pareja. No necesitás venir acompañado."
        />

        <h2 id="clases-title" className="sr-only">
          Nuestras clases
        </h2>

        {/* Cómo funciona la inscripción */}
        <Reveal
          delay={80}
          className="border-border/60 bg-background/40 mt-10 grid gap-5 rounded-3xl border p-5 sm:mt-12 sm:grid-cols-3 sm:gap-6 sm:p-7"
        >
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3.5">
              <span className="bg-primary/12 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-foreground text-sm font-semibold">
                  <span className="text-primary mr-1.5">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </Reveal>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6">
          {classes.map((c, i) => (
            <Reveal
              key={c.id}
              delay={i * 100}
              className={c.featured ? 'sm:col-span-2' : undefined}
            >
              <ClassCard danceClass={c} onEnroll={handleEnroll} />
            </Reveal>
          ))}
        </div>
      </div>

      <EnrollDialog danceClass={selected} open={open} onOpenChange={setOpen} />
    </section>
  )
}
