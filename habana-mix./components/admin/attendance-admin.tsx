'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
}: {
  record: Attendance
  onDelete: (id: string, name: string, surname: string) => void
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

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(record.id, record.name, record.surname)}
        >
          Eliminar
        </Button>
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

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttendances(data || [])
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

      <Tabs defaultValue="gratuitos">
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
          ) : pagos.length === 0 ? (
            <p>No hay registros de pago aún.</p>
          ) : (
            <div className="space-y-2">
              {pagos.map((r) => (
                <div key={r.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{r.event_title}</div>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {r.payment_status === 'approved'
                        ? 'Aprobado'
                        : r.payment_status === 'rejected'
                          ? 'Rechazado'
                          : r.payment_status === 'refunded'
                            ? 'Reintegrado'
                            : 'Pendiente'}
                    </span>
                  </div>
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
