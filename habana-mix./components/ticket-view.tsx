'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

interface TicketData {
  eventTitle: string
  name: string
  email: string
  code: string
  checkedInAt: string | null
  paidAt: string | null
}

export function TicketView({ token }: { token: string }) {
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/tickets/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Entrada no encontrada')
        setTicket(data)
        setQrDataUrl(await QRCode.toDataURL(data.code, { width: 320, margin: 2 }))
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la entrada'))
      .finally(() => setLoading(false))
  }, [token])

  const downloadTicket = async () => {
    if (!ticket) return
    const qrDataUrl = await QRCode.toDataURL(ticket.code, { width: 320, margin: 2 })
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Entrada - ${ticket.eventTitle}</title><style>body{font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#161616}img{display:block;width:280px;margin:24px auto}.code{font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;padding:16px;border:2px solid #161616}h1{text-align:center}</style></head><body><h1>${ticket.eventTitle}</h1><p>Entrada a nombre de: <strong>${ticket.name}</strong></p><img src="${qrDataUrl}" alt="Código QR"><div class="code">${ticket.code}</div><p>Presentá este QR o el código en el ingreso.</p></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `entrada-${ticket.code}.html`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) return <p className="text-muted-foreground">Cargando tu entrada…</p>
  if (error || !ticket) return <p className="text-red-500">{error || 'Entrada no encontrada'}</p>

  return (
    <div className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Entrada confirmada</p>
        <h1 className="font-serif text-3xl font-semibold">{ticket.eventTitle}</h1>
        <p className="mt-2 text-muted-foreground">{ticket.name}</p>
      </div>
      <div className="rounded-xl border p-4">
        {qrDataUrl && <img src={qrDataUrl} alt="Código QR de la entrada" className="mx-auto h-64 w-64" />}
        <p className="text-xs uppercase text-muted-foreground">Código de acceso</p>
        <p className="mt-2 text-3xl font-bold tracking-[0.35em]">{ticket.code}</p>
      </div>
      <p className="text-sm text-muted-foreground">Tu QR se genera al descargar la entrada. Presentá cualquiera de los dos en el ingreso.</p>
      <Button onClick={downloadTicket} className="w-full">Descargar entrada con QR y código</Button>
    </div>
  )
}
