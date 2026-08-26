import { supabase } from '@/lib/supabase'
import { CompetitionCard } from '@/components/competition-card'
import type { Competition } from '@/lib/competition-types'

async function getCompetitions(): Promise<Competition[]> {
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  
  return data || []
}

export async function generateMetadata() {
  return {
    title: 'Competencias | Habana Mix',
    description: 'Eventos de competencia de baile Habana Mix'
  }
}

export default async function CompetitionsPage() {
  const competitions = await getCompetitions()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-3">
            Competencias
          </h1>
          <p className="text-lg text-muted-foreground">
            Eventos competitivos de baile
          </p>
        </div>
      </div>

      {/* Lista de competiciones */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {competitions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay competiciones activas en este momento
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}