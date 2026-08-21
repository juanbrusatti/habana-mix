import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendEventReminderEmail } from '@/lib/ticket-utils'

async function getAuthorizedAdmin(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return null
  const client = getSupabaseAdmin()
  const { data } = await client.from('admin_credentials').select('id').eq('id', adminId).eq('is_active', true).maybeSingle()
  return data ? client : null
}

export async function POST(request: Request) {
  const client = await getAuthorizedAdmin(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { event_id: eventId } = await request.json()
    if (!eventId) return NextResponse.json({ error: 'Falta el evento' }, { status: 400 })

    const { data: event, error: eventError } = await client
      .from('events')
      .select('id, title, starts_at, location')
      .eq('id', eventId)
      .maybeSingle()
    if (eventError) throw eventError
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    const { data: attendees, error: attendeesError } = await client
      .from('attendances')
      .select('id, name, email, ticket_code, ticket_token')
      .eq('event_id', eventId)
      .eq('is_free', false)
      .eq('payment_status', 'approved')
    if (attendeesError) throw attendeesError

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
    let sent = 0
    let failed = 0

    for (const attendee of attendees || []) {
      if (!attendee.email || !attendee.ticket_code || !attendee.ticket_token) {
        failed += 1
        continue
      }

      try {
        const delivered = await sendEventReminderEmail({
          email: attendee.email,
          name: attendee.name,
          eventTitle: event.title,
          eventDate: event.starts_at,
          eventLocation: event.location,
          ticketCode: attendee.ticket_code,
          ticketUrl: `${siteUrl}/entrada/${attendee.ticket_token}`,
        })

        if (delivered) {
          sent += 1
          await client.from('attendances').update({ ticket_email_sent_at: new Date().toISOString() }).eq('id', attendee.id)
        } else {
          failed += 1
        }
      } catch (error) {
        console.error(`Error enviando recordatorio a ${attendee.email}:`, error)
        failed += 1
      }
    }

    return NextResponse.json({ sent, failed, total: (attendees || []).length })
  } catch (error) {
    console.error('Error enviando recordatorios:', error)
    return NextResponse.json({ error: 'No se pudieron enviar los recordatorios' }, { status: 500 })
  }
}
