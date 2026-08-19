'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function PaidAttendanceDialog({
  eventId,
  eventTitle,
  amount,
  open,
  onOpenChange,
}: {
  eventId: string
  eventTitle: string
  amount: number | null
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<{ dni?: string; phone?: string; email?: string }>({})
  const [form, setForm] = useState({ name: '', surname: '', dni: '', phone: '', email: '' })

  useEffect(() => {
    if (!open) {
      setForm({ name: '', surname: '', dni: '', phone: '', email: '' })
      setFieldError({})
    }
  }, [open, eventId])

  const set = (field: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'dni' || field === 'phone' || field === 'email') {
      setFieldError((current) => ({ ...current, [field]: undefined }))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Este evento todavía no tiene un precio válido')
      return
    }

    if (Object.values(form).some((value) => !value.trim())) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ...form }),
      })
      const json = await response.json()

      if (!response.ok) {
        const message = String(json?.error || 'No se pudo iniciar el pago')
        const normalized = message.toLowerCase()
        if (normalized.includes('dni')) setFieldError((current) => ({ ...current, dni: message }))
        if (normalized.includes('tel')) setFieldError((current) => ({ ...current, phone: message }))
        if (normalized.includes('email')) setFieldError((current) => ({ ...current, email: message }))
        throw new Error(message)
      }

      window.location.assign(json.init_point)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el pago')
      setSubmitting(false)
    }
  }

  if (!eventId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="p-4">
          <DialogHeader>
            <p className="text-sm font-semibold uppercase text-primary">Reserva con pago</p>
            <DialogTitle className="font-serif text-xl">{eventTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Total a pagar: ${amount?.toLocaleString('es-AR')} ARS
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input required value={form.name} onChange={(event) => set('name')(event.target.value)} />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input required value={form.surname} onChange={(event) => set('surname')(event.target.value)} />
            </div>
            <div>
              <Label>DNI</Label>
              <Input required value={form.dni} onChange={(event) => set('dni')(event.target.value)} aria-invalid={Boolean(fieldError.dni)} />
              {fieldError.dni && <p className="mt-1 text-xs text-red-500">{fieldError.dni}</p>}
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input required value={form.phone} onChange={(event) => set('phone')(event.target.value)} aria-invalid={Boolean(fieldError.phone)} />
              {fieldError.phone && <p className="mt-1 text-xs text-red-500">{fieldError.phone}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input required type="email" value={form.email} onChange={(event) => set('email')(event.target.value)} aria-invalid={Boolean(fieldError.email)} />
              {fieldError.email && <p className="mt-1 text-xs text-red-500">{fieldError.email}</p>}
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Preparando pago…' : 'Pagar con Mercado Pago'}
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
