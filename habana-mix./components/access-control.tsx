'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AttendeePreview {
  event_title: string
  name: string
  surname: string
  ticket_code: string
  checked_in_at?: string | null
}

interface ScanResult {
  found?: boolean
  valid?: boolean
  alreadyUsed?: boolean
  pendingConfirm?: boolean
  message?: string
  error?: string
  attendee?: AttendeePreview
}

interface Attendance {
  id: string
  event_title: string
  name: string
  surname: string
  dni: string
  phone: string
  email: string
  ticket_code: string | null
  checked_in_at: string | null
}

interface AdminSession {
  admin_id: string
  username?: string
  full_name?: string
  login_time: string
}

/** Extrae el token del link del QR o deja el código alfanumérico. */
function parseScanValue(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.includes('/entrada/')) {
    return trimmed.split('/entrada/')[1]?.split(/[?#]/)[0] || ''
  }
  return trimmed.toUpperCase()
}

export function AccessControl() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [search, setSearch] = useState('')
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handlingScanRef = useRef(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_session')
      if (!stored) return
      const parsed = JSON.parse(stored) as AdminSession
      if ((Date.now() - new Date(parsed.login_time).getTime()) / 3_600_000 <= 24) {
        setSession(parsed)
      }
    } catch {
      localStorage.removeItem('admin_session')
    }
  }, [])

  const login = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_username: username,
        p_password: password,
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'Credenciales inválidas')
      const nextSession = {
        admin_id: data.admin_id,
        username: data.username,
        full_name: data.full_name,
        login_time: new Date().toISOString(),
      }
      localStorage.setItem('admin_session', JSON.stringify(nextSession))
      setSession(nextSession)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión')
    } finally {
      setLoginLoading(false)
    }
  }

  const requestTicket = useCallback(async (rawValue: string, confirm: boolean) => {
    if (!session) return null
    const parsedValue = parseScanValue(rawValue)
    if (!parsedValue) return null

    const response = await fetch('/api/tickets/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': session.admin_id,
      },
      body: JSON.stringify({ value: parsedValue, confirm }),
    })
    const data = await response.json()
    return data as ScanResult & { error?: string }
  }, [session])

  /** Escaneo: solo busca y carga el código alfa. No marca como usada. */
  const handleScan = useCallback(async (rawValue: string) => {
    if (!session || handlingScanRef.current) return
    handlingScanRef.current = true
    setLoading(true)
    setResult(null)

    try {
      const data = await requestTicket(rawValue, false)
      if (!data) return

      if (data.error) {
        setResult({ error: data.error, message: data.error })
        setValue('')
        return
      }

      const code = data.attendee?.ticket_code || ''
      if (code) setValue(code)

      setResult({
        ...data,
        pendingConfirm: !data.alreadyUsed,
        message: data.alreadyUsed
          ? data.message
          : `QR leído (${code}). Tocá Validar entrada para autorizar.`,
      })
    } finally {
      setLoading(false)
      handlingScanRef.current = false
    }
  }, [requestTicket, session])

  /** Botón Validar: recién ahí marca la entrada como utilizada. */
  const handleValidate = async () => {
    if (!value.trim() || !session) return
    setLoading(true)
    setResult(null)

    try {
      const data = await requestTicket(value, true)
      if (!data) return

      if (data.error) {
        setResult({ error: data.error, message: data.error })
        return
      }

      setResult(data)
      if (data.valid) setValue('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session || !cameraOpen) return

    const scanner = new Html5Qrcode('ticket-qr-reader')
    scannerRef.current = scanner

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (handlingScanRef.current) return
            try {
              await scanner.stop()
            } catch {
              // ya detenido
            }
            setCameraOpen(false)
            await handleScan(decodedText)
          },
          () => undefined,
        )
      } catch {
        setCameraError('No se pudo abrir la cámara. Revisá los permisos de HTTPS y del navegador.')
      }
    }

    start()

    return () => {
      scanner.stop().catch(() => undefined)
      scanner.clear()
      scannerRef.current = null
    }
  }, [cameraOpen, session, handleScan])

  useEffect(() => {
    if (!session) return
    supabase
      .from('attendances')
      .select('id, event_title, name, surname, dni, phone, email, ticket_code, checked_in_at')
      .eq('is_free', false)
      .eq('payment_status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAttendances(data || []))
  }, [session, result])

  const filteredAttendances = attendances.filter((record) =>
    `${record.event_title} ${record.name} ${record.surname} ${record.dni} ${record.phone} ${record.email} ${record.ticket_code || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <form onSubmit={login} className="w-full space-y-5 rounded-2xl border bg-card p-6">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Personal autorizado</p>
            <h1 className="font-serif text-3xl font-semibold">Control de acceso</h1>
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-username">Usuario</Label>
            <Input
              id="access-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-password">Contraseña</Label>
            <Input
              id="access-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button className="w-full" disabled={loginLoading}>
            {loginLoading ? 'Ingresando…' : 'Ingresar'}
          </Button>
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
        </form>
      </main>
    )
  }

  const resultTone = result?.valid
    ? 'border-green-500 bg-green-500/5'
    : result?.pendingConfirm
      ? 'border-amber-500 bg-amber-500/5'
      : result?.alreadyUsed || result?.error
        ? 'border-red-500 bg-red-500/5'
        : 'border-border'

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Control de acceso</p>
        <h1 className="font-serif text-4xl font-semibold">Validar entrada</h1>
        <p className="mt-2 text-muted-foreground">
          Escaneá el QR para cargar el código, revisá los datos y confirmá con Validar entrada.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          onClick={() => {
            setCameraError('')
            setCameraOpen(true)
          }}
        >
          Abrir cámara
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            localStorage.removeItem('admin_session')
            setSession(null)
          }}
        >
          Cerrar sesión
        </Button>
      </div>

      {cameraOpen && (
        <div id="ticket-qr-reader" className="w-full overflow-hidden rounded-xl border bg-black" />
      )}
      {cameraError && <p className="text-sm text-amber-600">{cameraError}</p>}

      <div className="flex gap-2">
        <Input
          placeholder="Código de 5 caracteres"
          value={value}
          onChange={(event) => {
            const next = event.target.value.trim()
            // Si pegan el link del QR, solo lo resolvemos a código (sin marcar usada)
            if (next.includes('/entrada/')) {
              handleScan(next)
              return
            }
            setValue(next.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleValidate()
            }
          }}
          maxLength={5}
          className="font-mono tracking-widest uppercase"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
        />
        <Button type="button" onClick={handleValidate} disabled={loading || value.trim().length !== 5}>
          {loading ? '…' : 'Validar entrada'}
        </Button>
      </div>

      {result && (
        <div className={`rounded-xl border p-5 ${resultTone}`}>
          <p className="font-semibold">{result.message || result.error || 'Entrada inválida'}</p>
          {result.attendee && (
            <p className="mt-2 text-sm">
              {result.attendee.name} {result.attendee.surname} · {result.attendee.event_title}
              {result.attendee.ticket_code ? ` · ${result.attendee.ticket_code}` : ''}
            </p>
          )}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Asistencias pagas</h2>
          <p className="text-sm text-muted-foreground">
            Buscá por evento, nombre, DNI, teléfono, email o código.
          </p>
        </div>
        <Input
          placeholder="Buscar asistencia"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="space-y-2">
          {filteredAttendances.map((record) => (
            <button
              key={record.id}
              type="button"
              className="w-full rounded-xl border p-4 text-left"
              onClick={() => {
                if (!record.ticket_code) return
                setValue(record.ticket_code)
                setResult(null)
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <strong>
                  {record.name} {record.surname}
                </strong>
                <span className="font-mono text-sm">{record.ticket_code || 'Sin código'}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{record.event_title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {record.dni} · {record.phone} · {record.email}
              </p>
              {record.checked_in_at && (
                <p className="mt-1 text-xs text-red-500">
                  Usada: {new Date(record.checked_in_at).toLocaleString('es-AR')}
                </p>
              )}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
