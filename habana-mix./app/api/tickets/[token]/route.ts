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
      .select('event_id, event_title, name, surname, email, ticket_code, checked_in_at, payment_status, paid_at')
      .eq('ticket_token_hash', tokenHash)
      .eq('is_free', false)
      .eq('payment_status', 'approved')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })

    // Link de fotos del evento. Consulta aparte y a prueba de fallas: si la
    // migración 035 no corrió o algo sale mal, la entrada carga igual sin fotos.
    let photosUrl: string | null = null
    try {
      const { data: event } = await supabaseAdmin
        .from('events')
        .select('photos_url')
        .eq('id', data.event_id)
        .maybeSingle()
      photosUrl = event?.photos_url || null
    } catch {
      photosUrl = null
    }

    return NextResponse.json({
      eventTitle: data.event_title,
      name: `${data.name} ${data.surname}`,
      email: data.email,
      code: data.ticket_code,
      checkedInAt: data.checked_in_at,
      paidAt: data.paid_at,
      photosUrl,
    })
  } catch (error) {
    console.error('Error cargando ticket:', error)
    return NextResponse.json({ error: 'No se pudo cargar la entrada' }, { status: 500 })
  }
}
