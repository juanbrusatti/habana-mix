'use client'

import { useEffect, useState } from 'react'

export function PaymentSuccessConfirmation() {
  const [state, setState] = useState<'loading' | 'confirmed' | 'error'>('loading')

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

  return (
    <p className="text-muted-foreground">
      Tu reserva quedó confirmada. Recibirás la confirmación en el email informado.
    </p>
  )
}
