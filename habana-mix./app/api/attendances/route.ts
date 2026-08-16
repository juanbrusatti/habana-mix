import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const normalizeText = (value: string) => value.trim()

const normalizeDni = (value: string) => normalizeText(value).toUpperCase()

const normalizePhone = (value: string) => normalizeText(value).replace(/\D/g, '')

const normalizeEmail = (value: string) => normalizeText(value).toLowerCase()

const duplicateMessages: Record<'dni' | 'telefono' | 'email', string> = {
  dni: 'Este DNI ya fue registrado para este evento.',
  telefono: 'Este teléfono ya fue registrado para este evento.',
  email: 'Este email ya fue registrado para este evento.',
}

const findDuplicateField = (records: Array<{ dni: string; phone: string; email: string }>, payload: {
  dni: string
  phone: string
  email: string
}) => {
  if (records.some((record) => record.dni === payload.dni)) return 'dni' as const
  if (records.some((record) => record.phone === payload.phone)) return 'telefono' as const
  if (records.some((record) => record.email === payload.email)) return 'email' as const
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const required = ['event_id', 'event_title', 'name', 'surname', 'dni', 'phone', 'email']

    for (const key of required) {
      if (!body[key] || typeof body[key] !== 'string') {
        return NextResponse.json({ error: `${key} es obligatorio` }, { status: 400 })
      }
    }

    const payload = {
      event_id: body.event_id,
      event_title: normalizeText(body.event_title),
      name: normalizeText(body.name),
      surname: normalizeText(body.surname),
      dni: normalizeDni(body.dni),
      phone: normalizePhone(body.phone),
      email: normalizeEmail(body.email),
      is_free: true,
    }

    const { data: existing, error: existingError } = await supabase
      .from('attendances')
      .select('dni, phone, email')
      .eq('event_id', payload.event_id)
      .or(
        `dni.eq.${payload.dni},phone.eq.${payload.phone},email.eq.${payload.email}`,
      )

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    const duplicateField = findDuplicateField(existing ?? [], payload)

    if (duplicateField) {
      return NextResponse.json(
        {
          error: duplicateMessages[duplicateField],
        },
        { status: 409 },
      )
    }

    const { data, error } = await supabase.from('attendances').insert(payload).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 })
  }
}
