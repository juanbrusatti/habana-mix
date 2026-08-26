import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EventDetail } from '@/components/event-detail'
import type { AcademyEvent, EventSection } from '@/lib/types'

async function getEventWithSections(slug: string): Promise<{ event: AcademyEvent; sections: EventSection[] } | null> {
  const decodedSlug = decodeURIComponent(slug).trim()
  console.log('[Evento] Buscando evento con slug:', slug, 'decoded:', decodedSlug)

  // 1. Intentar por slug exacto
  let { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', decodedSlug)
    .maybeSingle()

  // 2. Si no se encuentra, intentar insensible a mayúsculas/minúsculas
  if (!event) {
    const { data: eventByIlike } = await supabase
      .from('events')
      .select('*')
      .ilike('slug', decodedSlug)
      .maybeSingle()
    event = eventByIlike
  }

  // 3. Si no se encuentra y parece UUID o ID, buscar por id
  if (!event) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug)
    if (isUuid) {
      const { data: eventById } = await supabase
        .from('events')
        .select('*')
        .eq('id', decodedSlug)
        .maybeSingle()
      event = eventById
    }
  }

  if (!event) {
    console.error('[Evento] Evento no encontrado para slug/id:', decodedSlug)
    return null
  }

  console.log('[Evento] Evento encontrado:', event.title, 'ID:', event.id)

  // Cargar secciones de manera segura
  try {
    const { data: sections, error: sectionsError } = await supabase
      .from('event_sections')
      .select('*')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true })

    if (sectionsError) {
      console.warn('[Evento] Error al consultar event_sections:', sectionsError.message)
    }

    return {
      event,
      sections: sections || [],
    }
  } catch (secErr) {
    console.warn('[Evento] Excepción al cargar secciones:', secErr)
    return {
      event,
      sections: [],
    }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getEventWithSections(slug)

  if (!result) {
    return {
      title: 'Evento no encontrado | Habana Mix',
    }
  }

  const { event } = result

  return {
    title: `${event.title} | Habana Mix`,
    description: event.description || event.subtitle || 'Detalles del evento en Habana Mix',
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getEventWithSections(slug)

  if (!result) {
    notFound()
  }

  return <EventDetail event={result.event} sections={result.sections} />
}
