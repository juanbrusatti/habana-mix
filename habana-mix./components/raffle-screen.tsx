'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Participant { id: string; name: string }
interface Winner { position: number; participant_name: string }
interface Raffle { id: string; event_title: string; prize: string | null; winner_count: number; participant_count: number; participants: Participant[]; status: 'ready' | 'drawing' | 'completed'; winners: Winner[] }

export function RaffleScreen({ raffleId }: { raffleId: string }) {
  const [raffle, setRaffle] = useState<Raffle | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [rollingName, setRollingName] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const response = await fetch(`/api/raffles/${raffleId}`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No se pudo cargar el sorteo')
    setRaffle(data.raffle)
  }

  useEffect(() => { load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Error')).finally(() => setLoading(false)) }, [raffleId])

  const draw = async () => {
    if (!raffle || drawing || raffle.status === 'completed') return
    setDrawing(true)
    const timer = window.setInterval(() => setRollingName(raffle.participants[Math.floor(Math.random() * raffle.participants.length)]?.name || ''), 90)
    await new Promise((resolve) => window.setTimeout(resolve, 3200))
    window.clearInterval(timer)
    try {
      const response = await fetch(`/api/admin/raffles/${raffleId}/draw`, { method: 'POST', headers: { 'x-admin-id': localStorage.getItem('admin_session') ? JSON.parse(localStorage.getItem('admin_session') || '{}').admin_id : '' } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo sortear')
      await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Error realizando sorteo') }
    finally { setDrawing(false); setRollingName('') }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#130d1f] text-white"><p>Cargando sorteo…</p></main>
  if (error || !raffle) return <main className="flex min-h-screen items-center justify-center bg-[#130d1f] px-6 text-center text-white"><p>{error || 'Sorteo no encontrado'}</p></main>

  return <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#130d1f] px-6 py-10 text-center text-white"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(244,178,67,.28),transparent_42%),radial-gradient(circle_at_10%_90%,rgba(24,190,168,.18),transparent_35%)]" /><div className="relative z-10 w-full max-w-5xl space-y-8"><p className="text-sm font-semibold uppercase tracking-[.35em] text-amber-300">Sorteo en vivo</p><h1 className="font-serif text-5xl font-bold sm:text-8xl">{raffle.event_title}</h1>{raffle.prize && <p className="text-2xl text-amber-200 sm:text-4xl">Premio: {raffle.prize}</p>}<p className="text-white/70">{raffle.participant_count} participantes · {raffle.winner_count} ganador{raffle.winner_count === 1 ? '' : 'es'}</p>{drawing && <div className="animate-pulse rounded-3xl border border-amber-300/50 bg-amber-300/10 px-5 py-10"><p className="text-sm uppercase tracking-[.3em] text-amber-200">La suerte está girando</p><p className="mt-4 text-4xl font-bold sm:text-7xl">{rollingName}</p></div>}{!drawing && raffle.status === 'ready' && <Button size="lg" className="h-16 rounded-full px-10 text-xl" onClick={draw}>Comenzar sorteo</Button>}{raffle.status === 'completed' && <div className="space-y-4"><p className="text-sm uppercase tracking-[.3em] text-emerald-300">Ganadores</p>{raffle.winners.map((winner) => <div key={winner.position} className="rounded-2xl border border-emerald-300/50 bg-emerald-300/10 px-5 py-4 text-3xl font-bold sm:text-5xl">#{winner.position} · {winner.participant_name}</div>)}</div>}<div className="pt-8"><Button variant="ghost" className="text-white/60" onClick={() => document.documentElement.requestFullscreen?.()}>Pantalla completa</Button></div></div></main>
}
