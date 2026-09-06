'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
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
import { formatDateTimeRange, formatPrice } from '@/lib/event-format'

export function PaidAttendanceDialog({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  amount,
  priceLabel,
  open,
  onOpenChange,
}: {
  eventId: string
  eventTitle: string
  eventDate?: string
  eventLocation?: string | null
  amount: number | null
  priceLabel?: string | null
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

  // --- Lógica de pago: idéntica a la anterior. No cambiar sin revisar Mercado Pago. ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Este evento todavía no tiene un precio válido')
      return
    }

    if (Object.values(form).some((value) => !value.trim())) {
      toast.error('Completá todos los campos')
      return
    }

    setSubmitting(true)
    try {
      // Primero registrar el intento de pago en la tabla de seguridad
      const attemptResponse = await fetch('/api/payments/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          event_title: eventTitle,
          amount,
          ...form,
        }),
      })

      if (!attemptResponse.ok) {
        console.warn('No se pudo registrar el intento de pago, pero continuando con el proceso')
      }

      // Luego crear la preferencia de MercadoPago
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ...form }),
      })
      const json = await response.json()

      if (!response.ok) {
        const message = String(json?.error || 'No se pudo iniciar el pago')
        setFieldError((current) => ({ ...current, ...fieldErrorFromMessage(message) }))
        throw new Error(message)
      }

      window.location.assign(json.init_point)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar el pago')
      setSubmitting(false)
    }
  }
  // --- fin de la lógica de pago ---

  if (!eventId) return null

  const total = formatPrice(amount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-md overflow-y-auto p-0">
        <div className="p-5 sm:p-6">
          <DialogHeader className="text-left">
            <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
              Tu entrada
            </p>
            <DialogTitle className="font-serif text-2xl leading-tight">{eventTitle}</DialogTitle>
          </DialogHeader>

          {/* Contexto del evento: el que compra confirma qué está comprando. */}
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

          <div className="border-border/70 bg-secondary/40 mt-4 flex items-baseline justify-between rounded-xl border px-4 py-3">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="font-serif text-2xl font-semibold">{total}</span>
          </div>
          {priceLabel && priceLabel !== total && (
            <p className="text-muted-foreground mt-1.5 text-xs">{priceLabel}</p>
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
              {submitting ? 'Preparando el pago…' : `Pagar ${total} con Mercado Pago`}
            </Button>

            <p className="text-muted-foreground mt-3 flex items-start gap-2 text-xs leading-relaxed">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Te llevamos a Mercado Pago para completar el pago. Apenas se aprueba, tu entrada con
                el código QR te llega por email.
              </span>
            </p>

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
