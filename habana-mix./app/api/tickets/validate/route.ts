import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function parseTicketValue(raw: string) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  if (trimmed.includes('/entrada/')) {
    return trimmed.split('/entrada/')[1]?.split(/[?#]/)[0] || ''
  }
  return trimmed
}

async function findAttendance(value: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const normalized = parseTicketValue(value)
  if (!normalized) return { error: 'Ingresá un código o QR', status: 400 as const }

  const isCode = /^[A-Z0-9]{5}$/i.test(normalized)
  const query = supabaseAdmin
    .from('attendances')
    .select('id, event_title, name, surname, ticket_code, payment_status, checked_in_at')
    .eq('is_free', false)
    .eq('payment_status', 'approved')

  const { data, error } = isCode
    ? await query.eq('ticket_code', normalized.toUpperCase()).maybeSingle()
    : await query.eq('ticket_token_hash', createHash('sha256').update(normalized).digest('hex')).maybeSingle()

  if (error) throw error
  if (!data) return { error: 'Entrada inválida o pago no aprobado', status: 404 as const }
  return { data }
}

export async function POST(req: Request) {
  try {
    const adminId = req.headers.get('x-admin-id')
    if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const value = String(body?.value || '').trim()
    const confirm = Boolean(body?.confirm)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_credentials')
      .select('id')
      .eq('id', adminId)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError) throw adminError
    if (!admin) return NextResponse.json({ error: 'Sesión no autorizada' }, { status: 401 })

    const found = await findAttendance(value)
    if ('error' in found && found.error) {
      return NextResponse.json({ error: found.error }, { status: found.status })
    }

    const data = found.data!

    // Solo lectura: no marca como utilizada
    if (!confirm) {
      if (data.checked_in_at) {
        return NextResponse.json({
          found: true,
          alreadyUsed: true,
          message: `Entrada ya utilizada el ${new Date(data.checked_in_at).toLocaleString('es-AR')}`,
          attendee: data,
        })
      }

      return NextResponse.json({
        found: true,
        alreadyUsed: false,
        message: 'QR / código leído. Tocá Validar entrada para autorizar el ingreso.',
        attendee: data,
      })
    }

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
