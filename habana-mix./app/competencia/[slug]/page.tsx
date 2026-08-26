import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CompetitionDetail } from '@/components/competition-detail'
import type { CompetitionWithDetails } from '@/lib/competition-types'

async function getCompetition(slug: string): Promise<CompetitionWithDetails | null> {
  console.log('Buscando competencia con slug:', slug)
  
  const { data: competition, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error al buscar competencia:', error)
    return null
  }

  console.log('Competición encontrada:', competition)
  
  if (!competition) return null

  const [{ data: sections }, { data: schedules }] = await Promise.all([
    supabase
      .from('competition_sections')
      .select('*')
      .eq('competition_id', competition.id)
      .order('sort_order'),
    supabase
      .from('competition_schedules')
      .select('*')
      .eq('competition_id', competition.id)
      .order('start_time')
  ])

  return {
    ...competition,
    sections: sections || [],
    schedules: schedules || []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = await getCompetition(slug)
  
  if (!competition) {
    return {
      title: 'Competencia no encontrada'
    }
  }

  return {
    title: `${competition.title} | Habana Mix`,
    description: competition.description || 'Competencia de baile Habana Mix'
  }
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const competition = await getCompetition(slug)

  if (!competition) {
    notFound()
  }

  return <CompetitionDetail competition={competition} />
}