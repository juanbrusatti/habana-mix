import { LiveStage } from '@/components/live-stage'
import { getLiveConfig } from '@/lib/site-content'

export const metadata = {
  title: 'En vivo | Habana Mix',
  description: 'Mirá la transmisión en vivo de Habana Mix.',
}

/** El estado del vivo cambia a mano; se revalida seguido y el cliente sondea. */
export const revalidate = 15

export default async function LivePage() {
  const live = await getLiveConfig()

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <LiveStage initial={live} />
    </main>
  )
}
