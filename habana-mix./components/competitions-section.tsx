import { supabase } from '@/lib/supabase'
import { CompetitionCard } from '@/components/competition-card'
import type { Competition } from '@/lib/competition-types'

async function getCompetitions(): Promise<Competition[]> {
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .limit(3)
  
  return data || []
}

export async function CompetitionsSection() {
  const competitions = await getCompetitions()

  if (competitions.length === 0) {
    return null
  }

  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-3">
            Competencias
          </h2>
          <p className="text-muted-foreground">
            Eventos competitivos de baile
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>

        {competitions.length > 0 && (
          <div className="text-center mt-8">
            <a
              href="/competencias"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-colors"
            >
              Ver todas las competencias
            </a>
          </div>
        )}
      </div>
    </section>
  )
}