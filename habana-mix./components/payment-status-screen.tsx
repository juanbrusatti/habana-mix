import Link from 'next/link'
import { Clock, TriangleAlert } from 'lucide-react'
import { WhatsAppIcon } from '@/components/brand-icons'

/** Pantallas de vuelta de Mercado Pago que no son "aprobado". */
export function PaymentStatusScreen({
  tone,
  title,
  description,
  whatsappText,
}: {
  tone: 'pending' | 'error'
  title: string
  description: string
  whatsappText: string
}) {
  const pending = tone === 'pending'
  const Icon = pending ? Clock : TriangleAlert

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 py-12 text-center">
      <div>
        <p className="text-primary text-[11px] font-semibold tracking-[0.24em] uppercase">
          Habana Mix
        </p>
      </div>

      <div className="border-border/60 bg-card w-full space-y-4 rounded-3xl border p-6">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            pending ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>

        <div>
          <h1 className="font-serif text-2xl leading-tight font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
        </div>

        <Link
          href="/#eventos"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold transition-transform active:scale-[0.98]"
        >
          Volver a los eventos
        </Link>

        <a
          href={`https://wa.me/5493584178955?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-2 text-xs transition-colors"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          Escribinos por WhatsApp
        </a>
      </div>
    </main>
  )
}
