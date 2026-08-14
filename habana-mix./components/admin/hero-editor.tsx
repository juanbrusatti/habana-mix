'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Upload, X } from 'lucide-react'

interface HeroConfig {
  badge_text: string
  title: string
  subtitle: string
  image_url: string
  title_color: string
  subtitle_color: string
  badge_color: string
  badge_text_color: string
  title_size: string
  subtitle_size: string
}

export function HeroEditor() {
  const [config, setConfig] = useState<HeroConfig>({
    badge_text: 'Academia de baile cubano',
    title: 'Habana Mix',
    subtitle: 'Donde el sabor de La Habana se aprende bailando. Salsa cubana, timba, bachata y rueda de casino.',
    image_url: '/images/hero-habana.png',
    title_color: '#ffffff',
    subtitle_color: 'rgba(255,255,255,0.7)',
    badge_color: 'rgba(255,255,255,0.1)',
    badge_text_color: '#ffffff',
    title_size: 'text-9xl',
    subtitle_size: 'text-lg'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_hero_config')
      if (error) throw error
      if (data) {
        setConfig(data as HeroConfig)
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
      console.log('Iniciando upload de imagen:', file.name, file.size)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `hero-${Date.now()}.${fileExt}`
      const filePath = `hero/${fileName}`

      console.log('Ruta del archivo:', filePath)

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      console.log('Resultado del upload:', { uploadError, uploadData })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      console.log('URL pública generada:', publicUrl)

      setConfig({ ...config, image_url: publicUrl })
      console.log('Config actualizada con nueva URL:', publicUrl)
      
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
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede superar 5MB')
        return
      }

      setImageFile(file)
      handleImageUpload(file)
    }
  }

  const handleRemoveImage = () => {
    setConfig({ ...config, image_url: '/images/hero-habana.png' })
    toast.info('Imagen restablecida')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Obtener admin_id de la sesión
      const sessionData = localStorage.getItem('admin_session')
      if (!sessionData) {
        toast.error('No hay sesión activa')
        return
      }
      
      const session = JSON.parse(sessionData)
      const adminId = session.admin_id
      
      console.log('Guardando configuración con image_url:', config.image_url)
      
      const { data, error } = await supabase.rpc('update_hero_config', {
        p_admin_id: adminId,
        p_badge_text: config.badge_text,
        p_title: config.title,
        p_subtitle: config.subtitle,
        p_image_url: config.image_url,
        p_title_color: config.title_color,
        p_subtitle_color: config.subtitle_color,
        p_badge_color: config.badge_color,
        p_badge_text_color: config.badge_text_color,
        p_title_size: config.title_size,
        p_subtitle_size: config.subtitle_size
      })

      console.log('Resultado del guardado:', { data, error })

      if (error) throw error

      if (data?.success) {
        console.log('Configuración guardada exitosamente')
        toast.success('Configuración guardada exitosamente')
      } else {
        console.error('La respuesta no indica éxito:', data)
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
    setConfig({
      badge_text: 'Academia de baile cubano',
      title: 'Habana Mix',
      subtitle: 'Donde el sabor de La Habana se aprende bailando. Salsa cubana, timba, bachata y rueda de casino.',
      image_url: '/images/hero-habana.png',
      title_color: '#ffffff',
      subtitle_color: 'rgba(255,255,255,0.7)',
      badge_color: 'rgba(255,255,255,0.1)',
      badge_text_color: '#ffffff',
      title_size: 'text-9xl',
      subtitle_size: 'text-lg'
    })
    toast.info('Configuración restablecida a valores por defecto')
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
        <h3 className="text-xl font-semibold">Configuración del Hero</h3>
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
        {/* Textos principales */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="font-medium text-sm text-muted-foreground">Textos principales</h4>
          
          <div className="space-y-2">
            <Label htmlFor="badge_text">Texto del badge</Label>
            <Input
              id="badge_text"
              value={config.badge_text}
              onChange={(e) => setConfig({ ...config, badge_text: e.target.value })}
              placeholder="Academia de baile cubano"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título principal</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Habana Mix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Textarea
              id="subtitle"
              value={config.subtitle}
              onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
              placeholder="Donde el sabor de La Habana se aprende bailando..."
              rows={3}
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
              placeholder="/images/hero-habana.png"
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

        {/* Colores */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Colores</h4>
          
          <div className="space-y-2">
            <Label htmlFor="title_color">Color del título</Label>
            <div className="flex gap-2">
              <Input
                id="title_color"
                type="color"
                value={config.title_color}
                onChange={(e) => setConfig({ ...config, title_color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={config.title_color}
                onChange={(e) => setConfig({ ...config, title_color: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle_color">Color del subtítulo</Label>
            <div className="flex gap-2">
              <Input
                id="subtitle_color"
                type="color"
                value={config.subtitle_color}
                onChange={(e) => setConfig({ ...config, subtitle_color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={config.subtitle_color}
                onChange={(e) => setConfig({ ...config, subtitle_color: e.target.value })}
                placeholder="rgba(255,255,255,0.7)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge_color">Color del badge</Label>
            <div className="flex gap-2">
              <Input
                id="badge_color"
                type="color"
                value={config.badge_color}
                onChange={(e) => setConfig({ ...config, badge_color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={config.badge_color}
                onChange={(e) => setConfig({ ...config, badge_color: e.target.value })}
                placeholder="rgba(255,255,255,0.1)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge_text_color">Color del texto del badge</Label>
            <div className="flex gap-2">
              <Input
                id="badge_text_color"
                type="color"
                value={config.badge_text_color}
                onChange={(e) => setConfig({ ...config, badge_text_color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={config.badge_text_color}
                onChange={(e) => setConfig({ ...config, badge_text_color: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Tamaños */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="font-medium text-sm text-muted-foreground">Tamaños</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title_size">Tamaño del título</Label>
              <select
                id="title_size"
                value={config.title_size}
                onChange={(e) => setConfig({ ...config, title_size: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="text-6xl">Pequeño</option>
                <option value="text-7xl">Mediano</option>
                <option value="text-8xl">Grande</option>
                <option value="text-9xl">Extra grande</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle_size">Tamaño del subtítulo</Label>
              <select
                id="subtitle_size"
                value={config.subtitle_size}
                onChange={(e) => setConfig({ ...config, subtitle_size: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="text-sm">Muy pequeño</option>
                <option value="text-base">Pequeño</option>
                <option value="text-lg">Mediano</option>
                <option value="text-xl">Grande</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}