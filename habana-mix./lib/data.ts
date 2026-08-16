import type {
  AboutContent,
  AcademyEvent,
  DanceClass,
  LocationContent,
} from './types'

/**
 * Datos de ejemplo idénticos a scripts/002_habana_mix_seed.sql.
 * Cuando conectes Supabase, reemplazá estas funciones por consultas:
 *
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('events')
 *     .select('*').eq('status','published').order('starts_at')
 *
 * La firma (async + mismo tipo de retorno) ya está lista para el cambio.
 */

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString()

const events: AcademyEvent[] = [
  {
    id: 'evt-1',
    slug: 'noche-cubana-timba-en-vivo',
    title: 'Noche Cubana',
    subtitle: 'Timba en vivo + DJ hasta la madrugada',
    description:
      'La fiesta más caliente del mes. Orquesta en vivo, clase gratuita de rueda de casino a las 21:00 y DJ hasta las 3 AM. Ambiente 100% habanero.',
    image_url: '/images/event-noche-cubana.png',
    starts_at: daysFromNow(9),
    ends_at: null,
    location: 'Salón principal — Habana Mix',
    price_label: 'Entrada $20 · Alumnos gratis',
    is_free: true,
    cta_label: 'Reservar lugar',
    cta_url: null,
    theme: 'amber',
    layout: 'overlay',
    tags: ['Timba en vivo', 'Clase gratis 21:00', 'Cupos limitados'],
    featured: true,
    overlay_opacity: 62,
    accent_color: null,
    status: 'published',
    sort_order: 1,
  },
  {
    id: 'evt-2',
    slug: 'bachata-sensual-social',
    title: 'Bachata Social',
    subtitle: 'Noche sensual con los mejores DJs',
    description:
      'Tres horas de bachata dominicana y sensual. Piso amplio, luces cálidas y una comunidad increíble para bailar toda la noche.',
    image_url: '/images/event-bachata-social.png',
    starts_at: daysFromNow(17),
    ends_at: null,
    location: 'Sala Malecón — Habana Mix',
    price_label: 'Entrada $15',
    is_free: false,
    cta_label: 'Quiero ir',
    cta_url: null,
    theme: 'coral',
    layout: 'split',
    tags: ['Bachata', 'Social', '+18'],
    featured: false,
    overlay_opacity: 55,
    accent_color: null,
    status: 'published',
    sort_order: 2,
  },
  {
    id: 'evt-3',
    slug: 'workshop-internacional-rueda',
    title: 'Workshop Internacional',
    subtitle: 'Rueda de Casino con maestros de La Habana',
    description:
      'Fin de semana intensivo con instructores invitados directamente desde Cuba. Dos días, cuatro módulos, certificado de participación.',
    image_url: '/images/event-workshop.png',
    starts_at: daysFromNow(31),
    ends_at: null,
    location: 'Habana Mix — Todas las salas',
    price_label: 'Pack 2 días $60',
    is_free: false,
    cta_label: 'Ver programa',
    cta_url: null,
    theme: 'teal',
    layout: 'split',
    tags: ['2 días', 'Maestros invitados', 'Certificado'],
    featured: false,
    overlay_opacity: 50,
    accent_color: null,
    status: 'published',
    sort_order: 3,
  },
]

const classes: DanceClass[] = [
  {
    id: 'cls-1',
    slug: 'salsa-cubana-principiantes',
    title: 'Salsa Cubana',
    style: 'Salsa cubana / Casino',
    level: 'principiante',
    description:
      'Desde cero: paso básico, dile que no, vacílala y tu primera rueda. En un mes ya bailás en cualquier fiesta.',
    image_url: '/images/class-salsa.png',
    instructor: 'Yoandri & Camila',
    schedule: ['Lunes 19:00', 'Jueves 20:30'],
    duration_min: 60,
    price_amount: 45,
    price_currency: 'USD',
    price_period: 'mes',
    capacity: 24,
    spots_left: 7,
    theme: 'amber',
    layout: 'split',
    tags: ['Sin pareja necesaria', 'Desde cero'],
    featured: true,
    overlay_opacity: 55,
    accent_color: null,
    status: 'published',
    sort_order: 1,
  },
  {
    id: 'cls-2',
    slug: 'bachata-sensual-intermedio',
    title: 'Bachata Sensual',
    style: 'Bachata',
    level: 'intermedio',
    description:
      'Musicalidad, ondas corporales y conexión en pareja. Para quienes ya dominan el básico y quieren fluir.',
    image_url: '/images/class-bachata.png',
    instructor: 'Dayana Pérez',
    schedule: ['Martes 20:00', 'Sábado 12:00'],
    duration_min: 75,
    price_amount: 50,
    price_currency: 'USD',
    price_period: 'mes',
    capacity: 20,
    spots_left: 4,
    theme: 'coral',
    layout: 'split',
    tags: ['Musicalidad', 'Trabajo en pareja'],
    featured: false,
    overlay_opacity: 55,
    accent_color: null,
    status: 'published',
    sort_order: 2,
  },
  {
    id: 'cls-3',
    slug: 'timba-ladies-style',
    title: 'Timba & Ladies Style',
    style: 'Timba',
    level: 'todos',
    description:
      'Sabor, actitud y despelote cubano. Técnica de cuerpo, giros y presencia en la pista.',
    image_url: '/images/event-noche-cubana.png',
    instructor: 'Camila Rojas',
    schedule: ['Miércoles 19:30'],
    duration_min: 60,
    price_amount: 35,
    price_currency: 'USD',
    price_period: 'mes',
    capacity: 18,
    spots_left: 9,
    theme: 'teal',
    layout: 'split',
    tags: ['Ladies style', 'Técnica corporal'],
    featured: false,
    overlay_opacity: 55,
    accent_color: null,
    status: 'published',
    sort_order: 3,
  },
  {
    id: 'cls-4',
    slug: 'rueda-de-casino-avanzado',
    title: 'Rueda de Casino',
    style: 'Rueda de Casino',
    level: 'avanzado',
    description:
      'Más de 40 figuras cantadas, cambios rápidos y coreografía grupal. El sello de Habana Mix.',
    image_url: '/images/event-workshop.png',
    instructor: 'Yoandri Suárez',
    schedule: ['Viernes 20:00'],
    duration_min: 90,
    price_amount: 40,
    price_currency: 'USD',
    price_period: 'mes',
    capacity: 30,
    spots_left: 12,
    theme: 'noche',
    layout: 'split',
    tags: ['Grupal', 'Nivel alto'],
    featured: false,
    overlay_opacity: 55,
    accent_color: null,
    status: 'published',
    sort_order: 4,
  },
]

const about: AboutContent = {
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
}

const location: LocationContent = {
  title: 'Cómo llegar',
  address: 'Av. del Malecón 1245, Local 3',
  city: 'Palermo, Buenos Aires',
  directions_note:
    'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  map_embed_url:
    'https://www.openstreetmap.org/export/embed.html?bbox=-58.4300%2C-34.5860%2C-58.4130%2C-34.5740&layer=mapnik&marker=-34.5800%2C-58.4215',
  map_link_url:
    'https://www.openstreetmap.org/?mlat=-34.5800&mlon=-58.4215#map=16/-34.5800/-58.4215',
  phone: '+54 11 5555 1234',
  whatsapp: '5491155551234',
  hours: [
    { label: 'Lunes a viernes', value: '17:00 – 23:00' },
    { label: 'Sábados', value: '11:00 – 20:00' },
    { label: 'Domingos', value: 'Solo eventos' },
  ],
}

export async function getEvents(): Promise<AcademyEvent[]> {
  return events
}

export async function getClasses(): Promise<DanceClass[]> {
  return classes
}

export async function getAboutContent(): Promise<AboutContent> {
  return about
}

export async function getLocationContent(): Promise<LocationContent> {
  return location
}
