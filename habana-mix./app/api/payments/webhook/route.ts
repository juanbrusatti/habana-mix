import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
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

    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .select('id, payment_amount, payment_currency')
      .eq('id', attendanceId)
      .maybeSingle()

    if (attendanceError) throw attendanceError
    if (!attendance) return NextResponse.json({ received: true })

    const amountMatches = Number(payment.transaction_amount) === Number(attendance.payment_amount)
    const currencyMatches = !attendance.payment_currency || payment.currency_id === attendance.payment_currency

    if (paymentStatus === 'approved' && (!amountMatches || !currencyMatches)) {
      console.error('Pago de Mercado Pago rechazado por importe o moneda inesperados', {
        attendanceId,
        transactionAmount: payment.transaction_amount,
        expectedAmount: attendance.payment_amount,
        currency: payment.currency_id,
        expectedCurrency: attendance.payment_currency,
      })
      return NextResponse.json({ received: true })
    }

    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        payment_status: paymentStatus,
        payment_id: String(payment.id),
        paid_at: paymentStatus === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', attendanceId)

    if (updateError) throw updateError

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
