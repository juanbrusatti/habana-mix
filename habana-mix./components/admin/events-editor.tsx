'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Edit2, Calendar, Clock, MapPin, Upload, X } from 'lucide-react'

interface Event {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  price_label: string | null
  cta_label: string
  cta_url: string | null
  theme: string
  layout: string
  tags: string[]
  featured: boolean
  overlay_opacity: number
  accent_color: string | null
  status: string
  sort_order: number
}

interface EventFormData {
  slug: string
  title: string
  subtitle: string
  description: string
  image_url: string
  starts_at: string
  ends_at: string
  location: string
  price_label: string
  cta_label: string
  cta_url: string
  theme: string
  layout: string
  tags: string
  featured: boolean
  overlay_opacity: number
  accent_color: string
  status: string
  sort_order: number
}

const emptyEvent: EventFormData = {
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  starts_at: '',
  ends_at: '',
  location: '',
  price_label: '',
  cta_label: 'Reservar lugar',
  cta_url: '',
  theme: 'amber',
  layout: 'overlay',
  tags: '',
  featured: false,
  overlay_opacity: 60,
  accent_color: '',
  status: 'published',
  sort_order: 0
}

export function EventsEditor() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<EventFormData>(emptyEvent)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('starts_at', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error cargando eventos:', error)
      toast.error('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingEvent(null)
    setFormData(emptyEvent)
    setShowForm(true)
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      ...event,
      tags: event.tags.join(', '),
      starts_at: new Date(event.starts_at).toISOString().slice(0, 16),
      ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '',
      subtitle: event.subtitle || '',
      description: event.description || '',
      image_url: event.image_url || '',
      location: event.location || '',
      price_label: event.price_label || '',
      cta_url: event.cta_url || '',
      accent_color: event.accent_color || ''
    })
    setShowForm(true)
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `event-${Date.now()}.${fileExt}`
      const filePath = `events/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
      toast.success('Imagen subida exitosamente')
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
      setImageFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede superar 5MB')
        return
      }

      setImageFile(file)
      handleImageUpload(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' })
    toast.info('Imagen eliminada')
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      toast.success('Evento eliminado')
      loadEvents()
    } catch (error) {
      console.error('Error eliminando evento:', error)
      toast.error('Error al eliminar evento')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const eventData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null
      }

      console.log('Enviando datos del evento:', eventData)

      if (editingEvent) {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id)
          .select()

        console.log('Resultado de update:', { data, error })

        if (error) throw error
        toast.success('Evento actualizado')
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()

        console.log('Resultado de insert:', { data, error })

        if (error) throw error
        toast.success('Evento creado')
      }

      setShowForm(false)
      setFormData(emptyEvent)
      setEditingEvent(null)
      loadEvents()
    } catch (error) {
      console.error('Error guardando evento:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar evento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {editingEvent ? 'Editar evento' : 'Nuevo evento'}
          </h3>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
                placeholder="noche-cubana-timba"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="image">Imagen del evento</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo imagen...
                  </div>
                )}
                {formData.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img
                      src={formData.image_url}
                      alt="Vista previa"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="starts_at">Fecha y hora inicio *</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">Fecha y hora fin</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Salón principal — Habana Mix"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_label">Precio</Label>
              <Input
                id="price_label"
                value={formData.price_label}
                onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                placeholder="Entrada $20 · Alumnos gratis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_label">Texto del botón</Label>
              <Input
                id="cta_label"
                value={formData.cta_label}
                onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                placeholder="Reservar lugar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_url">URL del botón</Label>
              <Input
                id="cta_url"
                value={formData.cta_url}
                onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                placeholder="https://wa.me/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Timba en vivo, Clase gratis, Cupos limitados"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Orden</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="featured">Destacado</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingEvent ? 'Actualizar evento' : 'Crear evento'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Gestión de Eventos</h3>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo evento
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-muted-foreground">No hay eventos creados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{event.title}</h4>
                    {event.featured && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Destacado
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      event.status === 'published' ? 'bg-green-10 text-green-600' :
                      event.status === 'draft' ? 'bg-yellow-10 text-yellow-600' :
                      'bg-gray-10 text-gray-600'
                    }`}>
                      {event.status === 'published' ? 'Publicado' :
                       event.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </span>
                  </div>
                  {event.subtitle && (
                    <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.starts_at).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    {event.price_label && (
                      <div className="flex items-center gap-1">
                        <span>{event.price_label}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}