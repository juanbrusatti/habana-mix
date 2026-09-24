'use client'

import { useState } from 'react'
import { ExternalLink, ImageIcon, Loader2, Mail, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkPhotosUrl } from '@/lib/photos'

function getAdminId(): string | null {
  try {
    const stored = localStorage.getItem('admin_session')
    return stored ? (JSON.parse(stored).admin_id ?? null) : null
  } catch {
    return null
  }
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Link de fotos de un evento, dentro de la lista de eventos del admin.
 *
 * El admin pega el link de la carpeta de Drive, guarda, y opcionalmente se lo
 * manda por email a todos los que fueron. Los asistentes con entrada paga
 * además lo ven en su entrada.
 */
export function EventPhotosPanel({
  eventId,
  eventTitle,
  initialUrl,
  initialEmailedAt,
  onChange,
}: {
  eventId: string
  eventTitle: string
  initialUrl: string | null
  initialEmailedAt: string | null
  onChange?: (patch: { photos_url: string | null; photos_emailed_at: string | null }) => void
}) {
  const [url, setUrl] = useState(initialUrl || '')
  const [savedUrl, setSavedUrl] = useState(initialUrl || '')
  const [emailedAt, setEmailedAt] = useState(initialEmailedAt)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const check = checkPhotosUrl(url)
  const dirty = url.trim() !== savedUrl

  const save = async () => {
    if (!check.ok) {
      toast.error(check.error)
      return
    }
    const adminId = getAdminId()
    if (!adminId) {
      toast.error('No hay sesión activa')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/events/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
        body: JSON.stringify({ event_id: eventId, photos_url: check.url }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar')

      const next = data.event?.photos_url || ''
      setUrl(next)
      setSavedUrl(next)
      onChange?.({ photos_url: next || null, photos_emailed_at: emailedAt })
      toast.success(next ? 'Link de fotos guardado' : 'Link de fotos quitado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const notify = async () => {
    const adminId = getAdminId()
    if (!adminId) {
      toast.error('No hay sesión activa')
      return
    }

    const question = emailedAt
      ? `Ya mandaste las fotos el ${formatWhen(emailedAt)}. ¿Mandarlas de nuevo a todos los asistentes de "${eventTitle}"?`
      : `¿Mandar el link de fotos por email a todos los asistentes de "${eventTitle}"?`
    if (!confirm(question)) return

    setSending(true)
    try {
      const response = await fetch('/api/admin/events/photos/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
        body: JSON.stringify({ event_id: eventId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudieron enviar los emails')

      if (data.photos_emailed_at) {
        setEmailedAt(data.photos_emailed_at)
        onChange?.({ photos_url: savedUrl || null, photos_emailed_at: data.photos_emailed_at })
      }
      if (data.failed > 0) {
        toast.warning(`Enviados: ${data.sent} de ${data.total}. Fallaron ${data.failed}.`)
      } else {
        toast.success(`Listo: se mandaron ${data.sent} emails.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron enviar los emails')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Fotos del evento</p>
        {savedUrl && (
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-600">Cargadas</span>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`photos-${eventId}`} className="text-xs text-muted-foreground">
          Link de la carpeta de Google Drive
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`photos-${eventId}`}
            value={url}
            placeholder="https://drive.google.com/drive/folders/…"
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={!check.ok}
          />
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={saving || !dirty || !check.ok}
            className="h-9 sm:w-28"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
          </Button>
        </div>
        {!check.ok ? (
          <p className="text-xs text-red-500">{check.error}</p>
        ) : check.url && !check.isGoogle ? (
          <p className="text-xs text-amber-600">
            No es un link de Google Drive. Funciona igual, pero chequeá que abra bien.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            En Drive: Compartir → &quot;Cualquier persona con el enlace&quot; → Lector. Si no, a los
            asistentes les va a pedir permiso.
          </p>
        )}
      </div>

      {savedUrl && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={notify}
            disabled={sending || dirty}
            title={dirty ? 'Guardá el link antes de mandarlo' : undefined}
          >
            {sending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-1.5 h-4 w-4" />
            )}
            {sending ? 'Enviando…' : emailedAt ? 'Reenviar por email' : 'Mandar por email a los asistentes'}
          </Button>

          <a
            href={savedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Probar link <ExternalLink className="h-3 w-3" />
          </a>

          {emailedAt && (
            <span className="text-xs text-muted-foreground">Enviado el {formatWhen(emailedAt)}</span>
          )}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
        Si borrás el evento se borran también sus asistencias, y con ellas las entradas donde se ven
        las fotos.
      </p>
    </div>
  )
}
