import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
      event_title: body.event_title,
      name: body.name.trim(),
      surname: body.surname.trim(),
      dni: body.dni.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
      is_free: true,
    }

    const { data, error } = await supabase.from('attendances').insert(payload).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 })
  }
}
