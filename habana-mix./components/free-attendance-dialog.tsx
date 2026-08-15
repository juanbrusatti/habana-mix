'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function FreeAttendanceDialog({
  eventId,
  eventTitle,
  open,
  onOpenChange,
}: {
  eventId: string
  eventTitle: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', surname: '', dni: '', phone: '', email: '' })

  useEffect(() => {
    if (!open) setForm({ name: '', surname: '', dni: '', phone: '', email: '' })
  }, [open, eventId])

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const keys: (keyof typeof form)[] = ['name', 'surname', 'dni', 'phone', 'email']
    for (const k of keys) {
      if (!form[k].trim()) {
        toast.error('Completa todos los campos obligatorios')
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          event_title: eventTitle,
          ...form,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error guardando asistencia')

      toast.success('Reserva registrada. Gracias!')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  if (!eventId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="p-4">
          <DialogHeader>
            <p className="text-sm text-primary font-semibold uppercase">Reserva gratuita</p>
            <DialogTitle className="font-serif text-xl">{eventTitle}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input required value={form.name} onChange={(e) => set('name')(e.target.value)} />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input required value={form.surname} onChange={(e) => set('surname')(e.target.value)} />
            </div>
            <div>
              <Label>DNI</Label>
              <Input required value={form.dni} onChange={(e) => set('dni')(e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input required value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input required type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
            </div>

            <div className="flex gap-2 mt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Confirmar reserva'}
              </Button>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
