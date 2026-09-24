'use client'

import { useState } from 'react'
import { ExternalLink, ImageIcon, Loader2, TriangleAlert } from 'lucide-react'
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

/**
 * Link de fotos de un evento, dentro de la lista de eventos del admin.
 * Al guardarlo, el evento aparece en la sección pública /fotos.
 */
export function EventPhotosPanel({
  eventId,
  initialUrl,
  onChange,
}: {
  eventId: string
  initialUrl: string | null
  onChange?: (photosUrl: string | null) => void
}) {
  const [url, setUrl] = useState(initialUrl || '')
  const [savedUrl, setSavedUrl] = useState(initialUrl || '')
  const [saving, setSaving] = useState(false)

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
      onChange?.(next || null)
      toast.success(next ? 'Listo: el evento ya aparece en la sección Fotos' : 'Link de fotos quitado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Fotos del evento</p>
        {savedUrl && (
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
            Publicadas en /fotos
          </span>
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
            En Drive: Compartir → &quot;Cualquier persona con el enlace&quot; → Lector. Si no, a la
            gente le va a pedir permiso para entrar. Para sacarlo de /fotos, borrá el link y guardá.
          </p>
        )}
      </div>

      {savedUrl && (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={savedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Probar link <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="/fotos"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Ver la sección Fotos <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
        Si borrás el evento, desaparece también de la sección Fotos.
      </p>
    </div>
  )
}
