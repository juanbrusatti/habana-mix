import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import { defaultLive, type LiveConfig } from '@/lib/live'
import type { PhotoAlbum } from '@/lib/photos'
import type { AcademyEvent } from '@/lib/types'

/**
 * Capa de datos del sitio público, resuelta en el SERVIDOR.
 *
 * Antes cada sección hacía su propio fetch desde el cliente: el HTML llegaba
 * vacío, el navegador tenía que ejecutar JS para recién ahí pedir los datos y,
 * solo después, descubrir la URL de la imagen del hero. Eran cuatro viajes
 * encadenados antes de ver algo.
 *
 * Acá se pide todo en el servidor y el HTML ya sale con los datos y las URLs de
 * imagen, así el navegador empieza a bajar la portada de inmediato.
 * `cache()` deduplica dentro de un mismo request (la ubicación la usan la
 * sección y el footer, y antes se pedía dos veces).
 */

export interface HeroConfig {
  badge_text: string
  title: string
  subtitle: string
  image_url: string
  title_color: string
  subtitle_color: string
  badge_color: string
  badge_text_color: string
  title_size: string
  subtitle_size: string
}

export interface AboutConfig {
  eyebrow: string
  title: string
  image_url: string
  paragraphs: string[]
  stats: { value: string; label: string }[]
  show_badge: boolean
  badge_main_text: string
  badge_sub_text: string
}

export interface LocationConfig {
  title: string
  street: string
  street_number: string
  apartment: string
  city: string
  state: string
  country: string
  postal_code: string
  directions_note: string
  phone: string
  whatsapp: string
  hours: { label: string; value: string }[]
}

export interface FooterConfig {
  description: string
  email: string
  copyright_text: string
  nav_groups: { title: string; links: { label: string; href: string }[] }[]
  socials: { label: string; href: string }[]
}

export const defaultHero: HeroConfig = {
  badge_text: 'Academia de baile cubano',
  title: 'Habana Mix',
  subtitle:
    'Donde el sabor de La Habana se aprende bailando. Salsa cubana, timba, bachata y rueda de casino.',
  image_url: '/images/hero-habana.png',
  title_color: '#ffffff',
  subtitle_color: 'rgba(255,255,255,0.7)',
  badge_color: 'rgba(255,255,255,0.1)',
  badge_text_color: '#ffffff',
  title_size: 'text-6xl',
  subtitle_size: 'text-lg',
}

export const defaultAbout: AboutConfig = {
  eyebrow: 'Quiénes somos',
  title: 'Un pedacito de Cuba en tu ciudad',
  image_url: '/images/about-academia.png',
  paragraphs: [
    'Habana Mix nació de una idea simple: que cualquiera pueda sentir el sabor cubano sin importar de dónde venga ni cuánto haya bailado antes.',
    'Nuestros instructores se formaron en La Habana y llevan más de diez años enseñando salsa cubana, timba, bachata y rueda de casino. Acá no se copian pasos: se aprende a escuchar la música.',
    'Más que una academia, somos una comunidad. Se entra por una clase y se queda por la gente.',
  ],
  stats: [
    { value: '10+', label: 'Años enseñando' },
    { value: '1.200', label: 'Alumnos felices' },
    { value: '4', label: 'Estilos cubanos' },
    { value: '2', label: 'Fiestas al mes' },
  ],
  show_badge: true,
  badge_main_text: '100% cubano',
  badge_sub_text: 'Instructores de La Habana',
}

export const defaultLocation: LocationConfig = {
  title: 'Cómo llegar',
  street: 'Av. del Malecón',
  street_number: '1245',
  apartment: 'Local 3',
  city: 'Palermo',
  state: 'Buenos Aires',
  country: 'Argentina',
  postal_code: 'C1414',
  directions_note:
    'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  phone: '+54 11 5555 1234',
  whatsapp: '5491155551234',
  hours: [
    { label: 'Lunes a viernes', value: '17:00 – 23:00' },
    { label: 'Sábados', value: '11:00 – 20:00' },
    { label: 'Domingos', value: 'Solo eventos' },
  ],
}

export const defaultFooter: FooterConfig = {
  description:
    'Salsa cubana, timba y bachata con el sabor de La Habana. Más que una academia: una comunidad.',
  email: 'hola@habanamix.com',
  copyright_text: 'Hecho con sabor cubano',
  nav_groups: [
    {
      title: 'La academia',
      links: [
        { label: 'Próximos eventos', href: '#eventos' },
        { label: 'Quiénes somos', href: '#nosotros' },
        { label: 'Cómo llegar', href: '#como-llegar' },
      ],
    },
  ],
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'YouTube', href: 'https://youtube.com' },
  ],
}

/** Si la RPC falla o la fila no existe, se devuelve el default: la página nunca queda vacía. */
async function loadConfig<T>(rpc: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await supabase.rpc(rpc)
    if (error) {
      console.error(`Error cargando ${rpc}:`, error.message)
      return fallback
    }
    return data ? ({ ...fallback, ...(data as object) } as T) : fallback
  } catch (error) {
    console.error(`Error cargando ${rpc}:`, error)
    return fallback
  }
}

export const getHeroConfig = cache(() => loadConfig('get_hero_config', defaultHero))
export const getAboutConfig = cache(() => loadConfig('get_about_config', defaultAbout))
export const getLocationConfig = cache(() => loadConfig('get_location_config', defaultLocation))
export const getFooterConfig = cache(() => loadConfig('get_footer_config', defaultFooter))

/**
 * Estado de la transmisión en vivo.
 * Si la migración 034 todavía no se corrió, `loadConfig` devuelve el default
 * (apagado) y la web sigue funcionando igual.
 */
export const getLiveConfig = cache(() => loadConfig<LiveConfig>('get_live_config', defaultLive))

export const getEvents = cache(async (): Promise<AcademyEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error cargando eventos:', error.message)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error cargando eventos:', error)
    return []
  }
})

/**
 * Álbumes de fotos publicados, del más nuevo al más viejo.
 * Si la migración 035 todavía no corrió, la consulta falla y se devuelve una
 * lista vacía: la sección Fotos queda en su estado vacío y nada se rompe.
 */
export const getAlbums = cache(async (): Promise<PhotoAlbum[]> => {
  try {
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('is_published', true)
      .order('album_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando álbumes:', error.message)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error cargando álbumes:', error)
    return []
  }
})

export const getAlbum = cache(async (id: string): Promise<PhotoAlbum | null> => {
  // Evita consultar con ids que no son uuid (Postgres tiraría error).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  try {
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('Error cargando álbum:', error.message)
      return null
    }
    return data
  } catch (error) {
    console.error('Error cargando álbum:', error)
    return null
  }
})

/** Ordena por fecha de inicio dejando primero los que todavía no pasaron. */
export function sortEventsByRelevance(events: AcademyEvent[]): AcademyEvent[] {
  const now = Date.now()
  const upcoming: AcademyEvent[] = []
  const past: AcademyEvent[] = []

  for (const event of events) {
    const reference = new Date(event.ends_at || event.starts_at).getTime()
    if (Number.isNaN(reference) || reference >= now) upcoming.push(event)
    else past.push(event)
  }

  const byStart = (a: AcademyEvent, b: AcademyEvent) =>
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()

  return [...upcoming.sort(byStart), ...past.sort(byStart).reverse()]
}
