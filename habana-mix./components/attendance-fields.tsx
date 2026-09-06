'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface AttendanceForm {
  name: string
  surname: string
  dni: string
  phone: string
  email: string
}

export type AttendanceFieldError = Partial<Record<'dni' | 'phone' | 'email', string>>

export const emptyAttendanceForm: AttendanceForm = {
  name: '',
  surname: '',
  dni: '',
  phone: '',
  email: '',
}

/**
 * Deriva a qué campo corresponde el error que devuelve la API
 * ("Este DNI ya fue registrado…", etc.) para marcarlo en el formulario.
 */
export function fieldErrorFromMessage(message: string): AttendanceFieldError {
  const normalized = message.toLowerCase()
  const next: AttendanceFieldError = {}
  if (normalized.includes('dni')) next.dni = message
  if (normalized.includes('tel')) next.phone = message
  if (normalized.includes('email')) next.email = message
  return next
}

/**
 * Campos de la reserva, compartidos por el flujo gratuito y el pago.
 *
 * Pensados para el pulgar: alto de 48px, teclado numérico en DNI y teléfono,
 * autocompletado del navegador activado. Antes eran cinco inputs genéricos
 * apilados y en el celular obligaban a cambiar de teclado a mano.
 */
export function AttendanceFields({
  form,
  errors,
  disabled,
  onChange,
}: {
  form: AttendanceForm
  errors: AttendanceFieldError
  disabled?: boolean
  onChange: (field: keyof AttendanceForm, value: string) => void
}) {
  const inputClass = 'h-12 text-base'

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="att-name">Nombre</Label>
          <Input
            id="att-name"
            className={inputClass}
            required
            autoComplete="given-name"
            disabled={disabled}
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-surname">Apellido</Label>
          <Input
            id="att-surname"
            className={inputClass}
            required
            autoComplete="family-name"
            disabled={disabled}
            value={form.surname}
            onChange={(event) => onChange('surname', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="att-dni">DNI</Label>
        <Input
          id="att-dni"
          className={inputClass}
          required
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={form.dni}
          aria-invalid={Boolean(errors.dni)}
          onChange={(event) => onChange('dni', event.target.value)}
        />
        {errors.dni && <p className="text-destructive text-xs">{errors.dni}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="att-phone">Teléfono</Label>
        <Input
          id="att-phone"
          className={inputClass}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          value={form.phone}
          aria-invalid={Boolean(errors.phone)}
          onChange={(event) => onChange('phone', event.target.value)}
        />
        {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="att-email">Email</Label>
        <Input
          id="att-email"
          className={inputClass}
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          disabled={disabled}
          value={form.email}
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => onChange('email', event.target.value)}
        />
        {errors.email ? (
          <p className="text-destructive text-xs">{errors.email}</p>
        ) : (
          <p className="text-muted-foreground text-xs">Acá te llega tu entrada con el QR.</p>
        )}
      </div>
    </div>
  )
}
