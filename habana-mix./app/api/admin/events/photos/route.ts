import { NextResponse } from 'next/server'
import { getAuthorizedAdminClient } from '@/lib/admin-auth'
import { checkPhotosUrl } from '@/lib/photos'

/**
 * Guarda (o saca) el link de fotos de un evento.
 *
 * Tiene su propia ruta en vez de viajar en el guardado general del evento: si
 * la columna nueva todavía no existe en la base, falla solo esto y crear o
 * editar eventos sigue funcionando igual.
 */
export async function POST(request: Request) {
  const client = await getAuthorizedAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const eventId = String(body?.event_id || '')
    if (!eventId) return NextResponse.json({ error: 'Falta el evento' }, { status: 400 })

    const check = checkPhotosUrl(String(body?.photos_url || ''))
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })

    const { data, error } = await client
      .from('events')
      .update({ photos_url: check.url || null })
      .eq('id', eventId)
      .select('id, photos_url, photos_emailed_at')
      .maybeSingle()

    if (error) {
      if (error.message?.includes('photos_url')) {
        return NextResponse.json(
          { error: 'Falta correr la migración 035 en Supabase.' },
          { status: 500 },
        )
      }
      throw error
    }
    if (!data) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    return NextResponse.json({ event: data, isGoogle: check.isGoogle })
  } catch (error) {
    console.error('Error guardando link de fotos:', error)
    return NextResponse.json({ error: 'No se pudo guardar el link' }, { status: 500 })
  }
}
