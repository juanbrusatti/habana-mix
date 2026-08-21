import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { finalizeApprovedPayment } from '@/lib/payment-finalization'

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

    const ticket = await finalizeApprovedPayment(supabaseAdmin, order, paymentId)
    return NextResponse.json({ confirmed: true, ticket: { ...ticket, eventTitle: order.event_title, name: `${order.name} ${order.surname}` } })
  } catch (error) {
    console.error('Error confirmando pago:', error)
    return NextResponse.json({ error: 'No se pudo confirmar el pago' }, { status: 500 })
  }
}
