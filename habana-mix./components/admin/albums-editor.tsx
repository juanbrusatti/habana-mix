'use client'

import { useEffect, useState } from 'react'
import {
  Calendar,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { checkPhotosUrl, formatAlbumDate, type PhotoAlbum } from '@/lib/photos'
import { supabase } from '@/lib/supabase'

interface AlbumForm {
  title: string
  description: string
  album_date: string
  cover_url: string
  drive_url: string
  is_published: boolean
}

const emptyForm: AlbumForm = {
  title: '',
  description: '',
  album_date: '',
  cover_url: '',
  drive_url: '',
  is_published: true,
}

function getAdminId(): string | null {
  try {
    const stored = localStorage.getItem('admin_session')
    return stored ? (JSON.parse(stored).admin_id ?? null) : null
  } catch {
    return null
  }
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const adminId = getAdminId()
  if (!adminId) throw new Error('No hay sesión activa')
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId, ...init.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Algo salió mal')
  return data
}

/**
 * Álbumes de fotos: sección propia, independiente de los eventos.
 * Cada álbum es un título, una fecha, una portada y el link a Drive.
 */
export function AlbumsEditor() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState<PhotoAlbum | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AlbumForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await adminFetch('/api/admin/albums')
      setAlbums(data.albums || [])
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los álbumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (album: PhotoAlbum) => {
    setEditing(album)
    setForm({
      title: album.title,
      description: album.description || '',
      album_date: album.album_date?.slice(0, 10) || '',
      cover_url: album.cover_url || '',
      drive_url: album.drive_url,
      is_published: album.is_published,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    setUploading(true)
    try {
      const extension = file.name.split('.').pop() || 'jpg'
      const path = `albums/album-${Date.now()}.${extension}`
      const { error } = await supabase.storage.from('media').upload(path, file)
      if (error) throw error
      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(path)
      setForm((current) => ({ ...current, cover_url: publicUrl }))
      toast.success('Portada subida')
    } catch (error) {
      console.error('Error subiendo portada:', error)
      toast.error('No se pudo subir la portada')
    } finally {
      setUploading(false)
    }
  }

  const driveCheck = checkPhotosUrl(form.drive_url)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) {
      toast.error('Poné un título para el álbum')
      return
    }
    if (!driveCheck.ok || !driveCheck.url) {
      toast.error(driveCheck.ok ? 'Falta el link de la carpeta de Drive' : driveCheck.error)
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const data = await adminFetch(`/api/admin/albums/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        })
        setAlbums((current) => current.map((item) => (item.id === editing.id ? data.album : item)))
        toast.success('Álbum actualizado')
      } else {
        await adminFetch('/api/admin/albums', { method: 'POST', body: JSON.stringify(form) })
        toast.success(form.is_published ? 'Álbum publicado en /fotos' : 'Álbum guardado (oculto)')
        await load()
      }
      closeForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (album: PhotoAlbum) => {
    setBusyId(album.id)
    try {
      const data = await adminFetch(`/api/admin/albums/${album.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published: !album.is_published }),
      })
      setAlbums((current) => current.map((item) => (item.id === album.id ? data.album : item)))
      toast.success(data.album.is_published ? 'Álbum visible en /fotos' : 'Álbum oculto')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (album: PhotoAlbum) => {
    if (
      !confirm(
        `¿Borrar el álbum "${album.title}"?\n\nSe quita de la web. Las fotos siguen en tu Drive. Si solo querés sacarlo por un tiempo, usá "Ocultar".`,
      )
    )
      return

    setBusyId(album.id)
    try {
      await adminFetch(`/api/admin/albums/${album.id}`, { method: 'DELETE' })
      setAlbums((current) => current.filter((item) => item.id !== album.id))
      toast.success('Álbum borrado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo borrar')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5 text-sm">
        <p className="font-medium">No se pudieron cargar los álbumes</p>
        <p className="mt-1 text-muted-foreground">{loadError}</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold sm:text-xl">
            {editing ? 'Editar álbum' : 'Nuevo álbum'}
          </h3>
          <Button variant="outline" size="sm" onClick={closeForm}>
            Cancelar
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-title">Título *</Label>
              <Input
                id="album-title"
                value={form.title}
                placeholder="Social de colores — Final Nacional"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-drive">Link de la carpeta de Google Drive *</Label>
              <Input
                id="album-drive"
                value={form.drive_url}
                placeholder="https://drive.google.com/drive/folders/…"
                onChange={(event) => setForm((current) => ({ ...current, drive_url: event.target.value }))}
                aria-invalid={!driveCheck.ok}
                required
              />
              {!driveCheck.ok ? (
                <p className="text-xs text-red-500">{driveCheck.error}</p>
              ) : driveCheck.url && !driveCheck.isGoogle ? (
                <p className="text-xs text-amber-600">
                  No es un link de Google Drive. Funciona igual, pero chequeá que abra bien.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  En Drive: Compartir → &quot;Cualquier persona con el enlace&quot; → Lector. Si no, a
                  la gente le va a pedir permiso para entrar.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="album-date">Fecha</Label>
              <Input
                id="album-date"
                type="date"
                value={form.album_date}
                onChange={(event) => setForm((current) => ({ ...current, album_date: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Ordena los álbumes: el más nuevo va primero.</p>
            </div>

            <div className="space-y-2">
              <Label>Portada</Label>
              {form.cover_url ? (
                <div className="relative h-28 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.cover_url} alt="Portada del álbum" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, cover_url: '' }))}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Quitar portada"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-muted/40">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Subir imagen (opcional)
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void uploadCover(file)
                      event.target.value = ''
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-description">Descripción</Label>
              <Textarea
                id="album-description"
                rows={3}
                value={form.description}
                placeholder="Opcional. Ej: fotos de la noche y de la entrega de premios."
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm md:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.is_published}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_published: event.target.checked }))
                }
              />
              Publicado (se ve en la sección Fotos)
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear álbum'}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold sm:text-xl">Álbumes de fotos</h3>
          <p className="text-sm text-muted-foreground">
            Se ven en la sección{' '}
            <a href="/fotos" target="_blank" rel="noreferrer" className="underline underline-offset-4">
              /fotos
            </a>
            . Las fotos quedan en Drive; acá solo va el link.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo álbum
        </Button>
      </div>

      {albums.length === 0 ? (
        <div className="rounded-lg border p-8 text-center sm:p-12">
          <p className="text-muted-foreground">Todavía no hay álbumes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <div key={album.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {album.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-semibold">{album.title}</h4>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        album.is_published
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {album.is_published ? 'Publicado' : 'Oculto'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {album.album_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatAlbumDate(album.album_date)}
                      </span>
                    )}
                    <a
                      href={album.drive_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Probar link <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublished(album)}
                  disabled={busyId === album.id}
                  className="flex-1 sm:flex-none"
                  title={album.is_published ? 'Ocultar de la web' : 'Publicar en la web'}
                >
                  {album.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="ml-1.5 text-xs sm:hidden">
                    {album.is_published ? 'Ocultar' : 'Publicar'}
                  </span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(album)} className="flex-1 sm:flex-none">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(album)}
                  disabled={busyId === album.id}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
