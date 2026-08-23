'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { MessageCircle, Loader2 } from 'lucide-react'

interface Ticket {
  token: string
  code: string
  eventTitle: string
  name: string
  emailSent: boolean
}

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 40_000

export function PaymentSuccessConfirmation() {
  const [state, setState] = useState<'loading' | 'confirmed' | 'error'>('loading')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const stopPolling = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id') || params.get('collection_id')
    const externalReference = params.get('external_reference')

    if (!paymentId || !externalReference) {
      setState('error')
      return
    }

    const startTime = Date.now()

    async function poll() {
      if (stopPolling.current) return

      // Timeout: el webhook tardó demasiado — mostrar fallback de contacto
      if (Date.now() - startTime >= POLL_TIMEOUT_MS) {
        setState('error')
        return
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId, external_reference: externalReference }),
        })

        if (!response.ok) {
          // Error real del servidor → mostrar fallback
          setState('error')
          return
        }

        const data = await response.json()

        if (data.status === 'confirmed' && data.ticket) {
          if (stopPolling.current) return
          const qr = await QRCode.toDataURL(`HM:${data.ticket.code}`, { width: 280, margin: 2 })
          setTicket(data.ticket)
          setQrDataUrl(qr)
          setState('confirmed')
          return
        }

        // Webhook aún no procesó el pago → reintentar
        if (data.status === 'pending') {
          setTimeout(poll, POLL_INTERVAL_MS)
          return
        }

        // Respuesta inesperada → mostrar fallback
        setState('error')
      } catch {
        // Error de red transitorio → reintentar si no superamos el timeout
        if (Date.now() - startTime < POLL_TIMEOUT_MS) {
          setTimeout(poll, POLL_INTERVAL_MS)
        } else {
          setState('error')
        }
      }
    }

    poll()

    return () => {
      stopPolling.current = true
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Confirmando tu pago…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          El pago fue recibido, pero todavía no pudimos confirmar la reserva. Contactanos con tu
          comprobante.
        </p>
        <a
          href="https://wa.me/5493584178955?text=Hola,%20realicé%20un%20pago%20pero%20no%20me%20llegó%20mi%20código%20QR.%20¿Podrían%20ayudarme?"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4" />
          Contactar por WhatsApp
        </a>
      </div>
    )
  }

  return ticket ? (
    <div className="space-y-3">
      <p className="text-muted-foreground">Tu reserva quedó confirmada.</p>
      {qrDataUrl && <img src={qrDataUrl} alt="Código QR de tu entrada" className="mx-auto h-56 w-56" />}
      <p className="font-semibold tracking-[0.3em]">{ticket.code}</p>
      <Link className="font-semibold underline underline-offset-4" href={`/entrada/${ticket.token}`}>
        Ver y descargar entrada
      </Link>
      <p className="text-xs text-muted-foreground">
        {ticket.emailSent
          ? 'También enviamos el enlace a tu email.'
          : 'Guardá este enlace para volver a descargarla.'}
      </p>
      <a
        href="https://wa.me/5493584178955?text=Hola,%20realicé%20un%20pago%20pero%20no%20me%20llegó%20mi%20código%20QR.%20¿Podrían%20ayudarme?"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-green-600 px-4 py-2 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50"
      >
        <MessageCircle className="h-4 w-4" />
        ¿No te llegó tu código QR? Contactanos
      </a>
    </div>
  ) : null
}
