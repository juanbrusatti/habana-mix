import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = getSupabaseAdmin()
    const { data: raffle, error } = await client.from('raffles').select('id, event_title, prize, winner_count, participant_count, participants, status, completed_at').eq('id', id).maybeSingle()
    if (error) throw error
    if (!raffle) return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 })
    const { data: winners } = await client.from('raffle_winners').select('position, participant_name').eq('raffle_id', id).order('position')
    return NextResponse.json({ raffle: { ...raffle, participants: raffle.participants, winners: winners || [] } })
  } catch (error) {
    console.error('Error cargando sorteo:', error)
    return NextResponse.json({ error: 'No se pudo cargar el sorteo' }, { status: 500 })
  }
}
