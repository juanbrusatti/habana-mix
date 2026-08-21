import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { finalizeApprovedPayment } from '@/lib/payment-finalization'

function hasValidSignature(request: Request, paymentId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  const signature = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')
  const dataId = new URL(request.url).searchParams.get('data.id') || paymentId

  if (!secret || !signature || !requestId || !dataId) return false

  const values = signature.split(',').reduce<Record<string, string>>((result, part) => {
    const [key, value] = part.trim().split('=', 2)
    if (key && value) result[key] = value
    return result
  }, {})

  if (!values.ts || !values.v1) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${values.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const receivedBuffer = Buffer.from(values.v1, 'utf8')

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const paymentId = String(body?.data?.id || body?.id || '')
    const type = body?.type || body?.topic

    if (type !== 'payment' || !paymentId) return NextResponse.json({ received: true })
    if (!hasValidSignature(req, paymentId)) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN')

    const supabaseAdmin = getSupabaseAdmin()
    const payment = await new Payment(new MercadoPagoConfig({ accessToken })).get({ id: paymentId })
    const orderId = payment.external_reference
    if (!orderId) return NextResponse.json({ received: true })

    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()
    if (orderError) throw orderError
    if (!order) return NextResponse.json({ received: true })

    const statusMap: Record<string, string> = {
      approved: 'approved', rejected: 'rejected', cancelled: 'rejected', refunded: 'refunded',
      charged_back: 'refunded', pending: 'pending', in_process: 'pending', in_mediation: 'pending',
    }
    const paymentStatus = statusMap[payment.status || ''] || 'pending'
    const amountMatches = Number(payment.transaction_amount) === Number(order.amount)
    const currencyMatches = payment.currency_id === order.currency

    if (paymentStatus === 'approved') {
      if (!amountMatches || !currencyMatches) {
        console.error('Pago con importe o moneda inesperados', { paymentId, orderId })
        return NextResponse.json({ received: true })
      }
      await finalizeApprovedPayment(supabaseAdmin, order, paymentId)
    } else {
      const { error: updateError } = await supabaseAdmin
        .from('payment_orders')
        .update({ status: paymentStatus, payment_id: paymentId, approved_at: null })
        .eq('id', order.id)
      if (updateError) throw updateError
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
