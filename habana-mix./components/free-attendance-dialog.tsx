'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AttendanceFields,
  emptyAttendanceForm,
  fieldErrorFromMessage,
  type AttendanceFieldError,
  type AttendanceForm,
} from '@/components/attendance-fields'
import { formatDateTimeRange } from '@/lib/event-format'

export function FreeAttendanceDialog({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  open,
  onOpenChange,
}: {
  eventId: string
  eventTitle: string
  eventDate?: string
  eventLocation?: string | null
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<AttendanceFieldError>({})
  const [form, setForm] = useState<AttendanceForm>(emptyAttendanceForm)

  useEffect(() => {
    if (!open) {
      setForm(emptyAttendanceForm)
      setFieldError({})
    }
  }, [open, eventId])

  const set = (field: keyof AttendanceForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'dni' || field === 'phone' || field === 'email') {
      setFieldError((current) => ({ ...current, [field]: undefined }))
    }
  }

  // --- Registro de asistencia gratuita: misma llamada que antes. ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (Object.values(form).some((value) => !value.trim())) {
      toast.error('Completá todos los campos')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          event_title: eventTitle,
          ...form,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        const message = String(json?.error || 'Error guardando asistencia')
        setFieldError((current) => ({ ...current, ...fieldErrorFromMessage(message) }))
        throw new Error(message)
      }

      toast.success('¡Listo! Tu lugar quedó reservado.')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }
  // --- fin ---

  if (!eventId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-md overflow-y-auto p-0">
        <div className="p-5 sm:p-6">
          <DialogHeader className="text-left">
            <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
              Reserva gratuita
            </p>
            <DialogTitle className="font-serif text-2xl leading-tight">{eventTitle}</DialogTitle>
          </DialogHeader>

          {(eventDate || eventLocation) && (
            <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
              {eventDate && (
                <li className="flex items-center gap-2">
                  <CalendarDays className="text-primary h-4 w-4 shrink-0" />
                  <span className="first-letter:uppercase">{formatDateTimeRange(eventDate, null)}</span>
                </li>
              )}
              {eventLocation && (
                <li className="flex items-center gap-2">
                  <MapPin className="text-primary h-4 w-4 shrink-0" />
                  <span>{eventLocation}</span>
                </li>
              )}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="mt-5">
            <AttendanceFields
              form={form}
              errors={fieldError}
              disabled={submitting}
              onChange={set}
            />

            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 h-13 w-full rounded-full text-[15px] font-semibold transition-transform duration-200 active:scale-[0.98]"
            >
              {submitting ? 'Enviando…' : 'Confirmar mi lugar'}
            </Button>

            <Button
              variant="ghost"
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground mt-1 h-11 w-full rounded-full"
            >
              Cancelar
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
