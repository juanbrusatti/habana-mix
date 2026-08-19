import { TicketView } from '@/components/ticket-view'

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <main className="mx-auto flex min-h-screen items-center justify-center px-6 py-12">
      <TicketView token={token} />
    </main>
  )
}
