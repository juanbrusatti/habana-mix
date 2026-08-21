'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react'

interface StatEntry {
  value: string
  label: string
}

interface AboutConfig {
  eyebrow: string
  title: string
  image_url: string
  paragraphs: string[]
  stats: StatEntry[]
  show_badge: boolean
  badge_main_text: string
  badge_sub_text: string
}

const createRowId = () => crypto.randomUUID()

const defaultConfig: AboutConfig = {
  eyebrow: 'Quiénes somos',
  title: 'Un pedacito de Cuba en tu ciudad',
  image_url: '/images/about-academia.png',
  paragraphs: [
    'Habana Mix nació de una idea simple: que cualquiera pueda sentir el sabor cubano sin importar de dónde venga ni cuánto haya bailado antes.',
    'Nuestros instructores se formaron en La Habana y llevan más de diez años enseñando salsa cubana, timba, bachata y rueda de casino. Acá no se copian pasos: se aprende a escuchar la música.',
    'Más que una academia, somos una comunidad. Se entra por una clase y se queda por la gente.'
  ],
  stats: [
    { value: '10+', label: 'Años enseñando' },
    { value: '1.200', label: 'Alumnos felices' },
    { value: '4', label: 'Estilos cubanos' },
    { value: '2', label: 'Fiestas al mes' }
  ],
  show_badge: true,
  badge_main_text: '100% cubano',
  badge_sub_text: 'Instructores de La Habana'
}

export function AboutEditor() {
  const [config, setConfig] = useState<AboutConfig>(defaultConfig)
  const [paragraphIds, setParagraphIds] = useState(() => defaultConfig.paragraphs.map(() => createRowId()))
  const [statIds, setStatIds] = useState(() => defaultConfig.stats.map(() => createRowId()))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_about_config')
      if (error) throw error
      if (data) {
        const next = data as AboutConfig
        setConfig(next)
        setParagraphIds(next.paragraphs.map(() => createRowId()))
        setStatIds(next.stats.map(() => createRowId()))
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `about-${Date.now()}.${fileExt}`
      const filePath = `about/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setConfig({ ...config, image_url: publicUrl })
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
    setConfig({ ...config, image_url: '/images/about-academia.png' })
    toast.info('Imagen restablecida')
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
      
      const { data, error } = await supabase.rpc('update_about_config', {
        p_admin_id: adminId,
        p_eyebrow: config.eyebrow,
        p_title: config.title,
        p_image_url: config.image_url,
        p_paragraphs: config.paragraphs as any,
        p_stats: config.stats as any,
        p_show_badge: config.show_badge,
        p_badge_main_text: config.badge_main_text,
        p_badge_sub_text: config.badge_sub_text
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
    setParagraphIds(defaultConfig.paragraphs.map(() => createRowId()))
    setStatIds(defaultConfig.stats.map(() => createRowId()))
    toast.info('Configuración restablecida a valores por defecto')
  }

  const addParagraph = () => {
    setConfig({
      ...config,
      paragraphs: [...config.paragraphs, '']
    })
    setParagraphIds((ids) => [...ids, createRowId()])
  }

  const removeParagraph = (index: number) => {
    setConfig({
      ...config,
      paragraphs: config.paragraphs.filter((_, i) => i !== index)
    })
    setParagraphIds((ids) => ids.filter((_, i) => i !== index))
  }

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...config.paragraphs]
    newParagraphs[index] = value
    setConfig({ ...config, paragraphs: newParagraphs })
  }

  const addStat = () => {
    setConfig({
      ...config,
      stats: [...config.stats, { value: '', label: '' }]
    })
    setStatIds((ids) => [...ids, createRowId()])
  }

  const removeStat = (index: number) => {
    setConfig({
      ...config,
      stats: config.stats.filter((_, i) => i !== index)
    })
    setStatIds((ids) => ids.filter((_, i) => i !== index))
  }

  const updateStat = (index: number, field: keyof StatEntry, value: string) => {
    const newStats = [...config.stats]
    newStats[index][field] = value
    setConfig({ ...config, stats: newStats })
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
        <h3 className="text-xl font-semibold">Configuración de Quiénes Somos</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
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
            <Label htmlFor="eyebrow">Texto superior (eyebrow)</Label>
            <Input
              id="eyebrow"
              value={config.eyebrow}
              onChange={(e) => setConfig({ ...config, eyebrow: e.target.value })}
              placeholder="Quiénes somos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título principal</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Un pedacito de Cuba en tu ciudad"
            />
          </div>
        </div>

        {/* Imagen */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Imagen</h4>
          
          <div className="space-y-2">
            <Label htmlFor="image_upload">Subir imagen desde dispositivo</Label>
            <div className="flex gap-2">
              <Input
                id="image_upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
              {uploading && (
                <Loader2 className="w-10 h-10 animate-spin" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos: JPG, PNG, GIF. Máximo 5MB.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">O URL de la imagen</Label>
            <Input
              id="image_url"
              value={config.image_url}
              onChange={(e) => setConfig({ ...config, image_url: e.target.value })}
              placeholder="/images/about-academia.png"
            />
          </div>

          {config.image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden border group">
              <img
                src={config.image_url}
                alt="Preview"
                className="object-cover w-full h-full"
                onError={() => toast.error('Error al cargar la imagen')}
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Sello decorativo */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Sello decorativo</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show_badge">Mostrar sello en la imagen</Label>
            <input
              id="show_badge"
              type="checkbox"
              checked={config.show_badge}
              onChange={(e) => setConfig({ ...config, show_badge: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </div>

          {config.show_badge && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="badge_main_text">Texto principal</Label>
                <Input
                  id="badge_main_text"
                  value={config.badge_main_text}
                  onChange={(e) => setConfig({ ...config, badge_main_text: e.target.value })}
                  placeholder="100% cubano"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_sub_text">Texto secundario</Label>
                <Input
                  id="badge_sub_text"
                  value={config.badge_sub_text}
                  onChange={(e) => setConfig({ ...config, badge_sub_text: e.target.value })}
                  placeholder="Instructores de La Habana"
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Vista previa del sello:</p>
                <div className="border-border/60 bg-background/85 rounded-2xl border px-5 py-3 backdrop-blur-md">
                  <p className="text-primary font-serif text-2xl leading-none font-semibold">
                    {config.badge_main_text}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[11px] tracking-[0.16em] uppercase">
                    {config.badge_sub_text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Párrafos */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">Párrafos</h4>
            <Button size="sm" variant="outline" onClick={addParagraph}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar párrafo
            </Button>
          </div>
          
          <div className="space-y-3">
            {config.paragraphs.map((paragraph, index) => (
              <div key={paragraphIds[index]} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={paragraph}
                    onChange={(e) => updateParagraph(index, e.target.value)}
                    placeholder="Texto del párrafo..."
                    rows={3}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeParagraph(index)}
                  className="mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">Estadísticas</h4>
            <Button size="sm" variant="outline" onClick={addStat}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar estadística
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {config.stats.map((stat, index) => (
              <div key={statIds[index]} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStat(index, 'value', e.target.value)}
                    placeholder="Valor (ej: 10+)"
                  />
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStat(index, 'label', e.target.value)}
                    placeholder="Etiqueta (ej: Años enseñando)"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeStat(index)}
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