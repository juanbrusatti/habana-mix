'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'

interface Ticket {
  token: string
  code: string
  eventTitle: string
  name: string
  emailSent: boolean
}

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
    return <p className="text-muted-foreground">Confirmando tu pago…</p>
  }

  if (state === 'error') {
    return (
      <p className="text-muted-foreground">
        El pago fue recibido, pero todavía no pudimos confirmar la reserva. Contactanos con tu comprobante.
      </p>
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
        {ticket.emailSent ? 'También enviamos el enlace a tu email.' : 'Guardá este enlace para volver a descargarla.'}
      </p>
    </div>
  ) : null
}
