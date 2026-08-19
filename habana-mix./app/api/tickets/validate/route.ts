import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const accessKey = process.env.ACCESS_CONTROL_KEY
    if (!accessKey || req.headers.get('x-access-key') !== accessKey) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const value = String(body?.value || '').trim()
    if (!value) return NextResponse.json({ error: 'Ingresá un código o QR' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()
    const isCode = /^[A-Z0-9]{5}$/.test(value.toUpperCase())
    const query = supabaseAdmin
      .from('attendances')
      .select('id, event_title, name, surname, ticket_code, payment_status, checked_in_at')
      .eq('is_free', false)
      .eq('payment_status', 'approved')

    const { data, error } = isCode
      ? await query.eq('ticket_code', value.toUpperCase()).maybeSingle()
      : await query.eq('ticket_token_hash', createHash('sha256').update(value).digest('hex')).maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Entrada inválida o pago no aprobado' }, { status: 404 })
    if (data.checked_in_at) {
      return NextResponse.json({
        valid: false,
        alreadyUsed: true,
        message: `Entrada ya utilizada el ${new Date(data.checked_in_at).toLocaleString('es-AR')}`,
        attendee: data,
      }, { status: 409 })
    }

    const checkedInAt = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({ checked_in_at: checkedInAt, checked_in_by: 'control-access' })
      .eq('id', data.id)
      .is('checked_in_at', null)

    if (updateError) throw updateError

    return NextResponse.json({
      valid: true,
      message: 'Ingreso autorizado',
      attendee: { ...data, checked_in_at: checkedInAt },
    })
  } catch (error) {
    console.error('Error validando entrada:', error)
    return NextResponse.json({ error: 'No se pudo validar la entrada' }, { status: 500 })
  }
}
