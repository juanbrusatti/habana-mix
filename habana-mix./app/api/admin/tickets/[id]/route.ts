import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendTicketEmail } from '@/lib/ticket-utils'

async function getAuthorizedAdmin(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return null
  const supabaseAdmin = getSupabaseAdmin()
  const { data } = await supabaseAdmin.from('admin_credentials').select('id').eq('id', adminId).eq('is_active', true).maybeSingle()
  return data ? supabaseAdmin : null
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabaseAdmin = await getAuthorizedAdmin(request)
  if (!supabaseAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('attendances').select('event_title, name, surname, email, ticket_code, ticket_token').eq('id', id).eq('is_free', false).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.ticket_token) return NextResponse.json({ error: 'Esta asistencia no tiene entrada generada' }, { status: 404 })
  return NextResponse.json({ ticketUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')}/entrada/${data.ticket_token}`, code: data.ticket_code })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabaseAdmin = await getAuthorizedAdmin(request)
  if (!supabaseAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('attendances').select('event_title, name, surname, email, ticket_code, ticket_token').eq('id', id).eq('is_free', false).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.ticket_token) return NextResponse.json({ error: 'Esta asistencia no tiene entrada generada' }, { status: 404 })
  const ticketUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')}/entrada/${data.ticket_token}`
  const sent = await sendTicketEmail({ email: data.email, name: data.name, eventTitle: data.event_title, ticketCode: data.ticket_code, ticketUrl })
  if (!sent) return NextResponse.json({ error: 'Configura Resend para enviar emails' }, { status: 503 })
  await supabaseAdmin.from('attendances').update({ ticket_email_sent_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ sent: true })
}
