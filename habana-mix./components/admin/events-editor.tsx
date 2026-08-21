'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Edit2, Calendar, MapPin } from 'lucide-react'

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
  split_enabled: boolean
  split_amount: number | null
  split_percentage: number | null
  split_description: string | null
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
  split_enabled: boolean
  split_amount: string
  split_percentage: string
  split_description: string
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
  split_enabled: false,
  split_amount: '',
  split_percentage: '',
  split_description: '',
}

export function EventsEditor() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
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
      split_enabled: event.split_enabled || false,
      split_amount: event.split_amount?.toString() || '',
      split_percentage: event.split_percentage?.toString() || '',
      split_description: event.split_description || '',
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
        split_enabled: formData.split_enabled,
        split_amount: formData.split_enabled && formData.split_amount ? Number(formData.split_amount) : null,
        split_percentage: formData.split_enabled && formData.split_percentage ? Number(formData.split_percentage) : null,
        split_description: formData.split_enabled ? formData.split_description || null : null,
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

            {!formData.is_free && (
              <div className="space-y-4 md:col-span-2 border-t pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="split_enabled"
                    checked={formData.split_enabled}
                    onChange={(e) => setFormData({ ...formData, split_enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="split_enabled" className="cursor-pointer">
                    Habilitar split payment (dividir pago entre dos cuentas MercadoPago)
                  </Label>
                </div>

                {formData.split_enabled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="split_amount">Monto fijo para segunda cuenta (ARS)</Label>
                      <Input
                        id="split_amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.split_amount}
                        onChange={(e) => setFormData({ ...formData, split_amount: e.target.value, split_percentage: '' })}
                        placeholder="5000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dejar vacío si prefieres usar porcentaje
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="split_percentage">Porcentaje del total (%)</Label>
                      <Input
                        id="split_percentage"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={formData.split_percentage}
                        onChange={(e) => setFormData({ ...formData, split_percentage: e.target.value, split_amount: '' })}
                        placeholder="25"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dejar vacío si prefieres usar monto fijo
                      </p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="split_description">Descripción del split (interna)</Label>
                      <Input
                        id="split_description"
                        value={formData.split_description}
                        onChange={(e) => setFormData({ ...formData, split_description: e.target.value })}
                        placeholder="Porcentaje para instructor/organizador"
                      />
                      <p className="text-xs text-muted-foreground">
                        Solo visible para administradores
                      </p>
                    </div>
                  </div>
                )}
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
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {event.is_free ? 'Gratuito' : 'De pago'}
                    </span>
                  </div>
                  {event.subtitle && (
                    <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatEventDateTime(event.starts_at, event.ends_at)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    {event.price_label && (
                      <span>{event.price_label}</span>
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
