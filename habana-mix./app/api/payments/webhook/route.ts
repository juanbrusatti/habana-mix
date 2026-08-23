import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createTicketCode, createTicketToken, hashTicketToken, sendTicketEmail } from '@/lib/ticket-utils'

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()
    const paymentId = body?.data?.id || body?.id
    const type = body?.type || body?.topic

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN')

    const client = new MercadoPagoConfig({ accessToken })
    const payment = await new Payment(client).get({ id: String(paymentId) })
    const attendanceId = payment.external_reference

    if (!attendanceId) return NextResponse.json({ received: true })

    const statusMap: Record<string, string> = {
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'rejected',
      refunded: 'refunded',
      charged_back: 'refunded',
      pending: 'pending',
      in_process: 'pending',
      in_mediation: 'pending',
    }
    const paymentStatus = statusMap[payment.status || ''] || 'pending'

    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', attendanceId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return NextResponse.json({ received: true })

    const amountMatches = Number(payment.transaction_amount) === Number(order.amount)
    const currencyMatches = !order.currency || payment.currency_id === order.currency

    if (paymentStatus === 'approved' && (!amountMatches || !currencyMatches)) {
      console.error('Pago de Mercado Pago rechazado por importe o moneda inesperados', {
        attendanceId,
        transactionAmount: payment.transaction_amount,
        expectedAmount: order.amount,
        currency: payment.currency_id,
        expectedCurrency: order.currency,
      })
      return NextResponse.json({ received: true })
    }

    const { error: updateError } = await supabaseAdmin
      .from('payment_orders')
      .update({
        status: paymentStatus,
        payment_id: String(payment.id),
        approved_at: paymentStatus === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', order.id)

    if (updateError) throw updateError

    // Si el pago está aprobado, crear la asistencia y enviar email
    if (paymentStatus === 'approved') {
      const { data: existingAttendance, error: existingError } = await supabaseAdmin
        .from('attendances')
        .select('id, ticket_code, ticket_token')
        .eq('payment_id', String(payment.id))
        .maybeSingle()

      if (existingError) throw existingError
      if (!existingAttendance) {
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
              payment_id: String(payment.id),
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
          if (attendanceError.code !== '23505') {
            console.error('Error creando asistencia en webhook:', attendanceError)
          }
        } else {
          // Enviar email con el ticket
          const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
          const ticketUrl = `${siteUrl}/entrada/${ticketToken}`
          const emailSent = await sendTicketEmail({
            email: order.email,
            name: order.name,
            eventTitle: order.event_title,
            ticketCode,
            ticketUrl,
          })

          if (emailSent) {
            await supabaseAdmin
              .from('attendances')
              .update({ ticket_email_sent_at: new Date().toISOString() })
              .eq('payment_id', String(payment.id))
          }

          console.log(`Asistencia creada y email enviado para pago ${paymentId}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
