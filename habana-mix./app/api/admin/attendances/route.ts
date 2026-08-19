import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: admin } = await supabaseAdmin.from('admin_credentials').select('id').eq('id', adminId).eq('is_active', true).maybeSingle()
    if (!admin) return NextResponse.json({ error: 'Sesión no autorizada' }, { status: 401 })

    const { data, error } = await supabaseAdmin.from('attendances').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error cargando asistencias admin:', error)
    return NextResponse.json({ error: 'No se pudieron cargar las asistencias' }, { status: 500 })
  }
}
