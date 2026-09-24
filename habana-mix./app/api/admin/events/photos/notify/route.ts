import { NextResponse } from 'next/server'
import { getAuthorizedAdminClient } from '@/lib/admin-auth'
import { createPhotosTransport, sendPhotosEmail } from '@/lib/photos-email'

// El plan Hobby de Vercel corta a los 10 s por defecto; con 60 s y envíos en
// paralelo alcanza para varios cientos de asistentes.
export const maxDuration = 60

/** Cuántos mails se mandan a la vez por la misma conexión SMTP. */
const CONCURRENCY = 5

/**
 * Manda el link de fotos a todos los que fueron al evento:
 * pagos aprobados y reservas gratuitas. Un mail por dirección, aunque la
 * misma persona haya reservado dos veces.
 */
export async function POST(request: Request) {
  const client = await getAuthorizedAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { event_id: eventId } = await request.json()
    if (!eventId) return NextResponse.json({ error: 'Falta el evento' }, { status: 400 })

    const { data: event, error: eventError } = await client
      .from('events')
      .select('id, title, photos_url')
      .eq('id', eventId)
      .maybeSingle()
    if (eventError) throw eventError
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    if (!event.photos_url) {
      return NextResponse.json({ error: 'Primero guardá el link de las fotos' }, { status: 400 })
    }

    const { data: attendees, error: attendeesError } = await client
      .from('attendances')
      .select('name, email, is_free, payment_status')
      .eq('event_id', eventId)
      .or('is_free.eq.true,payment_status.eq.approved')
    if (attendeesError) throw attendeesError

    const recipients = new Map<string, string>()
    for (const attendee of attendees || []) {
      const email = String(attendee.email || '').trim().toLowerCase()
      if (email && !recipients.has(email)) recipients.set(email, attendee.name || '')
    }

    if (recipients.size === 0) {
      return NextResponse.json({ error: 'Este evento no tiene asistentes con email' }, { status: 400 })
    }

    const transport = createPhotosTransport()
    if (!transport) {
      return NextResponse.json({ error: 'El envío de emails no está configurado' }, { status: 500 })
    }

    const queue = [...recipients.entries()]
    let sent = 0
    let failed = 0

    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [email, name] = item
        try {
          await sendPhotosEmail(transport, {
            email,
            name,
            eventTitle: event.title,
            photosUrl: event.photos_url,
          })
          sent += 1
        } catch (error) {
          console.error(`Error enviando fotos a ${email}:`, error)
          failed += 1
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
    transport.transporter.close()

    const emailedAt = new Date().toISOString()
    if (sent > 0) {
      await client.from('events').update({ photos_emailed_at: emailedAt }).eq('id', eventId)
    }

    return NextResponse.json({
      sent,
      failed,
      total: recipients.size,
      photos_emailed_at: sent > 0 ? emailedAt : null,
    })
  } catch (error) {
    console.error('Error enviando fotos a asistentes:', error)
    return NextResponse.json({ error: 'No se pudieron enviar los emails' }, { status: 500 })
  }
}
