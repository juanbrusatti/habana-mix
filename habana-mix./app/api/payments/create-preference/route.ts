import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const normalizeText = (value: string) => value.trim()
const normalizeDni = (value: string) => normalizeText(value).toUpperCase()
const normalizePhone = (value: string) => normalizeText(value).replace(/\D/g, '')
const normalizeEmail = (value: string) => normalizeText(value).toLowerCase()

const duplicateMessages = {
  dni: 'Este DNI ya fue registrado para este evento.',
  phone: 'Este teléfono ya fue registrado para este evento.',
  email: 'Este email ya fue registrado para este evento.',
} as const

export async function POST(req: Request) {
  let orderId: string | null = null

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()
    const required = ['event_id', 'name', 'surname', 'dni', 'phone', 'email']

    for (const key of required) {
      if (!body[key] || typeof body[key] !== 'string') {
        return NextResponse.json({ error: `${key} es obligatorio` }, { status: 400 })
      }
    }

    const payload = {
      event_id: body.event_id as string,
      name: normalizeText(body.name),
      surname: normalizeText(body.surname),
      dni: normalizeDni(body.dni),
      phone: normalizePhone(body.phone),
      email: normalizeEmail(body.email),
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title, is_free, price_amount, price_currency, status')
      .eq('id', payload.event_id)
      .eq('status', 'published')
      .maybeSingle()

    if (eventError) throw eventError
    if (!event || event.is_free || !event.price_amount || event.price_amount <= 0) {
      return NextResponse.json({ error: 'Este evento no tiene un pago habilitado.' }, { status: 400 })
    }

    const { data: duplicates, error: duplicateError } = await supabaseAdmin
      .from('attendances')
      .select('dni, phone, email')
      .eq('event_id', payload.event_id)
      .eq('payment_status', 'approved')
      .or(`dni.eq.${payload.dni},phone.eq.${payload.phone},email.eq.${payload.email}`)

    if (duplicateError) throw duplicateError

    const duplicate = duplicates?.find((record) => record.dni === payload.dni)
      ? 'dni'
      : duplicates?.find((record) => record.phone === payload.phone)
        ? 'phone'
        : duplicates?.find((record) => record.email === payload.email)
          ? 'email'
          : null

    if (duplicate) {
      return NextResponse.json({ error: duplicateMessages[duplicate] }, { status: 409 })
    }

    const amount = Number(event.price_amount)
    const currency = event.price_currency || 'ARS'

    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        event_title: event.title,
        ...payload,
        amount,
        currency,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError) throw orderError
    orderId = order.id

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!accessToken || !siteUrl) {
      throw new Error('Faltan MERCADOPAGO_ACCESS_TOKEN o NEXT_PUBLIC_SITE_URL')
    }

    const client = new MercadoPagoConfig({ accessToken })
    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            id: event.id,
            title: event.title,
            quantity: 1,
            unit_price: amount,
            currency_id: currency,
          },
        ],
        payer: { email: payload.email },
        external_reference: order.id,
        notification_url: `${siteUrl}/api/payments/webhook`,
        back_urls: {
          success: `${siteUrl}/pago/exito`,
          failure: `${siteUrl}/pago/error`,
          pending: `${siteUrl}/pago/pendiente`,
        },
        auto_return: 'approved',
      },
    })

    const preferenceId = preference.id
    const initPoint = preference.init_point

    if (!preferenceId || !initPoint) throw new Error('Mercado Pago no devolvió el enlace de pago')

    const { error: updateError } = await supabaseAdmin
      .from('payment_orders')
      .update({ preference_id: preferenceId })
      .eq('id', order.id)

    if (updateError) throw updateError

    return NextResponse.json({ init_point: initPoint })
  } catch (error) {
    if (orderId) {
      await getSupabaseAdmin().from('payment_orders').delete().eq('id', orderId)
    }

    console.error('Error creando preferencia de Mercado Pago:', error)
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Intenta nuevamente.' }, { status: 500 })
  }
}
