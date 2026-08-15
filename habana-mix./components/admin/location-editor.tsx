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
  street: string
  street_number: string
  apartment: string
  city: string
  state: string
  country: string
  postal_code: string
  directions_note: string
  phone: string
  whatsapp: string
  hours: HourEntry[]
}

const defaultConfig: LocationConfig = {
  title: 'Cómo llegar',
  street: 'Av. del Malecón',
  street_number: '1245',
  apartment: 'Local 3',
  city: 'Palermo',
  state: 'Buenos Aires',
  country: 'Argentina',
  postal_code: 'C1414',
  directions_note: 'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
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
        p_street: config.street,
        p_street_number: config.street_number,
        p_apartment: config.apartment,
        p_city: config.city,
        p_state: config.state,
        p_country: config.country,
        p_postal_code: config.postal_code,
        p_directions_note: config.directions_note,
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="street">Calle</Label>
              <Input
                id="street"
                value={config.street}
                onChange={(e) => setConfig({ ...config, street: e.target.value })}
                placeholder="Av. del Malecón"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street_number">Número</Label>
              <Input
                id="street_number"
                value={config.street_number}
                onChange={(e) => setConfig({ ...config, street_number: e.target.value })}
                placeholder="1245"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Departamento/Piso (opcional)</Label>
              <Input
                id="apartment"
                value={config.apartment}
                onChange={(e) => setConfig({ ...config, apartment: e.target.value })}
                placeholder="Local 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={config.city}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                placeholder="Palermo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Provincia/Estado</Label>
              <Input
                id="state"
                value={config.state}
                onChange={(e) => setConfig({ ...config, state: e.target.value })}
                placeholder="Buenos Aires"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={config.country}
                onChange={(e) => setConfig({ ...config, country: e.target.value })}
                placeholder="Argentina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Código postal</Label>
              <Input
                id="postal_code"
                value={config.postal_code}
                onChange={(e) => setConfig({ ...config, postal_code: e.target.value })}
                placeholder="C1414"
              />
            </div>
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

        {/* Preview de dirección */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Vista previa de dirección</h4>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Dirección completa:</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {config.street} {config.street_number}
              {config.apartment && `, ${config.apartment}`}
              <br />
              {config.city}, {config.state}
              <br />
              {config.country}
              {config.postal_code && `, ${config.postal_code}`}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta dirección se usará para generar automáticamente el mapa de Google Maps.
          </p>
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