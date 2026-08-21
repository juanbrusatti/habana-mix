'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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
  payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
  ticket_code: string | null
  ticket_token: string | null
  created_at: string
}

const buildPrintableFreeAttendanceHtml = (eventTitle: string, list: Attendance[]) => {
  const rows = list
    .map(
      (record) => `
        <tr>
          <td>${record.name} ${record.surname}</td>
          <td>${record.dni}</td>
          <td>${record.phone}</td>
          <td>${record.email}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${eventTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d4d4d4; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background: #f3f3f3; }
        </style>
      </head>
      <body>
        <h1>${eventTitle}</h1>
        <table>
          <thead>
            <tr>
              <th>Nombre y apellido</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `
}

function AttendanceRecordRow({
  record,
  onDelete,
  onTicket,
  onResendTicket,
}: {
  record: Attendance
  onDelete: (id: string, name: string, surname: string) => void
  onTicket?: (record: Attendance) => void
  onResendTicket?: (record: Attendance) => void
}) {
  return (
    <li className="border rounded-lg p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">
            {record.name} {record.surname}
          </div>
          <div className="text-muted-foreground mt-1">
            {record.dni} · {record.phone} · {record.email}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {onTicket && !record.is_free && <Button variant="outline" size="sm" onClick={() => onTicket(record)}>Entrada</Button>}
          {onResendTicket && !record.is_free && <Button variant="outline" size="sm" onClick={() => onResendTicket(record)}>Reenviar</Button>}
          <Button variant="destructive" size="sm" onClick={() => onDelete(record.id, record.name, record.surname)}>Eliminar</Button>
        </div>
      </div>
    </li>
  )
}

export function AttendanceAdmin() {
  const [loading, setLoading] = useState(true)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [eventSearchTerm, setEventSearchTerm] = useState<Record<string, string>>({})
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; surname: string } | null>(null)
  const [adminId, setAdminId] = useState('')
  const [giftOpen, setGiftOpen] = useState(false)
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([])
  const [giftForm, setGiftForm] = useState({ event_id: '', name: '', surname: '', dni: '', phone: '', email: '' })
  const [giftLoading, setGiftLoading] = useState(false)

  useEffect(() => {
    load()
    try { setAdminId(JSON.parse(localStorage.getItem('admin_session') || '{}').admin_id || '') } catch { setAdminId('') }
    supabase.from('events').select('id, title').order('created_at', { ascending: true }).then(({ data }) => setEvents(data || []))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      let currentAdminId = adminId
      if (!currentAdminId) {
        try { currentAdminId = JSON.parse(localStorage.getItem('admin_session') || '{}').admin_id || '' } catch { currentAdminId = '' }
      }
      const response = await fetch('/api/admin/attendances', { headers: { 'x-admin-id': currentAdminId } })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Error al cargar asistencias')
      setAttendances(result.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar asistencias')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAttendance = async (id: string, name: string, surname: string) => {
    setPendingDelete({ id, name, surname })
  }

  const confirmDeleteAttendance = async () => {
    if (!pendingDelete) return

    try {
      const { error } = await supabase.from('attendances').delete().eq('id', pendingDelete.id)
      if (error) throw error

      setAttendances((current) => current.filter((record) => record.id !== pendingDelete.id))
      setPendingDelete(null)
      toast.success('Registrado eliminado')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar el registro')
    }
  }

  const handlePrintFreeAttendanceList = (eventTitle: string, list: Attendance[]) => {
    if (!list.length) {
      toast.info('No hay registros para imprimir en este evento')
      return
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast.error('El navegador bloqueó la ventana de impresión')
      return
    }

    printWindow.document.write(buildPrintableFreeAttendanceHtml(eventTitle, list))
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleTicket = async (record: Attendance) => {
    if (!adminId) return
    const response = await fetch(`/api/admin/tickets/${record.id}`, { headers: { 'x-admin-id': adminId } })
    const data = await response.json()
    if (!response.ok) { toast.error(data.error || 'No se pudo recuperar la entrada'); return }
    window.open(data.ticketUrl, '_blank', 'noopener,noreferrer')
  }

  const handleResendTicket = async (record: Attendance) => {
    if (!adminId) return
    const response = await fetch(`/api/admin/tickets/${record.id}`, { method: 'POST', headers: { 'x-admin-id': adminId } })
    const data = await response.json()
    if (!response.ok) { toast.error(data.error || 'No se pudo reenviar la entrada'); return }
    toast.success('Entrada reenviada por email')
  }

  const createGift = async (event: React.FormEvent) => {
    event.preventDefault()
    setGiftLoading(true)
    try {
      const response = await fetch('/api/admin/attendances/gift', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId }, body: JSON.stringify(giftForm) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la invitación')
      toast.success('Invitación creada con QR y código único')
      setGiftOpen(false)
      setGiftForm({ event_id: '', name: '', surname: '', dni: '', phone: '', email: '' })
      load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo crear la invitación') }
    finally { setGiftLoading(false) }
  }

  const gratuitos = attendances.filter((a) => a.is_free)
  const pagos = attendances.filter((a) => !a.is_free)

  const groupedByEvent = useMemo(
    () =>
      gratuitos.reduce<Record<string, Attendance[]>>((acc, cur) => {
        acc[cur.event_title] = acc[cur.event_title] || []
        acc[cur.event_title].push(cur)
        return acc
      }, {}),
    [gratuitos],
  )

  const groupedPaidByEvent = useMemo(
    () =>
      pagos.reduce<Record<string, Attendance[]>>((acc, cur) => {
        acc[cur.event_title] = acc[cur.event_title] || []
        acc[cur.event_title].push(cur)
        return acc
      }, {}),
    [pagos],
  )

  const filteredEventList = useMemo(() => {
    return Object.entries(groupedByEvent).reduce<Record<string, Attendance[]>>((acc, [title, list]) => {
      const normalizedSearch = (eventSearchTerm[title] || '').trim().toLowerCase()

      if (!normalizedSearch) {
        acc[title] = list
        return acc
      }

      const matches = list.filter((record) => {
        const haystack = `${record.name} ${record.surname} ${record.dni} ${record.phone} ${record.email}`.toLowerCase()
        return haystack.includes(normalizedSearch)
      })

      if (matches.length > 0) {
        acc[title] = matches
      }

      return acc
    }, {})
  }, [groupedByEvent, eventSearchTerm])

  const filteredPaidEventList = useMemo(() => {
    return Object.entries(groupedPaidByEvent).reduce<Record<string, Attendance[]>>((acc, [title, list]) => {
      const normalizedSearch = (eventSearchTerm[`paid:${title}`] || '').trim().toLowerCase()

      if (!normalizedSearch) {
        acc[title] = list
        return acc
      }

      const matches = list.filter((record) => {
        const haystack = `${record.name} ${record.surname} ${record.dni} ${record.phone} ${record.email}`.toLowerCase()
        return haystack.includes(normalizedSearch)
      })

      if (matches.length > 0) acc[title] = matches
      return acc
    }, {})
  }, [groupedPaidByEvent, eventSearchTerm])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Asistencias</h3>
        <Button variant="outline" onClick={load}>Actualizar</Button>
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar registro</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar a {pendingDelete ? `${pendingDelete.name} ${pendingDelete.surname}` : ''} de esta lista?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAttendance}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crear invitación</DialogTitle><DialogDescription>Generá una entrada paga sin cobrarle al invitado.</DialogDescription></DialogHeader>
          <form onSubmit={createGift} className="space-y-3">
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={giftForm.event_id} onChange={(event) => setGiftForm({ ...giftForm, event_id: event.target.value })} required><option value="">Elegir evento</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select>
            {(['name', 'surname', 'dni', 'phone', 'email'] as const).map((field) => <Input key={field} required type={field === 'email' ? 'email' : 'text'} placeholder={field === 'name' ? 'Nombre' : field === 'surname' ? 'Apellido' : field.toUpperCase()} value={giftForm[field]} onChange={(event) => setGiftForm({ ...giftForm, [field]: event.target.value })} />)}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setGiftOpen(false)}>Cancelar</Button><Button type="submit" disabled={giftLoading}>{giftLoading ? 'Creando…' : 'Crear entrada'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="gratuitos">
        <div className="mb-3 flex justify-end"><Button onClick={() => setGiftOpen(true)}>Crear invitación paga</Button></div>
        <TabsList>
          <TabsTrigger value="gratuitos">Gratuitos ({gratuitos.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({pagos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="gratuitos">
          {loading ? (
            <p>Cargando…</p>
          ) : Object.keys(filteredEventList).length === 0 ? (
            <p>No hay registros gratuitos aún.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(filteredEventList).map(([title, list]) => (
                <div key={title} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{title}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">{list.length} registros</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEvent(selectedEvent === title ? null : title)}
                      >
                        {selectedEvent === title ? 'Ocultar' : 'Ver registros'}
                      </Button>
                    </div>
                  </div>

                  {selectedEvent === title && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={eventSearchTerm[title] || ''}
                          onChange={(event) =>
                            setEventSearchTerm((current) => ({
                              ...current,
                              [title]: event.target.value,
                            }))
                          }
                          placeholder="Buscar en este evento"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintFreeAttendanceList(title, list)}
                        >
                          Exportar PDF
                        </Button>
                      </div>

                      {(() => {
                        const filteredByCurrentEvent =
                          (eventSearchTerm[title] || '').trim().toLowerCase() === ''
                            ? list
                            : list.filter((record) => {
                                const haystack = `${record.name} ${record.surname} ${record.dni} ${record.phone} ${record.email}`.toLowerCase()
                                return haystack.includes((eventSearchTerm[title] || '').trim().toLowerCase())
                              })

                        return filteredByCurrentEvent.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No hay coincidencias para este evento.</p>
                        ) : (
                          <ul className="space-y-2">
                            {filteredByCurrentEvent.map((record) => (
                              <AttendanceRecordRow
                                key={record.id}
                                record={record}
                                onDelete={handleDeleteAttendance}
                                onTicket={handleTicket}
                                onResendTicket={handleResendTicket}
                              />
                            ))}
                          </ul>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagos">
          {loading ? (
            <p>Cargando…</p>
          ) : Object.keys(filteredPaidEventList).length === 0 ? (
            <p>No hay registros de pago aún.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(filteredPaidEventList).map(([title, list]) => (
                <div key={title} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{title}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">{list.length} registros</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEvent(selectedEvent === `paid:${title}` ? null : `paid:${title}`)}
                      >
                        {selectedEvent === `paid:${title}` ? 'Ocultar' : 'Ver registros'}
                      </Button>
                    </div>
                  </div>

                  {selectedEvent === `paid:${title}` && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={eventSearchTerm[`paid:${title}`] || ''}
                          onChange={(event) =>
                            setEventSearchTerm((current) => ({
                              ...current,
                              [`paid:${title}`]: event.target.value,
                            }))
                          }
                          placeholder="Buscar en este evento"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintFreeAttendanceList(title, list)}
                        >
                          Exportar PDF
                        </Button>
                      </div>

                      {list.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay coincidencias para este evento.</p>
                      ) : (
                        <ul className="space-y-2">
                          {list.map((record) => (
                            <AttendanceRecordRow
                              key={record.id}
                              record={record}
                              onDelete={handleDeleteAttendance}
                              onTicket={handleTicket}
                              onResendTicket={handleResendTicket}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
