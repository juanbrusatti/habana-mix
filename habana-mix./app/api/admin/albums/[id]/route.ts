import { NextResponse } from 'next/server'
import { getAuthorizedAdminClient } from '@/lib/admin-auth'
import { parseAlbumInput } from '@/lib/photos'

/** Edita un álbum. Acepta cambios parciales (ej. solo publicar/ocultar). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const client = await getAuthorizedAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const parsed = parseAlbumInput(await request.json(), { partial: true })
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar' }, { status: 400 })
    }

    const { data, error } = await client
      .from('photo_albums')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Álbum no encontrado' }, { status: 404 })
    return NextResponse.json({ album: data })
  } catch (error) {
    console.error('Error editando álbum:', error)
    return NextResponse.json({ error: 'No se pudo guardar el álbum' }, { status: 500 })
  }
}

/** Borra un álbum. Las fotos siguen en Drive: solo se quita de la web. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const client = await getAuthorizedAdminClient(request)
  if (!client) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const { error } = await client.from('photo_albums').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Error borrando álbum:', error)
    return NextResponse.json({ error: 'No se pudo borrar el álbum' }, { status: 500 })
  }
}
