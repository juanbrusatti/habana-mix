import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createTicketCode, createTicketToken, hashTicketToken, sendTicketEmail } from '@/lib/ticket-utils'

export async function POST(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: admin } = await supabaseAdmin.from('admin_credentials').select('id').eq('id', adminId).eq('is_active', true).maybeSingle()
    if (!admin) return NextResponse.json({ error: 'Sesión no autorizada' }, { status: 401 })

    const body = await request.json()
    const required = ['event_id', 'name', 'surname', 'dni', 'phone', 'email']
    if (required.some((key) => typeof body[key] !== 'string' || !body[key].trim())) return NextResponse.json({ error: 'Completá todos los campos' }, { status: 400 })

    const { data: event, error: eventError } = await supabaseAdmin.from('events').select('id, title, price_amount, price_currency').eq('id', body.event_id).maybeSingle()
    if (eventError) throw eventError
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    const dni = body.dni.trim().toUpperCase()
    const phone = body.phone.trim().replace(/\D/g, '')
    const email = body.email.trim().toLowerCase()
    const { data: duplicate } = await supabaseAdmin.from('attendances').select('id').eq('event_id', event.id).eq('payment_status', 'approved').or(`dni.eq.${dni},phone.eq.${phone},email.eq.${email}`).maybeSingle()
    if (duplicate) return NextResponse.json({ error: 'DNI, teléfono o email ya usados en este evento' }, { status: 409 })

    const ticketCode = createTicketCode()
    const ticketToken = createTicketToken()
    const { data: attendance, error: attendanceError } = await supabaseAdmin.from('attendances').insert({
      event_id: event.id,
      event_title: event.title,
      name: body.name.trim(),
      surname: body.surname.trim(),
      dni,
      phone,
      email,
      is_free: false,
      payment_status: 'approved',
      payment_provider: 'gift',
      payment_amount: 0,
      payment_currency: event.price_currency || 'ARS',
      paid_at: new Date().toISOString(),
      ticket_code: ticketCode,
      ticket_token: ticketToken,
      ticket_token_hash: hashTicketToken(ticketToken),
    }).select('id').single()

    if (attendanceError) throw attendanceError

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
    const emailSent = await sendTicketEmail({ email, name: body.name.trim(), eventTitle: event.title, ticketCode, ticketUrl: `${siteUrl}/entrada/${ticketToken}` })
    if (emailSent) await supabaseAdmin.from('attendances').update({ ticket_email_sent_at: new Date().toISOString() }).eq('id', attendance.id)

    return NextResponse.json({ ticket: { token: ticketToken, code: ticketCode, emailSent } }, { status: 201 })
  } catch (error) {
    console.error('Error creando invitación:', error)
    return NextResponse.json({ error: 'No se pudo crear la invitación' }, { status: 500 })
  }
}
