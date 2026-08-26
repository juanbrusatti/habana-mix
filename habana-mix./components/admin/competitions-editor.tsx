'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Image as ImageIcon, Calendar, Layout } from 'lucide-react'
import type { Competition } from '@/lib/competition-types'
import { CompetitionContentEditor } from './competition-content-editor'

export function CompetitionsEditor() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    cover_image_url: '',
    is_active: true,
    sort_order: 0
  })

  const emptyForm = {
    slug: '',
    title: '',
    description: '',
    cover_image_url: '',
    is_active: true,
    sort_order: 0
  }

  useEffect(() => {
    loadCompetitions()
  }, [])

  const loadCompetitions = async () => {
    try {
      console.log('Cargando competiciones...')
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('sort_order')

      if (error) {
        console.error('Error en la consulta de competiciones:', error)
        throw error
      }
      
      console.log('Competiciones cargadas:', data)
      setCompetitions(data || [])
    } catch (error) {
      console.error('Error cargando competiciones:', error)
      toast.error('Error al cargar competiciones')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCompetition(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition)
    setFormData({
      slug: competition.slug,
      title: competition.title,
      description: competition.description || '',
      cover_image_url: competition.cover_image_url || '',
      is_active: competition.is_active,
      sort_order: competition.sort_order
    })
    setShowForm(true)
  }

  const handleManageContent = (competition: Competition) => {
    setSelectedCompetition(competition)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const competitionData = {
        slug: formData.slug,
        title: formData.title,
        description: formData.description || null,
        cover_image_url: formData.cover_image_url || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      }

      console.log('Datos a guardar:', competitionData)

      if (editingCompetition) {
        const { error } = await supabase
          .from('competitions')
          .update(competitionData)
          .eq('id', editingCompetition.id)

        if (error) {
          console.error('Error actualizando competición:', error)
          throw error
        }
        toast.success('Competición actualizada')
      } else {
        const { data, error } = await supabase
          .from('competitions')
          .insert(competitionData)
          .select()

        if (error) {
          console.error('Error insertando competición:', error)
          throw error
        }
        console.log('Competición insertada:', data)
        toast.success('Competición creada')
      }

      setShowForm(false)
      setFormData(emptyForm)
      setEditingCompetition(null)
      loadCompetitions()
    } catch (error) {
      console.error('Error guardando competición:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar competición')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta competición?')) return

    try {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Competición eliminada')
      loadCompetitions()
    } catch (error) {
      console.error('Error eliminando competición:', error)
      toast.error('Error al eliminar competición')
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `competition-${Date.now()}.${fileExt}`
      const filePath = `competitions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, cover_image_url: publicUrl }))
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
    setFormData((prev) => ({ ...prev, cover_image_url: '' }))
    toast.info('Imagen eliminada')
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando...</div>
  }

  // Si hay una competición seleccionada, mostrar el editor de contenido
  if (selectedCompetition) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedCompetition(null)}
            className="w-full sm:w-auto"
          >
            ← Volver a competiciones
          </Button>
          <h3 className="text-lg sm:text-xl font-semibold">
            Editando: {selectedCompetition.title}
          </h3>
        </div>
        <CompetitionContentEditor competitionId={selectedCompetition.id} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg sm:text-xl font-semibold">Competencias</h3>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva competición
        </Button>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center p-8 sm:p-12 border rounded-lg">
          <p className="text-muted-foreground">No hay competiciones creadas</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {competitions.map((competition) => (
            <div key={competition.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-base">{competition.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${competition.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {competition.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {competition.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{competition.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">/{competition.slug}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" onClick={() => handleManageContent(competition)} className="flex-1 sm:flex-none">
                    <Layout className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(competition)} className="flex-1 sm:flex-none">
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(competition.id)} className="flex-1 sm:flex-none">
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompetition ? 'Editar competición' : 'Nueva competición'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
                placeholder="competencia-2024"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Imagen de portada</Label>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="cover_image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="text-base"
                  />
                  {formData.cover_image_url && (
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
                    Subiendo imagen...
                  </div>
                )}
                {formData.cover_image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img
                      src={formData.cover_image_url}
                      alt="Vista previa"
                      className="w-full h-32 sm:h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Orden</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Activa</Label>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}