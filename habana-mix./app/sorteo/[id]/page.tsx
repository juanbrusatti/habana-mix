import { RaffleScreen } from '@/components/raffle-screen'

export default async function RafflePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RaffleScreen raffleId={id} />
}
