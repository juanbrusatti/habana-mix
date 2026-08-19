import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createTicketCode, createTicketToken, hashTicketToken, sendTicketEmail } from '@/lib/ticket-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const paymentId = String(body?.payment_id || '')
    const orderId = String(body?.external_reference || '')

    if (!paymentId || !orderId) {
      return NextResponse.json({ error: 'Faltan datos del pago' }, { status: 400 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN')

    const supabaseAdmin = getSupabaseAdmin()
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    const client = new MercadoPagoConfig({ accessToken })
    const payment = await new Payment(client).get({ id: paymentId })

    if (payment.external_reference !== order.id) {
      return NextResponse.json({ error: 'El pago no corresponde a esta orden' }, { status: 409 })
    }

    const amountMatches = Number(payment.transaction_amount) === Number(order.amount)
    const currencyMatches = payment.currency_id === order.currency

    if (payment.status !== 'approved' || !amountMatches || !currencyMatches) {
      return NextResponse.json({ error: 'El pago todavía no está aprobado' }, { status: 409 })
    }

    const { data: existingAttendance, error: existingError } = await supabaseAdmin
      .from('attendances')
      .select('id, ticket_code, ticket_token')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existingError) throw existingError
    if (existingAttendance) {
      return NextResponse.json({
        confirmed: true,
        ticket: {
          token: existingAttendance.ticket_token,
          code: existingAttendance.ticket_code,
          eventTitle: order.event_title,
          name: `${order.name} ${order.surname}`,
          emailSent: false,
        },
      })
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
        return NextResponse.json({ error: 'Estos datos ya tienen una reserva aprobada para este evento.' }, { status: 409 })
      }
      throw attendanceError
    }

    const { error: updateError } = await supabaseAdmin
      .from('payment_orders')
      .update({ status: 'approved', payment_id: paymentId, approved_at: new Date().toISOString() })
      .eq('id', order.id)

    if (updateError) throw updateError

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
        .eq('payment_id', paymentId)
    }

    return NextResponse.json({
      confirmed: true,
      ticket: {
        token: ticketToken,
        code: ticketCode,
        eventTitle: order.event_title,
        name: `${order.name} ${order.surname}`,
        emailSent,
      },
    })
  } catch (error) {
    console.error('Error confirmando pago:', error)
    return NextResponse.json({ error: 'No se pudo confirmar el pago' }, { status: 500 })
  }
}
