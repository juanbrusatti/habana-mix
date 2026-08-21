import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const required = ['event_id', 'event_title', 'name', 'surname', 'dni', 'phone', 'email', 'amount']

    for (const key of required) {
      if (!body[key] || typeof body[key] !== 'string') {
        return NextResponse.json({ error: `${key} es obligatorio` }, { status: 400 })
      }
    }

    const payload = {
      event_id: body.event_id as string,
      event_title: body.event_title as string,
      name: body.name as string,
      surname: body.surname as string,
      dni: body.dni as string,
      phone: body.phone as string,
      email: body.email as string,
      amount: Number(body.amount),
      currency: body.currency || 'ARS',
      user_agent: req.headers.get('user-agent') || null,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('payment_attempts')
      .insert({
        ...payload,
        status: 'initiated',
      })
      .select('id')
      .single()

    if (attemptError) throw attemptError

    return NextResponse.json({ 
      success: true, 
      attempt_id: attempt.id 
    })
  } catch (error) {
    console.error('Error registrando intento de pago:', error)
    return NextResponse.json({ error: 'No se pudo registrar el intento de pago' }, { status: 500 })
  }
}