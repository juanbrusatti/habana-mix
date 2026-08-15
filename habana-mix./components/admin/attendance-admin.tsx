'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

interface Attendance {
  id: string
  event_id: string
  event_title: string
  name: string
  surname: string
  dni: string
  phone: string
  email: string
  is_free: boolean
  created_at: string
}

export function AttendanceAdmin() {
  const [loading, setLoading] = useState(true)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('attendances').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setAttendances(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const gratuitos = attendances.filter(a => a.is_free)
  const pagos = attendances.filter(a => !a.is_free)

  const groupedByEvent = gratuitos.reduce<Record<string, Attendance[]>>((acc, cur) => {
    acc[cur.event_title] = acc[cur.event_title] || []
    acc[cur.event_title].push(cur)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Asistencias</h3>
        <Button variant="outline" onClick={load}>Actualizar</Button>
      </div>

      <Tabs defaultValue="gratuitos">
        <TabsList>
          <TabsTrigger value="gratuitos">Gratuitos ({gratuitos.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({pagos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="gratuitos">
          {loading ? (
            <p>Cargando…</p>
          ) : Object.keys(groupedByEvent).length === 0 ? (
            <p>No hay registros gratuitos aún.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedByEvent).map(([title, list]) => (
                <div key={title} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{title}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">{list.length} registros</div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedEvent(selectedEvent === title ? null : title)}>
                        {selectedEvent === title ? 'Ocultar' : 'Ver registros'}
                      </Button>
                    </div>
                  </div>

                  {selectedEvent === title && (
                    <ul className="mt-3 space-y-2">
                      {list.map((r) => (
                        <li key={r.id} className="text-sm">
                          {r.name} {r.surname} · {r.dni} · {r.phone} · {r.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagos">
          {loading ? (
            <p>Cargando…</p>
          ) : pagos.length === 0 ? (
            <p>No hay registros de pago aún.</p>
          ) : (
            <div className="space-y-2">
              {pagos.map((r) => (
                <div key={r.id} className="border rounded-lg p-3 text-sm">
                  <div className="font-semibold">{r.event_title}</div>
                  <div>{r.name} {r.surname} · {r.dni} · {r.phone} · {r.email}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
