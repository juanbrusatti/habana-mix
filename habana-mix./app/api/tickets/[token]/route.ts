import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('attendances')
      .select('event_title, name, surname, email, ticket_code, checked_in_at, payment_status, paid_at')
      .eq('ticket_token_hash', tokenHash)
      .eq('is_free', false)
      .eq('payment_status', 'approved')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })

    return NextResponse.json({
      eventTitle: data.event_title,
      name: `${data.name} ${data.surname}`,
      email: data.email,
      code: data.ticket_code,
      checkedInAt: data.checked_in_at,
      paidAt: data.paid_at,
    })
  } catch (error) {
    console.error('Error cargando ticket:', error)
    return NextResponse.json({ error: 'No se pudo cargar la entrada' }, { status: 500 })
  }
}
