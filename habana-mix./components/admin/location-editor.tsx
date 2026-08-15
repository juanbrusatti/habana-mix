'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface HourEntry {
  label: string
  value: string
}

interface LocationConfig {
  title: string
  address: string
  city: string
  directions_note: string
  map_embed_url: string
  map_link_url: string
  phone: string
  whatsapp: string
  hours: HourEntry[]
}

const defaultConfig: LocationConfig = {
  title: 'Cómo llegar',
  address: 'Av. del Malecón 1245, Local 3',
  city: 'Palermo, Buenos Aires',
  directions_note: 'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  map_embed_url: 'https://www.openstreetmap.org/export/embed.html?bbox=-58.4300%2C-34.5860%2C-58.4130%2C-34.5740&layer=mapnik&marker=-34.5800%2C-58.4215',
  map_link_url: 'https://www.openstreetmap.org/?mlat=-34.5800&mlon=-58.4215#map=16/-34.5800/-58.4215',
  phone: '+54 11 5555 1234',
  whatsapp: '5491155551234',
  hours: [
    { label: 'Lunes a viernes', value: '17:00 – 23:00' },
    { label: 'Sábados', value: '11:00 – 20:00' },
    { label: 'Domingos', value: 'Solo eventos' }
  ]
}

export function LocationEditor() {
  const [config, setConfig] = useState<LocationConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_location_config')
      if (error) throw error
      if (data) {
        setConfig(data as LocationConfig)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const sessionData = localStorage.getItem('admin_session')
      if (!sessionData) {
        toast.error('No hay sesión activa')
        return
      }
      
      const session = JSON.parse(sessionData)
      const adminId = session.admin_id
      
      const { data, error } = await supabase.rpc('update_location_config', {
        p_admin_id: adminId,
        p_title: config.title,
        p_address: config.address,
        p_city: config.city,
        p_directions_note: config.directions_note,
        p_map_embed_url: config.map_embed_url,
        p_map_link_url: config.map_link_url,
        p_phone: config.phone,
        p_whatsapp: config.whatsapp,
        p_hours: config.hours as any
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Configuración guardada exitosamente')
      } else {
        throw new Error(data?.message || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error guardando configuración:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(defaultConfig)
    toast.info('Configuración restablecida a valores por defecto')
  }

  const addHour = () => {
    setConfig({
      ...config,
      hours: [...config.hours, { label: '', value: '' }]
    })
  }

  const removeHour = (index: number) => {
    setConfig({
      ...config,
      hours: config.hours.filter((_, i) => i !== index)
    })
  }

  const updateHour = (index: number, field: keyof HourEntry, value: string) => {
    const newHours = [...config.hours]
    newHours[index][field] = value
    setConfig({ ...config, hours: newHours })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Configuración de Ubicación</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información básica */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="font-medium text-sm text-muted-foreground">Información básica</h4>
          
          <div className="space-y-2">
            <Label htmlFor="title">Título de la sección</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Cómo llegar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              placeholder="Av. del Malecón 1245, Local 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={config.city}
              onChange={(e) => setConfig({ ...config, city: e.target.value })}
              placeholder="Palermo, Buenos Aires"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directions_note">Nota de direcciones</Label>
            <Textarea
              id="directions_note"
              value={config.directions_note}
              onChange={(e) => setConfig({ ...config, directions_note: e.target.value })}
              placeholder="A dos cuadras de la estación Plaza Italia..."
              rows={3}
            />
          </div>
        </div>

        {/* Mapa */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Mapa</h4>
          
          <div className="space-y-2">
            <Label htmlFor="map_embed_url">URL del mapa embed</Label>
            <Input
              id="map_embed_url"
              value={config.map_embed_url}
              onChange={(e) => setConfig({ ...config, map_embed_url: e.target.value })}
              placeholder="https://www.openstreetmap.org/export/embed.html..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="map_link_url">URL del mapa link</Label>
            <Input
              id="map_link_url"
              value={config.map_link_url}
              onChange={(e) => setConfig({ ...config, map_link_url: e.target.value })}
              placeholder="https://www.openstreetmap.org/?mlat=..."
            />
          </div>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Contacto</h4>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              placeholder="+54 11 5555 1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={config.whatsapp}
              onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
              placeholder="5491155551234"
            />
            <p className="text-xs text-muted-foreground">
              Solo números, sin el signo + ni espacios
            </p>
          </div>
        </div>

        {/* Horarios */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">Horarios</h4>
            <Button size="sm" variant="outline" onClick={addHour}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar horario
            </Button>
          </div>
          
          <div className="space-y-3">
            {config.hours.map((hour, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    value={hour.label}
                    onChange={(e) => updateHour(index, 'label', e.target.value)}
                    placeholder="Día"
                  />
                  <Input
                    value={hour.value}
                    onChange={(e) => updateHour(index, 'value', e.target.value)}
                    placeholder="Horario"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeHour(index)}
                  className="mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}