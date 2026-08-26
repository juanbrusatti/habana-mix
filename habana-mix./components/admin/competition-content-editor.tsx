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
import { Plus, Edit2, Trash2, ImageIcon, Calendar } from 'lucide-react'
import type { CompetitionSection, CompetitionSchedule } from '@/lib/competition-types'

interface CompetitionContentEditorProps {
  competitionId: string
}

export function CompetitionContentEditor({ competitionId }: CompetitionContentEditorProps) {
  const [sections, setSections] = useState<CompetitionSection[]>([])
  const [schedules, setSchedules] = useState<CompetitionSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingSection, setEditingSection] = useState<CompetitionSection | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<CompetitionSchedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Section form data
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    button_text: '',
    button_url: '',
    sort_order: 0
  })

  // Schedule form data
  const [scheduleFormData, setScheduleFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    sort_order: 0
  })

  const emptySectionForm = {
    title: '',
    description: '',
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    button_text: '',
    button_url: '',
    sort_order: 0
  }

  const emptyScheduleForm = {
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    sort_order: 0
  }

  useEffect(() => {
    loadContent()
  }, [competitionId])

  const loadContent = async () => {
    try {
      const [{ data: sectionsData }, { data: schedulesData }] = await Promise.all([
        supabase
          .from('competition_sections')
          .select('*')
          .eq('competition_id', competitionId)
          .order('sort_order'),
        supabase
          .from('competition_schedules')
          .select('*')
          .eq('competition_id', competitionId)
          .order('start_time')
      ])

      setSections(sectionsData || [])
      setSchedules(schedulesData || [])
    } catch (error) {
      console.error('Error cargando contenido:', error)
      toast.error('Error al cargar contenido')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSection = () => {
    setEditingSection(null)
    setSectionFormData(emptySectionForm)
    setShowSectionForm(true)
  }

  const handleEditSection = (section: CompetitionSection) => {
    setEditingSection(section)
    setSectionFormData({
      title: section.title || '',
      description: section.description || '',
      media_url: section.media_url || '',
      media_type: section.media_type,
      button_text: section.button_text || '',
      button_url: section.button_url || '',
      sort_order: section.sort_order
    })
    setShowSectionForm(true)
  }

  const handleSubmitSection = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const sectionData = {
        competition_id: competitionId,
        title: sectionFormData.title || null,
        description: sectionFormData.description || null,
        media_url: sectionFormData.media_url || null,
        media_type: sectionFormData.media_type,
        button_text: sectionFormData.button_text || null,
        button_url: sectionFormData.button_url || null,
        sort_order: sectionFormData.sort_order
      }

      if (editingSection) {
        const { error } = await supabase
          .from('competition_sections')
          .update(sectionData)
          .eq('id', editingSection.id)

        if (error) throw error
        toast.success('Sección actualizada')
      } else {
        const { error } = await supabase
          .from('competition_sections')
          .insert(sectionData)

        if (error) throw error
        toast.success('Sección creada')
      }

      setShowSectionForm(false)
      setSectionFormData(emptySectionForm)
      setEditingSection(null)
      loadContent()
    } catch (error) {
      console.error('Error guardando sección:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar sección')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm('¿Eliminar esta sección?')) return

    try {
      const { error } = await supabase
        .from('competition_sections')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Sección eliminada')
      loadContent()
    } catch (error) {
      console.error('Error eliminando sección:', error)
      toast.error('Error al eliminar sección')
    }
  }

  const handleCreateSchedule = () => {
    setEditingSchedule(null)
    setScheduleFormData(emptyScheduleForm)
    setShowScheduleForm(true)
  }

  const handleEditSchedule = (schedule: CompetitionSchedule) => {
    setEditingSchedule(schedule)
    setScheduleFormData({
      title: schedule.title,
      description: schedule.description || '',
      start_time: schedule.start_time.slice(0, 16),
      end_time: schedule.end_time ? schedule.end_time.slice(0, 16) : '',
      location: schedule.location || '',
      sort_order: schedule.sort_order
    })
    setShowScheduleForm(true)
  }

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const scheduleData = {
        competition_id: competitionId,
        title: scheduleFormData.title,
        description: scheduleFormData.description || null,
        start_time: new Date(scheduleFormData.start_time).toISOString(),
        end_time: scheduleFormData.end_time ? new Date(scheduleFormData.end_time).toISOString() : null,
        location: scheduleFormData.location || null,
        sort_order: scheduleFormData.sort_order
      }

      if (editingSchedule) {
        const { error } = await supabase
          .from('competition_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id)

        if (error) throw error
        toast.success('Horario actualizado')
      } else {
        const { error } = await supabase
          .from('competition_schedules')
          .insert(scheduleData)

        if (error) throw error
        toast.success('Horario creado')
      }

      setShowScheduleForm(false)
      setScheduleFormData(emptyScheduleForm)
      setEditingSchedule(null)
      loadContent()
    } catch (error) {
      console.error('Error guardando horario:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar horario')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return

    try {
      const { error } = await supabase
        .from('competition_schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Horario eliminado')
      loadContent()
    } catch (error) {
      console.error('Error eliminando horario:', error)
      toast.error('Error al eliminar horario')
    }
  }

  const handleSectionImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `competition-section-${Date.now()}.${fileExt}`
      const filePath = `competition-sections/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setSectionFormData((prev) => ({ ...prev, image_url: publicUrl }))
      toast.success('Imagen subida exitosamente')
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Determinar el tipo de archivo
    if (file.type.startsWith('image/')) {
      setSectionFormData({ ...sectionFormData, media_type: 'image' })
    } else if (file.type.startsWith('video/')) {
      setSectionFormData({ ...sectionFormData, media_type: 'video' })
    } else {
      toast.error('Solo se permiten archivos de imagen o video')
      return
    }

    // Validar tamaño (máximo 50MB para videos, 5MB para imágenes)
    const maxSize = sectionFormData.media_type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`El archivo no puede superar ${sectionFormData.media_type === 'video' ? '50MB' : '5MB'}`)
      return
    }

    handleSectionMediaUpload(file)
  }

  const handleSectionMediaUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `competition-section-${Date.now()}.${fileExt}`
      const filePath = `competition-sections/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setSectionFormData((prev) => ({ ...prev, media_url: publicUrl }))
      toast.success('Archivo subido exitosamente')
    } catch (error) {
      console.error('Error subiendo archivo:', error)
      toast.error('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando contenido...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="w-full flex-wrap h-auto data-horizontal:h-auto min-h-[40px] sm:min-h-[36px]">
          <TabsTrigger value="sections" className="text-xs sm:text-sm px-3 py-2 sm:px-4 flex items-center gap-2">
            <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            Secciones ({sections.length})
          </TabsTrigger>
          <TabsTrigger value="schedules" className="text-xs sm:text-sm px-3 py-2 sm:px-4 flex items-center gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            Horarios ({schedules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateSection} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nueva sección
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">No hay secciones creadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      {section.title && <h4 className="font-semibold">{section.title}</h4>}
                      {section.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{section.description}</p>
                      )}
                      {section.media_url && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {section.media_type === 'video' ? '🎥 Video' : '📷 Imagen'}
                        </p>
                      )}
                      {section.button_text && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Botón: {section.button_text}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" variant="outline" onClick={() => handleEditSection(section)} className="flex-1 sm:flex-none">
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSection(section.id)} className="flex-1 sm:flex-none">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateSchedule} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo horario
            </Button>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">No hay horarios creados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <h4 className="font-semibold">{schedule.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(schedule.start_time).toLocaleString('es-AR')}
                      </p>
                      {schedule.location && (
                        <p className="text-xs text-muted-foreground">{schedule.location}</p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" variant="outline" onClick={() => handleEditSchedule(schedule)} className="flex-1 sm:flex-none">
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)} className="flex-1 sm:flex-none">
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Section Form Modal */}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Editar sección' : 'Nueva sección'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitSection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section_title">Título</Label>
              <Input
                id="section_title"
                value={sectionFormData.title}
                onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_description">Descripción</Label>
              <Textarea
                id="section_description"
                value={sectionFormData.description}
                onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_media">Imagen o Video</Label>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="section_media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleSectionFileChange}
                    disabled={uploading}
                    className="text-base"
                  />
                  {sectionFormData.media_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSectionFormData({ ...sectionFormData, media_url: '' })}
                      className="w-full sm:w-auto"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Subiendo archivo...
                  </div>
                )}
                {sectionFormData.media_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    {sectionFormData.media_type === 'video' ? (
                      <video
                        src={sectionFormData.media_url}
                        controls
                        className="w-full h-32 sm:h-48 object-cover"
                      />
                    ) : (
                      <img
                        src={sectionFormData.media_url}
                        alt="Vista previa"
                        className="w-full h-32 sm:h-48 object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_button_text">Texto del botón</Label>
              <Input
                id="section_button_text"
                value={sectionFormData.button_text}
                onChange={(e) => setSectionFormData({ ...sectionFormData, button_text: e.target.value })}
                placeholder="Reserva tu lugar"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_button_url">URL del botón</Label>
              <Input
                id="section_button_url"
                value={sectionFormData.button_url}
                onChange={(e) => setSectionFormData({ ...sectionFormData, button_url: e.target.value })}
                placeholder="https://wa.me/..."
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section_order">Orden</Label>
              <Input
                id="section_order"
                type="number"
                value={sectionFormData.sort_order}
                onChange={(e) => setSectionFormData({ ...sectionFormData, sort_order: parseInt(e.target.value) })}
                className="text-base"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSectionForm(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Form Modal */}
      <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Editar horario' : 'Nuevo horario'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule_title">Título *</Label>
              <Input
                id="schedule_title"
                value={scheduleFormData.title}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, title: e.target.value })}
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_description">Descripción</Label>
              <Textarea
                id="schedule_description"
                value={scheduleFormData.description}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, description: e.target.value })}
                rows={2}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_start">Inicio *</Label>
              <Input
                id="schedule_start"
                type="datetime-local"
                value={scheduleFormData.start_time}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, start_time: e.target.value })}
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_end">Fin</Label>
              <Input
                id="schedule_end"
                type="datetime-local"
                value={scheduleFormData.end_time}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, end_time: e.target.value })}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_location">Ubicación</Label>
              <Input
                id="schedule_location"
                value={scheduleFormData.location}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, location: e.target.value })}
                placeholder="Sala principal..."
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_order">Orden</Label>
              <Input
                id="schedule_order"
                type="number"
                value={scheduleFormData.sort_order}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, sort_order: parseInt(e.target.value) })}
                className="text-base"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)} className="w-full sm:w-auto">
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