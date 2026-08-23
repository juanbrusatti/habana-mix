'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface EventOption { id: string; title: string; is_free: boolean; starts_at: string }

export function RaffleAdmin() {
  const [adminId, setAdminId] = useState('')
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventId, setEventId] = useState('')
  const [winnerCount, setWinnerCount] = useState('1')
  const [prize, setPrize] = useState('')
  const [participantCount, setParticipantCount] = useState<number | null>(null)
  const [raffleId, setRaffleId] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    try { setAdminId(JSON.parse(localStorage.getItem('admin_session') || '{}').admin_id || '') } catch { setAdminId('') }
    const storedAdminId = (() => { try { return JSON.parse(localStorage.getItem('admin_session') || '{}').admin_id || '' } catch { return '' } })()
    fetch('/api/admin/raffles', { headers: { 'x-admin-id': storedAdminId } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setEvents(data.data || []) })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los eventos'))
  }, [])

  const prepareRaffle = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)
    try {
      const response = await fetch('/api/admin/raffles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId }, body: JSON.stringify({ event_id: eventId, winner_count: Number(winnerCount), prize }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo preparar')
      setRaffleId(data.id)
      setParticipantCount(data.participantCount)
      toast.success('Sorteo preparado')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo preparar el sorteo') }
    finally { setCreating(false) }
  }

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-6">
      <div><p className="text-sm font-semibold uppercase text-primary">Evento en vivo</p><h2 className="font-serif text-2xl sm:text-3xl font-semibold">Sorteo</h2><p className="mt-2 text-sm sm:text-base text-muted-foreground">Prepará el sorteo y abrí la pantalla pública para proyectarla en el evento.</p></div>
      <form onSubmit={prepareRaffle} className="space-y-4 rounded-xl border p-4 sm:p-5">
        <div className="space-y-2"><Label htmlFor="raffle-event">Evento</Label><select id="raffle-event" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={eventId} onChange={(event) => setEventId(event.target.value)} required><option value="">Seleccionar evento</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title} {event.is_free ? '(Gratis)' : '(Pago)'}</option>)}</select></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="winner-count">Cantidad de ganadores</Label><Input id="winner-count" type="number" min="1" max="50" value={winnerCount} onChange={(event) => setWinnerCount(event.target.value)} className="text-base" /></div><div className="space-y-2"><Label htmlFor="prize">Premio</Label><Input id="prize" placeholder="Clase privada, regalo..." value={prize} onChange={(event) => setPrize(event.target.value)} className="text-base" /></div></div>
        <Button type="submit" disabled={creating} className="w-full sm:w-auto">{creating ? 'Preparando…' : 'Cargar participantes'}</Button>
      </form>
      {raffleId && <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-5"><p className="font-semibold">{participantCount} participantes listos</p><p className="text-sm text-muted-foreground">La pantalla pública muestra solo nombres. El sorteo se ejecuta una sola vez y queda guardado.</p><div className="flex flex-wrap gap-2"><Button onClick={() => window.open(`/sorteo/${raffleId}`, '_blank', 'noopener,noreferrer')}>Abrir pantalla del sorteo</Button><Button variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/sorteo/${raffleId}`).then(() => toast.success('Enlace copiado'))}>Copiar enlace</Button></div></div>}
    </div>
  )
}
