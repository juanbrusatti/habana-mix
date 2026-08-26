export interface Competition {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompetitionSection {
  id: string
  competition_id: string
  title: string | null
  description: string | null
  media_url: string | null
  media_type: 'image' | 'video'
  button_text: string | null
  button_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompetitionSchedule {
  id: string
  competition_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompetitionWithDetails extends Competition {
  sections: CompetitionSection[]
  schedules: CompetitionSchedule[]
}