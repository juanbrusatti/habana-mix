'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FreeAttendanceDialog } from '@/components/free-attendance-dialog'
import { PaidAttendanceDialog } from '@/components/paid-attendance-dialog'
import { cn } from '@/lib/utils'

interface BuyButtonProps {
  eventId: string
  eventTitle: string
  eventDate: string
  eventLocation: string | null
  isFree: boolean
  priceAmount: number | null
  priceLabel: string | null
  ctaLabel: string | null
  className?: string
  /** Texto alternativo cuando el botón vive en una barra fija angosta. */
  compact?: boolean
}

/**
 * Único punto de entrada a la compra en toda la web.
 *
 * La lógica de pago no cambió: sigue abriendo el mismo diálogo, que sigue
 * llamando a /api/payments/attempts y /api/payments/create-preference en ese
 * orden. Acá solo se unifica la presentación del botón.
 */
export function BuyButton({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  isFree,
  priceAmount,
  priceLabel,
  ctaLabel,
  className,
  compact = false,
}: BuyButtonProps) {
  const [open, setOpen] = useState(false)
  const unavailable = !isFree && !priceAmount

  const label = compact
    ? isFree
      ? 'Reservar'
      : 'Comprar'
    : (ctaLabel ?? (isFree ? 'Reservar lugar' : 'Comprar entrada'))

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        disabled={unavailable}
        className={cn(
          'cta-shine group bg-primary text-primary-foreground hover:bg-primary/90',
          'h-13 w-full rounded-full text-[15px] font-semibold',
          'transition-transform duration-200 active:scale-[0.97] disabled:opacity-50',
          className,
        )}
      >
        <span className="inline-flex items-center gap-2">
          {unavailable ? 'Próximamente' : label}
          {!unavailable && (
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </span>
      </Button>

      {isFree ? (
        <FreeAttendanceDialog
          eventId={eventId}
          eventTitle={eventTitle}
          eventDate={eventDate}
          eventLocation={eventLocation}
          open={open}
          onOpenChange={setOpen}
        />
      ) : priceAmount ? (
        <PaidAttendanceDialog
          eventId={eventId}
          eventTitle={eventTitle}
          eventDate={eventDate}
          eventLocation={eventLocation}
          amount={priceAmount}
          priceLabel={priceLabel}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  )
}
