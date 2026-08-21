import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function getAdminClient(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return null
  const client = getSupabaseAdmin()
  const { data } = await client.from('admin_credentials').select('id').eq('id', adminId).eq('is_active', true).maybeSingle()
  return data ? client : null
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await getAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const { data: raffle, error: raffleError } = await client.from('raffles').select('*').eq('id', id).maybeSingle()
    if (raffleError) throw raffleError
    if (!raffle) return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 })
    if (raffle.status === 'completed') {
      const { data: winners } = await client.from('raffle_winners').select('position, participant_name').eq('raffle_id', id).order('position')
      return NextResponse.json({ winners: winners || [] })
    }

    await client.from('raffles').update({ status: 'drawing' }).eq('id', id)
    const participants = Array.isArray(raffle.participants) ? raffle.participants as Array<{ id: string; name: string }> : []
    const remaining = [...participants]
    const winners: Array<{ position: number; participant_id: string; participant_name: string }> = []

    for (let position = 1; position <= Math.min(raffle.winner_count, remaining.length); position += 1) {
      const index = randomInt(remaining.length)
      const [winner] = remaining.splice(index, 1)
      winners.push({ position, participant_id: winner.id, participant_name: winner.name })
    }

    const { error: winnerError } = await client.from('raffle_winners').insert(winners.map((winner) => ({ raffle_id: id, ...winner })))
    if (winnerError) throw winnerError
    const { error: updateError } = await client.from('raffles').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
    if (updateError) throw updateError

    return NextResponse.json({ winners })
  } catch (error) {
    console.error('Error realizando sorteo:', error)
    return NextResponse.json({ error: 'No se pudo realizar el sorteo' }, { status: 500 })
  }
}
