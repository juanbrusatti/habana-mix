'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, ImageIcon, UploadCloud, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import type { EventSection } from '@/lib/types'

interface EventContentEditorProps {
  eventId: string
  eventTitle: string
}

export function EventContentEditor({ eventId, eventTitle }: EventContentEditorProps) {
  const [sections, setSections] = useState<EventSection[]>([])
  const [loading, setLoading] = useState(true)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [editingSection, setEditingSection] = useState<EventSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    sort_order: 0,
  })

  const emptyForm = {
    title: '',
    description: '',
    image_url: '',
    sort_order: 0,
  }

  useEffect(() => {
    loadSections()
  }, [eventId])

  const loadSections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_sections')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true })

      if (error) {
        // Si la tabla no existe o falla, reportar limpiamente
        console.error('Error al cargar secciones del evento:', error)
        throw error
      }

      setSections(data || [])
    } catch (error: any) {
      console.error('Error cargando secciones:', error)
      toast.error('Error al cargar las imágenes del evento')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSection = () => {
    setEditingSection(null)
    setFormData({
      ...emptyForm,
      sort_order: sections.length,
    })
    setShowSectionForm(true)
  }

  const handleEditSection = (section: EventSection) => {
    setEditingSection(section)
    setFormData({
      title: section.title || '',
      description: section.description || '',
      image_url: section.image_url || '',
      sort_order: section.sort_order,
    })
    setShowSectionForm(true)
  }

  const handleSingleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `event-section-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `events/sections/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, image_url: publicUrl }))
      toast.success('Imagen cargada correctamente')
    } catch (error: any) {
      console.error('Error subiendo imagen:', error)
      toast.error(error.message || 'Error al subir la imagen')
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede superar 10MB')
      return
    }

    handleSingleImageUpload(file)
  }

  // Carga masiva directa de múltiples fotos desde el dispositivo
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setBatchUploading(true)
    const fileList = Array.from(files)
    let successCount = 0
    const startOrder = sections.length

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (!file.type.startsWith('image/')) continue

        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `event-section-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `events/sections/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Error subiendo archivo batch:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        const { error: insertError } = await supabase
          .from('event_sections')
          .insert({
            event_id: eventId,
            image_url: publicUrl,
            sort_order: startOrder + i,
          })

        if (!insertError) {
          successCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Se subieron ${successCount} imágenes con éxito`)
        await loadSections()
      } else {
        toast.error('No se pudo subir ninguna imagen')
      }
    } catch (error: any) {
      console.error('Error en carga múltiple:', error)
      toast.error('Ocurrió un error en la carga múltiple')
    } finally {
      setBatchUploading(false)
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = ''
      }
    }
  }

  const handleSubmitSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.image_url) {
      toast.error('Debes seleccionar o subir una imagen')
      return
    }

    setSaving(true)
    try {
      const sectionData = {
        event_id: eventId,
        title: formData.title.trim() || null,
        description: formData.description.trim() || null,
        image_url: formData.image_url,
        sort_order: formData.sort_order,
      }

      if (editingSection) {
        const { error } = await supabase
          .from('event_sections')
          .update(sectionData)
          .eq('id', editingSection.id)

        if (error) throw error
        toast.success('Imagen actualizada')
      } else {
        const { error } = await supabase
          .from('event_sections')
          .insert(sectionData)

        if (error) throw error
        toast.success('Imagen agregada')
      }

      setShowSectionForm(false)
      setFormData(emptyForm)
      setEditingSection(null)
      loadSections()
    } catch (error: any) {
      console.error('Error guardando imagen:', error)
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen de la sección?')) return

    try {
      const { error } = await supabase
        .from('event_sections')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Imagen eliminada')
      loadSections()
    } catch (error: any) {
      console.error('Error eliminando imagen:', error)
      toast.error('Error al eliminar imagen')
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sections.length) return

    const currentItem = sections[index]
    const targetItem = sections[targetIndex]

    try {
      await Promise.all([
        supabase
          .from('event_sections')
          .update({ sort_order: targetItem.sort_order })
          .eq('id', currentItem.id),
        supabase
          .from('event_sections')
          .update({ sort_order: currentItem.sort_order })
          .eq('id', targetItem.id),
      ])
      loadSections()
    } catch (error) {
      console.error('Error cambiando orden:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Cargando imágenes del evento...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Botones de acción superiores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border">
        <div>
          <h4 className="font-semibold text-base">Galería / Secciones de Fotos</h4>
          <p className="text-xs text-muted-foreground">
            {sections.length === 1 ? '1 imagen cargada' : `${sections.length} imágenes cargadas`} para este evento
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Input oculto para carga rápida masiva */}
          <input
            type="file"
            ref={batchFileInputRef}
            onChange={handleBatchUpload}
            multiple
            accept="image/*"
            className="hidden"
            id="batch-event-upload"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => batchFileInputRef.current?.click()}
            disabled={batchUploading}
            className="w-full sm:w-auto"
          >
            {batchUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo fotos...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" />
                Subir varias fotos
              </>
            )}
          </Button>

          <Button onClick={handleCreateSection} size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nueva imagen / sección
          </Button>
        </div>
      </div>

      {/* Lista de imágenes cargadas */}
      {sections.length === 0 ? (
        <div className="text-center p-8 sm:p-12 border border-dashed rounded-xl bg-muted/20">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="font-medium text-foreground">No hay imágenes cargadas en este evento</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Subí fotos desde tu dispositivo para que los usuarios las vean cuando toquen &quot;Ver detalles&quot;.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => batchFileInputRef.current?.click()}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Subir fotos desde dispositivo
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className="group border rounded-xl overflow-hidden bg-card flex flex-col shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={section.image_url}
                  alt={section.title || 'Foto de evento'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md font-medium">
                  #{idx + 1}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  {section.title ? (
                    <h5 className="font-semibold text-sm line-clamp-1">{section.title}</h5>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Sin título</span>
                  )}
                  {section.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {section.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Agregar/Editar sección individual */}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Editar imagen de evento' : 'Agregar imagen'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitSection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image_file">Seleccionar imagen desde tu dispositivo *</Label>
              <Input
                id="image_file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="text-base"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo imagen a Supabase...
                </div>
              )}
            </div>

            {formData.image_url && (
              <div className="rounded-xl overflow-hidden border bg-muted/40 p-2">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={formData.image_url}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sec_title">Título o epígrafe (opcional)</Label>
              <Input
                id="sec_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Pista de baile, Shows especiales..."
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sec_description">Descripción o detalle (opcional)</Label>
              <Textarea
                id="sec_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Texto explicativo adicional..."
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sec_order">Número de orden</Label>
              <Input
                id="sec_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="text-base"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSectionForm(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || uploading || !formData.image_url}
                className="w-full sm:w-auto"
              >
                {saving ? 'Guardando...' : editingSection ? 'Actualizar' : 'Guardar imagen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
