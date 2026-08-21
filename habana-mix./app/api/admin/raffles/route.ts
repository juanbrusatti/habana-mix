import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function authorized(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return null
  const client = getSupabaseAdmin()
  const { data } = await client.from('admin_credentials').select('id').eq('id', adminId).eq('is_active', true).maybeSingle()
  return data ? client : null
}

export async function GET(request: Request) {
  const client = await authorized(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data, error } = await client.from('events').select('id, title, is_free, starts_at').order('starts_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(request: Request) {
  const client = await authorized(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const eventId = String(body?.event_id || '')
    const winnerCount = Math.max(1, Math.min(50, Number(body?.winner_count) || 1))
    const prize = String(body?.prize || '').trim() || null
    if (!eventId) return NextResponse.json({ error: 'Seleccioná un evento' }, { status: 400 })

    const { data: event, error: eventError } = await client.from('events').select('id, title, is_free').eq('id', eventId).maybeSingle()
    if (eventError) throw eventError
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    const { data: attendance, error: attendanceError } = await client
      .from('attendances')
      .select('id, name, surname, is_free, payment_status')
      .eq('event_id', eventId)
      .or('is_free.eq.true,payment_status.eq.approved')
      .order('created_at', { ascending: true })
    if (attendanceError) throw attendanceError

    const participants = (attendance || []).map((record) => ({ id: record.id, name: `${record.name} ${record.surname}`.trim() }))
    if (!participants.length) return NextResponse.json({ error: 'Este evento no tiene participantes válidos' }, { status: 400 })

    const { data: raffle, error: raffleError } = await client.from('raffles').insert({
      event_id: event.id,
      event_title: event.title,
      prize,
      winner_count: Math.min(winnerCount, participants.length),
      participant_count: participants.length,
      participants,
      status: 'ready',
    }).select('id').single()
    if (raffleError) throw raffleError

    return NextResponse.json({ id: raffle.id, participantCount: participants.length })
  } catch (error) {
    console.error('Error creando sorteo:', error)
    return NextResponse.json({ error: 'No se pudo preparar el sorteo' }, { status: 500 })
  }
}
