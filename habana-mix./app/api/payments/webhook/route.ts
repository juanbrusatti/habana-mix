import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  createTicketCode,
  createTicketToken,
  hashTicketToken,
  sendTicketEmail,
} from '@/lib/ticket-utils'

/**
 * Verifica la firma HMAC-SHA256 que Mercado Pago incluye en cada webhook.
 * Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Encabezados de MP:
 *   x-signature: "ts=<timestamp>,v1=<hmac_hex>"
 *   x-request-id: "<uuid>"
 *
 * Mensaje firmado: "id:<payment_id>;request-id:<x-request-id>;ts:<ts>;"
 */
function verifyMercadoPagoSignature(req: Request, paymentId: string): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    console.error('WEBHOOK_SECRET no configurado')
    return false
  }

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  // Parsear ts y v1 del header x-signature
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [k, v] = part.split('=')
      return [k.trim(), v?.trim() ?? '']
    }),
  )
  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) return false

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  // Leer el body una sola vez (los streams no se pueden releer)
  const body = await req.json().catch(() => null)

  const paymentId = String(body?.data?.id || body?.id || '')
  const type = body?.type || body?.topic

  // Ignorar notificaciones que no sean de pago
  if (type !== 'payment' || !paymentId) {
    return NextResponse.json({ received: true })
  }

  // Verificar firma HMAC — rechazar si es inválida
  if (!verifyMercadoPagoSignature(req, paymentId)) {
    console.warn('Webhook de MP rechazado: firma inválida', { paymentId })
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN')

    const client = new MercadoPagoConfig({ accessToken })
    const payment = await new Payment(client).get({ id: paymentId })

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
    const paymentStatus = statusMap[payment.status ?? ''] ?? 'pending'

    const supabaseAdmin = getSupabaseAdmin()

    // Buscar la orden de pago asociada a este external_reference
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('id, amount, currency, event_id, event_title, name, surname, dni, phone, email, preference_id, status')
      .eq('id', attendanceId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return NextResponse.json({ received: true })

    // Si el pago ya fue procesado anteriormente, responder 200 sin hacer nada (idempotencia)
    if (order.status === 'approved') {
      return NextResponse.json({ received: true })
    }

    // Validar que el monto y la moneda coincidan exactamente con lo que se cobró
    if (paymentStatus === 'approved') {
      const amountMatches = Number(payment.transaction_amount) === Number(order.amount)
      const currencyMatches = !order.currency || payment.currency_id === order.currency

      if (!amountMatches || !currencyMatches) {
        console.error('Webhook MP: monto o moneda no coinciden', {
          attendanceId,
          transactionAmount: payment.transaction_amount,
          expectedAmount: order.amount,
          currency: payment.currency_id,
          expectedCurrency: order.currency,
        })
        // Actualizar a rejected por seguridad y salir
        await supabaseAdmin
          .from('payment_orders')
          .update({ status: 'rejected', payment_id: paymentId })
          .eq('id', order.id)
        return NextResponse.json({ received: true })
      }
    }

    // Para pagos no aprobados: solo actualizar el estado de la orden
    if (paymentStatus !== 'approved') {
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: paymentStatus, payment_id: paymentId })
        .eq('id', order.id)
      return NextResponse.json({ received: true })
    }

    // ── PAGO APROBADO ──────────────────────────────────────────────────────────
    // Verificar idempotencia: ¿ya existe una asistencia con este payment_id?
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('attendances')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existingError) throw existingError

    if (!existing) {
      // Crear la asistencia con el ticket. Reintentar hasta 3 veces si hay colisión de código.
      let attendanceError: { code?: string; message?: string } | null = null
      let ticketCode = ''
      let ticketToken = ''

      for (let attempt = 0; attempt < 3; attempt += 1) {
        ticketCode = createTicketCode()
        ticketToken = createTicketToken()

        const result = await supabaseAdmin.from('attendances').insert({
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
        // Si ya existía por una carrera (23505), no es un error real — continuar
        if (attendanceError.code !== '23505') throw attendanceError
      } else {
        // Enviar el email con el QR solo si se creó la asistencia ahora
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
      }
    }

    // Marcar la orden como aprobada
    await supabaseAdmin
      .from('payment_orders')
      .update({
        status: 'approved',
        payment_id: paymentId,
        approved_at: new Date().toISOString(),
        webhook_processed_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    // Devolver 500 para que MP reintente la notificación
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
