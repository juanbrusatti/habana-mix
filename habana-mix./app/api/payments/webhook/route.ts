import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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
      .select('id, amount, currency')
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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
