/**
 * Tipos que espejan 1:1 el esquema de Supabase (ver scripts/001_habana_mix_schema.sql).
 * Cuando conectes Supabase, estos tipos siguen siendo válidos.
 */

/** Tema de color para personalizar cada card. Coincide con el enum `card_theme` en SQL. */
export type CardTheme = 'amber' | 'coral' | 'teal' | 'noche' | 'crema'

/** Layout visual de la card. Coincide con el enum `card_layout` en SQL. */
export type CardLayout = 'overlay' | 'split' | 'minimal'

export interface AcademyEvent {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  price_label: string | null
  price_amount: number | null
  price_currency: string
  is_free: boolean
  cta_label: string | null
  /* --- Personalización libre de la card --- */
  theme: CardTheme
  layout: CardLayout
  /** Etiquetas superiores tipo "Timba en vivo", "Cupos limitados" */
  tags: string[]
  /** Intensidad del degradado sobre la imagen (0-100) */
  overlay_opacity: number
  /** Sobrescribe el color del tema si el admin quiere algo puntual */
  accent_color: string | null
  created_at?: string
}



export interface Attendance {
  id: string
  event_id: string
  event_title: string
  name: string
  surname: string
  dni: string
  phone: string
  email: string
  is_free: boolean
  payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
  payment_provider: string | null
  payment_preference_id: string | null
  payment_id: string | null
  payment_amount: number | null
  payment_currency: string | null
  paid_at: string | null
  created_at: string
}

/** Contenido editable por el admin: mapa, quiénes somos, footer, hero. */
export interface SiteContent {
  key: string
  value: Record<string, unknown>
}

export interface LocationContent {
  title: string
  address: string
  city: string
  directions_note: string
  map_embed_url: string
  map_link_url: string
  hours: { label: string; value: string }[]
  phone: string
  whatsapp: string
}

export interface AboutContent {
  title: string
  eyebrow: string
  paragraphs: string[]
  image_url: string
  stats: { value: string; label: string }[]
}
