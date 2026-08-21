import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createTicketCode, createTicketToken, hashTicketToken, sendTicketEmail } from '@/lib/ticket-utils'

interface PaymentOrder {
  id: string
  event_id: string
  event_title: string
  name: string
  surname: string
  dni: string
  phone: string
  email: string
  amount: number | string
  currency: string
  preference_id: string | null
}

export async function finalizeApprovedPayment(
  supabaseAdmin: SupabaseClient,
  order: PaymentOrder,
  paymentId: string,
) {
  const { data: existingAttendance, error: existingError } = await supabaseAdmin
    .from('attendances')
    .select('id, ticket_code, ticket_token, ticket_email_sent_at')
    .eq('payment_id', paymentId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existingAttendance) {
    return {
      token: existingAttendance.ticket_token,
      code: existingAttendance.ticket_code,
      emailSent: Boolean(existingAttendance.ticket_email_sent_at),
    }
  }

  let ticketCode = ''
  let ticketToken = ''
  let attendanceError: { code?: string; message?: string } | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    ticketCode = createTicketCode()
    ticketToken = createTicketToken()
    const result = await supabaseAdmin
      .from('attendances')
      .insert({
        event_id: order.event_id,
        event_title: order.event_title,
        name: order.name,
        surname: order.surname,
        dni: order.dni,
        phone: order.phone,
        email: order.email,
        is_free: false,
        payment_status: 'approved',
        payment_provider: 'mercadopago',
        payment_preference_id: order.preference_id,
        payment_id: paymentId,
        payment_amount: order.amount,
        payment_currency: order.currency,
        paid_at: new Date().toISOString(),
        ticket_code: ticketCode,
        ticket_token: ticketToken,
        ticket_token_hash: hashTicketToken(ticketToken),
      })

    attendanceError = result.error
    if (!attendanceError || attendanceError.code !== '23505') break
  }

  if (attendanceError) {
    if (attendanceError.code === '23505') {
      const { data: concurrentAttendance } = await supabaseAdmin
        .from('attendances')
        .select('ticket_code, ticket_token, ticket_email_sent_at')
        .eq('payment_id', paymentId)
        .maybeSingle()

      if (concurrentAttendance) {
        return {
          token: concurrentAttendance.ticket_token,
          code: concurrentAttendance.ticket_code,
          emailSent: Boolean(concurrentAttendance.ticket_email_sent_at),
        }
      }
      throw new Error('Estos datos ya tienen una reserva aprobada para este evento.')
    }
    throw attendanceError
  }

  const { error: orderError } = await supabaseAdmin
    .from('payment_orders')
    .update({ status: 'approved', payment_id: paymentId, approved_at: new Date().toISOString() })
    .eq('id', order.id)

  if (orderError) throw orderError

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
  const emailSent = await sendTicketEmail({
    email: order.email,
    name: order.name,
    eventTitle: order.event_title,
    ticketCode,
    ticketUrl: `${siteUrl}/entrada/${ticketToken}`,
  })

  if (emailSent) {
    await supabaseAdmin
      .from('attendances')
      .update({ ticket_email_sent_at: new Date().toISOString() })
      .eq('payment_id', paymentId)
  }

  return { token: ticketToken, code: ticketCode, emailSent }
}
