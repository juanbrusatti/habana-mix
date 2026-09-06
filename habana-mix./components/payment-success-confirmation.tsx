'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { Check, Download, Mail, TriangleAlert } from 'lucide-react'
import { WhatsAppIcon } from '@/components/brand-icons'

interface Ticket {
  token: string
  code: string
  eventTitle: string
  name: string
  emailSent: boolean
}

const SUPPORT_URL =
  'https://wa.me/5493584178955?text=Hola,%20realic%C3%A9%20un%20pago%20pero%20no%20me%20lleg%C3%B3%20mi%20c%C3%B3digo%20QR.%20%C2%BFPodr%C3%ADan%20ayudarme?'

/**
 * Confirmación de pago.
 *
 * La lógica no cambió: sigue leyendo payment_id/collection_id y
 * external_reference de la query y llamando a /api/payments/confirm, y el QR
 * sigue codificando `HM:<código>` (formato que lee el control de acceso).
 * Lo que cambia es que ahora se siente como recibir una entrada.
 */
export function PaymentSuccessConfirmation() {
  const [state, setState] = useState<'loading' | 'confirmed' | 'error'>('loading')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id') || params.get('collection_id')
    const externalReference = params.get('external_reference')

    if (!paymentId || !externalReference) {
      setState('error')
      return
    }

    fetch('/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: paymentId, external_reference: externalReference }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('No confirmado')
        const data = await response.json()
        setTicket(data.ticket)
        setQrDataUrl(await QRCode.toDataURL(`HM:${data.ticket.code}`, { width: 280, margin: 2 }))
        setState('confirmed')
      })
      .catch(() => setState('error'))
  }, [])

  if (state === 'loading') {
    return (
      <div className="border-border/60 bg-card w-full rounded-3xl border p-8 text-center">
        <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground mt-4 text-sm">Confirmando tu pago…</p>
        <p className="text-muted-foreground/70 mt-1 text-xs">No cierres esta pantalla.</p>
      </div>
    )
  }

  if (state === 'error' || !ticket) {
    return (
      <div className="border-destructive/40 bg-card w-full space-y-4 rounded-3xl border p-6 text-center">
        <span className="bg-destructive/15 text-destructive mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <div>
          <p className="font-serif text-xl font-semibold">No pudimos confirmar la reserva</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Si el pago se descontó, tu lugar está a salvo: escribinos con el comprobante y lo
            resolvemos.
          </p>
        </div>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-600 text-[15px] font-semibold text-white transition-transform hover:bg-green-700 active:scale-[0.98]"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Escribinos por WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="animate-enter-up border-border/60 bg-card w-full overflow-hidden rounded-3xl border">
      <div className="bg-primary/10 border-primary/20 flex items-center gap-3 border-b px-5 py-4">
        <span className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <div className="text-left">
          <p className="font-serif text-lg leading-tight font-semibold">Tu entrada está lista</p>
          <p className="text-muted-foreground text-xs">{ticket.eventTitle}</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {qrDataUrl && (
          <div className="animate-enter-up mx-auto w-fit rounded-2xl bg-white p-3" style={{ animationDelay: '120ms' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Código QR de tu entrada" className="h-52 w-52" />
          </div>
        )}

        <div className="mt-5 text-center">
          <p className="text-muted-foreground text-[10px] tracking-[0.24em] uppercase">
            Código de acceso
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em]">{ticket.code}</p>
          <p className="text-muted-foreground mt-2 text-sm">A nombre de {ticket.name}</p>
        </div>

        <p className="border-border/60 text-muted-foreground mt-5 border-t pt-4 text-center text-sm leading-relaxed">
          Mostrá este QR en la puerta. Si no te abre la cámara, alcanza con el código.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/entrada/${ticket.token}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-transform active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Ver y descargar mi entrada
          </Link>

          <p className="text-muted-foreground mt-1 inline-flex items-center justify-center gap-2 text-xs">
            <Mail className="h-3.5 w-3.5" />
            {ticket.emailSent
              ? 'También te la mandamos por email.'
              : 'Guardá este enlace para volver a abrirla.'}
          </p>

          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center justify-center gap-2 text-xs transition-colors"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            ¿Algún problema con tu entrada?
          </a>
        </div>
      </div>
    </div>
  )
}
