'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Edit2, Calendar, MapPin, Layout, ImageIcon, ArrowLeft } from 'lucide-react'
import { EventContentEditor } from './event-content-editor'

function formatEventDateTime(startsAt: string, endsAt: string | null) {
  const startDate = new Date(startsAt)
  const endDate = endsAt ? new Date(endsAt) : null

  const dateStr = startDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const startTimeStr = startDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (endDate) {
    const endTimeStr = endDate.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    if (startDate.toDateString() === endDate.toDateString()) {
      return `${dateStr} · ${startTimeStr} - ${endTimeStr}`
    }

    const endDateStr = endDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return `${dateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`
  }

  return `${dateStr} · ${startTimeStr}`
}

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
  is_free: boolean
  price_label: string | null
  price_amount: number | null
  price_currency: string
  cta_label: string
  theme: string
  layout: string
  tags: string[]
  overlay_opacity: number
  accent_color: string | null
  created_at: string
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
  is_free: boolean
  price_label: string
  price_amount: string
  price_currency: string
  cta_label: string
  theme: string
  layout: string
  tags: string
  overlay_opacity: number
  accent_color: string
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
  is_free: true,
  price_label: '',
  price_amount: '',
  price_currency: 'ARS',
  cta_label: 'Reservar lugar',
  theme: 'amber',
  layout: 'overlay',
  tags: '',
  overlay_opacity: 60,
  accent_color: '',
}

export function EventsEditor() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<EventFormData>(emptyEvent)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: true })

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
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle || '',
      description: event.description || '',
      image_url: event.image_url || '',
      starts_at: new Date(event.starts_at).toISOString().slice(0, 16),
      ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '',
      location: event.location || '',
      is_free: event.is_free,
      price_label: event.price_label || '',
      price_amount: event.price_amount?.toString() || '',
      price_currency: event.price_currency || 'ARS',
      cta_label: event.cta_label || 'Reservar lugar',
      theme: event.theme,
      layout: event.layout,
      tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
      overlay_opacity: event.overlay_opacity,
      accent_color: event.accent_color || '',
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

      setFormData((prev) => ({ ...prev, image_url: publicUrl }))
      toast.success('Imagen subida exitosamente')
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    handleImageUpload(file)
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }))
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
      if (!formData.is_free && (!formData.price_amount || Number(formData.price_amount) <= 0)) {
        toast.error('Ingresa un precio válido para el evento')
        return
      }

      const eventData = {
        slug: formData.slug,
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        location: formData.location || null,
        is_free: formData.is_free,
        price_label: formData.is_free ? null : (formData.price_label || null),
        price_amount: formData.is_free ? null : Number(formData.price_amount),
        price_currency: formData.price_currency,
        cta_label: formData.cta_label || (formData.is_free ? 'Reservar lugar' : 'Comprar entrada'),
        theme: formData.theme,
        layout: formData.layout,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        overlay_opacity: formData.overlay_opacity,
        accent_color: formData.accent_color || null,
      }

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id)

        if (error) throw error
        toast.success('Evento actualizado')
      } else {
        const { error } = await supabase
          .from('events')
          .insert(eventData)

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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold">
            {editingEvent ? 'Editar evento' : 'Nuevo evento'}
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="text-base"
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
                className="text-base"
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="text-base"
                  />
                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRemoveImage}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4" />
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
                      className="w-full h-32 sm:h-48 object-cover"
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
              <Label>Tipo de evento</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_free"
                    checked={formData.is_free}
                    onChange={() => setFormData({
                      ...formData,
                      is_free: true,
                      price_label: '',
                      price_amount: '',
                      cta_label: 'Reservar lugar',
                    })}
                    className="w-4 h-4"
                  />
                  <span>Gratuito</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_free"
                    checked={!formData.is_free}
                    onChange={() => setFormData({
                      ...formData,
                      is_free: false,
                      cta_label: formData.cta_label === 'Reservar lugar' ? 'Comprar entrada' : formData.cta_label,
                    })}
                    className="w-4 h-4"
                  />
                  <span>De pago</span>
                </label>
              </div>
            </div>

            {!formData.is_free && (
              <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="price_amount">Monto a cobrar (ARS) *</Label>
                  <Input
                    id="price_amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.price_amount}
                    onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })}
                    placeholder="20000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_label">Texto visible del precio</Label>
                  <Input
                    id="price_label"
                    value={formData.price_label}
                    onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                    placeholder="Entrada $20.000"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cta_label">Texto del botón</Label>
              <Input
                id="cta_label"
                value={formData.cta_label}
                onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                placeholder={formData.is_free ? 'Reservar lugar' : 'Comprar entrada'}
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

  if (selectedEvent) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEvent(null)}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Volver a eventos
            </Button>
            <h3 className="text-lg sm:text-xl font-semibold truncate">
              {selectedEvent.title}
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {selectedEvent.slug ? `/${selectedEvent.slug}` : ''}
          </span>
        </div>
        <EventContentEditor eventId={selectedEvent.id} eventTitle={selectedEvent.title} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg sm:text-xl font-semibold">Gestión de Eventos</h3>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo evento
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center p-8 sm:p-12 border rounded-lg">
          <p className="text-muted-foreground">No hay eventos creados</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-base sm:text-base">{event.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {event.is_free ? 'Gratuito' : 'De pago'}
                    </span>
                  </div>
                  {event.subtitle && (
                    <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {formatEventDateTime(event.starts_at, event.ends_at)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                        {event.location}
                      </div>
                    )}
                    {event.price_label && (
                      <span>{event.price_label}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEvent(event)}
                    className="flex-1 sm:flex-none"
                    title="Gestionar imágenes y detalles"
                  >
                    <Layout className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0" />
                    <span className="sm:hidden text-xs">Imágenes</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(event)} className="flex-1 sm:flex-none">
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(event.id)} className="flex-1 sm:flex-none">
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
