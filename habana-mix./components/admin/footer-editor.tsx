'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface NavLink {
  label: string
  href: string
}

interface NavGroup {
  title: string
  links: NavLink[]
}

interface Social {
  label: string
  href: string
}

interface FooterConfig {
  description: string
  email: string
  copyright_text: string
  nav_groups: NavGroup[]
  socials: Social[]
}

const defaultConfig: FooterConfig = {
  description: 'Salsa cubana, timba y bachata con el sabor de La Habana. Más que una academia: una comunidad.',
  email: 'hola@habanamix.com',
  copyright_text: 'Hecho con sabor cubano',
  nav_groups: [
    {
      title: 'La academia',
      links: [
        { label: 'Próximos eventos', href: '#eventos' },
        { label: 'Nuestras clases', href: '#clases' },
        { label: 'Quiénes somos', href: '#nosotros' },
        { label: 'Cómo llegar', href: '#como-llegar' }
      ]
    },
    {
      title: 'Estilos',
      links: [
        { label: 'Salsa cubana', href: '#clases' },
        { label: 'Bachata', href: '#clases' },
        { label: 'Timba', href: '#clases' },
        { label: 'Rueda de casino', href: '#clases' }
      ]
    }
  ],
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'YouTube', href: 'https://youtube.com' }
  ]
}

export function FooterEditor() {
  const [config, setConfig] = useState<FooterConfig>(defaultConfig)
  const [socialIds, setSocialIds] = useState(() => defaultConfig.socials.map(() => crypto.randomUUID()))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_footer_config')
      if (error) throw error
      if (data) {
        const next = data as FooterConfig
        setConfig(next)
        setSocialIds(next.socials.map(() => crypto.randomUUID()))
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
      
      const { data, error } = await supabase.rpc('update_footer_config', {
        p_admin_id: adminId,
        p_description: config.description,
        p_email: config.email,
        p_copyright_text: config.copyright_text,
        p_nav_groups: config.nav_groups as any,
        p_socials: config.socials as any
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
    setSocialIds(defaultConfig.socials.map(() => crypto.randomUUID()))
    toast.info('Configuración restablecida a valores por defecto')
  }

  const addNavGroup = () => {
    setConfig({
      ...config,
      nav_groups: [...config.nav_groups, { title: '', links: [] }]
    })
  }

  const removeNavGroup = (groupIndex: number) => {
    setConfig({
      ...config,
      nav_groups: config.nav_groups.filter((_, i) => i !== groupIndex)
    })
  }

  const updateNavGroupTitle = (groupIndex: number, title: string) => {
    const newGroups = [...config.nav_groups]
    newGroups[groupIndex].title = title
    setConfig({ ...config, nav_groups: newGroups })
  }

  const addNavLink = (groupIndex: number) => {
    const newGroups = [...config.nav_groups]
    newGroups[groupIndex].links.push({ label: '', href: '' })
    setConfig({ ...config, nav_groups: newGroups })
  }

  const removeNavLink = (groupIndex: number, linkIndex: number) => {
    const newGroups = [...config.nav_groups]
    newGroups[groupIndex].links = newGroups[groupIndex].links.filter((_, i) => i !== linkIndex)
    setConfig({ ...config, nav_groups: newGroups })
  }

  const updateNavLink = (groupIndex: number, linkIndex: number, field: keyof NavLink, value: string) => {
    const newGroups = [...config.nav_groups]
    newGroups[groupIndex].links[linkIndex][field] = value
    setConfig({ ...config, nav_groups: newGroups })
  }

  const addSocial = () => {
    setConfig({
      ...config,
      socials: [...config.socials, { label: '', href: '' }]
    })
    setSocialIds((ids) => [...ids, crypto.randomUUID()])
  }

  const removeSocial = (index: number) => {
    setConfig({
      ...config,
      socials: config.socials.filter((_, i) => i !== index)
    })
    setSocialIds((ids) => ids.filter((_, i) => i !== index))
  }

  const updateSocial = (index: number, field: keyof Social, value: string) => {
    const newSocials = [...config.socials]
    newSocials[index][field] = value
    setConfig({ ...config, socials: newSocials })
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
        <h3 className="text-xl font-semibold">Configuración del Footer</h3>
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
            <Label htmlFor="description">Descripción del sitio</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Salsa cubana, timba y bachata..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email de contacto</Label>
            <Input
              id="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="hola@habanamix.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copyright_text">Texto de copyright</Label>
            <Input
              id="copyright_text"
              value={config.copyright_text}
              onChange={(e) => setConfig({ ...config, copyright_text: e.target.value })}
              placeholder="Hecho con sabor cubano"
            />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">Redes sociales</h4>
            <Button size="sm" variant="outline" onClick={addSocial}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar red social
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {config.socials.map((social, index) => (
              <div key={socialIds[index]} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    value={social.label}
                    onChange={(e) => updateSocial(index, 'label', e.target.value)}
                    placeholder="Nombre (ej: Instagram)"
                  />
                  <Input
                    value={social.href}
                    onChange={(e) => updateSocial(index, 'href', e.target.value)}
                    placeholder="URL (ej: https://instagram.com/usuario)"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeSocial(index)}
                  className="mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Grupos de navegación */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">Grupos de navegación</h4>
            <Button size="sm" variant="outline" onClick={addNavGroup}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar grupo
            </Button>
          </div>
          
          <div className="space-y-6">
            {config.nav_groups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={group.title}
                    onChange={(e) => updateNavGroupTitle(groupIndex, e.target.value)}
                    placeholder="Título del grupo (ej: La academia)"
                    className="font-medium"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeNavGroup(groupIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {group.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex gap-2 items-start">
                      <div className="flex-1 grid gap-2 md:grid-cols-2">
                        <Input
                          value={link.label}
                          onChange={(e) => updateNavLink(groupIndex, linkIndex, 'label', e.target.value)}
                          placeholder="Texto del enlace"
                        />
                        <Input
                          value={link.href}
                          onChange={(e) => updateNavLink(groupIndex, linkIndex, 'href', e.target.value)}
                          placeholder="URL (ej: #eventos)"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeNavLink(groupIndex, linkIndex)}
                        className="mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addNavLink(groupIndex)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar enlace
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}