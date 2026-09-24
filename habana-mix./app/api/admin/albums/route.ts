import { NextResponse } from 'next/server'
import { getAuthorizedAdminClient } from '@/lib/admin-auth'
import { parseAlbumInput } from '@/lib/photos'

const MISSING_TABLE = 'Falta correr la migración 035 (photo_albums) en Supabase.'

function isMissingTable(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === '42P01' || error.message?.includes('photo_albums')))
}

/** Lista todos los álbumes, incluidos los ocultos (solo admin). */
export async function GET(request: Request) {
  const client = await getAuthorizedAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await client
    .from('photo_albums')
    .select('*')
    .order('album_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error listando álbumes:', error)
    return NextResponse.json(
      { error: isMissingTable(error) ? MISSING_TABLE : 'No se pudieron cargar los álbumes' },
      { status: 500 },
    )
  }
  return NextResponse.json({ albums: data || [] })
}

/** Crea un álbum. */
export async function POST(request: Request) {
  const client = await getAuthorizedAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const parsed = parseAlbumInput(await request.json())
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const { data, error } = await client
      .from('photo_albums')
      .insert(parsed.data)
      .select('*')
      .single()

    if (error) {
      console.error('Error creando álbum:', error)
      return NextResponse.json(
        { error: isMissingTable(error) ? MISSING_TABLE : 'No se pudo crear el álbum' },
        { status: 500 },
      )
    }
    return NextResponse.json({ album: data })
  } catch (error) {
    console.error('Error creando álbum:', error)
    return NextResponse.json({ error: 'No se pudo crear el álbum' }, { status: 500 })
  }
}
