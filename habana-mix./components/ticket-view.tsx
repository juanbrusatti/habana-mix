'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Camera, Check, Download, ExternalLink, TriangleAlert } from 'lucide-react'
import { WhatsAppIcon } from '@/components/brand-icons'
import { Button } from '@/components/ui/button'

interface TicketData {
  eventTitle: string
  name: string
  email: string
  code: string
  checkedInAt: string | null
  paidAt: string | null
  photosUrl?: string | null
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
        // El control de acceso lee este formato: no cambiar.
        setQrDataUrl(await QRCode.toDataURL(`HM:${data.code}`, { width: 320, margin: 2 }))
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar la entrada'),
      )
      .finally(() => setLoading(false))
  }, [token])

  const downloadTicket = async () => {
    if (!ticket) return
    const qr = await QRCode.toDataURL(`HM:${ticket.code}`, { width: 320, margin: 2 })
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Entrada - ${ticket.eventTitle}</title><style>body{font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#161616}img{display:block;width:280px;margin:24px auto}.code{font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;padding:16px;border:2px solid #161616}h1{text-align:center}</style></head><body><h1>${ticket.eventTitle}</h1><p>Entrada a nombre de: <strong>${ticket.name}</strong></p><img src="${qr}" alt="Código QR"><div class="code">${ticket.code}</div><p>Presentá este QR o el código en el ingreso.</p></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `entrada-${ticket.code}.html`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) {
    return (
      <div className="border-border/60 bg-card w-full max-w-md rounded-3xl border p-8 text-center">
        <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground mt-4 text-sm">Cargando tu entrada…</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="border-destructive/40 bg-card w-full max-w-md space-y-4 rounded-3xl border p-6 text-center">
        <span className="bg-destructive/15 text-destructive mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <p className="font-serif text-xl font-semibold">{error || 'Entrada no encontrada'}</p>
        <a
          href="https://wa.me/5493584178955?text=Hola,%20tengo%20problemas%20con%20mi%20entrada.%20%C2%BFPodr%C3%ADan%20ayudarme?"
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

  const used = Boolean(ticket.checkedInAt)

  return (
    <div className="animate-enter-up border-border/60 bg-card w-full max-w-md overflow-hidden rounded-3xl border">
      <div
        className={`flex items-center gap-3 border-b px-5 py-4 ${
          used ? 'border-border/60 bg-muted/40' : 'border-primary/20 bg-primary/10'
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            used ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
          }`}
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <div className="text-left">
          <p className="font-serif text-lg leading-tight font-semibold">
            {used ? 'Entrada ya utilizada' : 'Entrada confirmada'}
          </p>
          <p className="text-muted-foreground text-xs">{ticket.eventTitle}</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Fotos del evento: arriba de todo, porque si están es lo que la persona vino a buscar. */}
        {ticket.photosUrl && (
          <a
            href={ticket.photosUrl}
            target="_blank"
            rel="noreferrer"
            className="group border-primary/30 bg-primary/10 hover:border-primary/60 mb-5 flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors"
          >
            <span className="bg-primary text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <Camera className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Las fotos del evento ya están</span>
              <span className="text-muted-foreground block text-xs">
                Miralas y descargalas desde Google Drive
              </span>
            </span>
            <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}

        {qrDataUrl && (
          <div className={`mx-auto w-fit rounded-2xl bg-white p-3 ${used ? 'opacity-45' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Código QR de la entrada" className="h-56 w-56" />
          </div>
        )}

        <div className="mt-5 text-center">
          <p className="text-muted-foreground text-[10px] tracking-[0.24em] uppercase">
            Código de acceso
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em]">{ticket.code}</p>
          <p className="text-muted-foreground mt-2 text-sm">A nombre de {ticket.name}</p>
        </div>

        {used && ticket.checkedInAt && (
          <p className="text-muted-foreground border-border/60 mt-4 border-t pt-4 text-center text-xs">
            Ingreso registrado el{' '}
            {new Date(ticket.checkedInAt).toLocaleString('es-AR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        )}

        <p className="border-border/60 text-muted-foreground mt-5 border-t pt-4 text-center text-sm leading-relaxed">
          Mostrá este QR en la puerta. Si no te abre la cámara, alcanza con el código.
        </p>

        <Button
          onClick={downloadTicket}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 h-12 w-full rounded-full text-[15px] font-semibold transition-transform active:scale-[0.98]"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar entrada
        </Button>

        <a
          href={`https://wa.me/5493584178955?text=${encodeURIComponent(
            `Hola, tengo problemas con mi entrada para ${ticket.eventTitle}. ¿Podrían ayudarme?`,
          )}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground mt-3 inline-flex w-full items-center justify-center gap-2 text-xs transition-colors"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          ¿Algún problema con tu entrada?
        </a>
      </div>
    </div>
  )
}
