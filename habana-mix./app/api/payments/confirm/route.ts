import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Consulta si el webhook ya procesó el pago y creó la asistencia.
 * No crea tickets ni envía emails — eso es responsabilidad exclusiva del webhook.
 *
 * Respuestas posibles:
 *   200 { status: 'confirmed', ticket: {...} }  → pago procesado, mostrar ticket
 *   200 { status: 'pending' }                   → webhook aún no llegó, reintentar
 *   400                                         → faltan parámetros
 *   404                                         → orden no encontrada
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const paymentId = String(body?.payment_id || body?.collection_id || '')
    const orderId = String(body?.external_reference || '')

    if (!paymentId || !orderId) {
      return NextResponse.json({ error: 'Faltan datos del pago' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Buscar la orden para validar que el payment_id pertenece a ella
    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('id, event_title, name, surname, status, payment_id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    // Verificar que el payment_id enviado por el frontend corresponde a la orden
    // (protege contra alguien que intente consultar con un orderId ajeno)
    if (order.payment_id && order.payment_id !== paymentId) {
      return NextResponse.json({ error: 'El pago no corresponde a esta orden' }, { status: 409 })
    }

    // Si el webhook aún no procesó el pago, informar al frontend para que reintente
    if (order.status !== 'approved') {
      return NextResponse.json({ status: 'pending' })
    }

    // Buscar la asistencia ya creada por el webhook
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .select('ticket_code, ticket_token, ticket_email_sent_at')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (attendanceError) throw attendanceError

    // Caso edge: la orden está aprobada pero el attendance aún no existe (muy raro)
    if (!attendance) {
      return NextResponse.json({ status: 'pending' })
    }

    return NextResponse.json({
      status: 'confirmed',
      ticket: {
        token: attendance.ticket_token,
        code: attendance.ticket_code,
        eventTitle: order.event_title,
        name: `${order.name} ${order.surname}`,
        emailSent: !!attendance.ticket_email_sent_at,
      },
    })
  } catch (error) {
    console.error('Error consultando confirmación de pago:', error)
    return NextResponse.json({ error: 'No se pudo consultar el estado del pago' }, { status: 500 })
  }
}
