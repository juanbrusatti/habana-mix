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
  scannedAt?: number
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

/**
 * Normaliza cualquier contenido de QR o código tipeado.
 * Soporta los tres formatos que hay en la calle:
 *  - QR viejos con link completo: https://…/entrada/<token>
 *  - QR nuevos: HM:ABCDE
 *  - Código de 5 caracteres tipeado a mano
 * Los tokens conservan mayúsculas/minúsculas (se validan por hash); los códigos van en mayúsculas.
 */
function parseScanValue(raw: string) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  if (trimmed.includes('/entrada/')) {
    return trimmed.split('/entrada/')[1]?.split(/[?#]/)[0] || ''
  }
  const withoutPrefix = trimmed.toUpperCase().startsWith('HM:') ? trimmed.slice(3).trim() : trimmed
  return /^[a-z0-9]{5}$/i.test(withoutPrefix) ? withoutPrefix.toUpperCase() : withoutPrefix
}

/** Ventana en la que se ignora el mismo QR para no re-consultarlo mientras sigue frente a la cámara. */
const REPEAT_SCAN_MS = 6000
/** Pausa mínima entre dos lecturas distintas. */
const SCAN_COOLDOWN_MS = 800

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
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [search, setSearch] = useState('')
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handlingScanRef = useRef(false)
  const lastScanRef = useRef<{ value: string; at: number }>({ value: '', at: 0 })
  const handleScanRef = useRef<(rawValue: string) => Promise<void>>(async () => undefined)
  const audioContextRef = useRef<AudioContext | null>(null)

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

    try {
      const storedScanResult = sessionStorage.getItem('access_scan_result')
      if (storedScanResult) {
        const parsed = JSON.parse(storedScanResult) as ScanResult
        // Solo restauramos un resultado reciente: un cartel viejo de "puede ingresar" confunde al personal.
        if (parsed.scannedAt && Date.now() - parsed.scannedAt < 60_000) setResult(parsed)
        else sessionStorage.removeItem('access_scan_result')
      }
    } catch {
      sessionStorage.removeItem('access_scan_result')
    }
  }, [])

  /** Aviso sonoro + vibración para que el personal no dependa de mirar la pantalla. */
  const notify = useCallback((ok: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        if (!audioContextRef.current) audioContextRef.current = new AudioCtx()
        const context = audioContextRef.current
        if (context.state === 'suspended') void context.resume()
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = ok ? 880 : 220
        gain.gain.value = 0.12
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + (ok ? 0.16 : 0.45))
      }
    } catch {
      // sin audio disponible: no es crítico
    }

    try {
      navigator.vibrate?.(ok ? 80 : [90, 70, 90])
    } catch {
      // sin vibración disponible
    }
  }, [])

  const login = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    const normalizedUsername = username.trim()
    if (!normalizedUsername || !password) {
      setLoginError('Ingresá usuario y contraseña.')
      setLoginLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_username: normalizedUsername,
        p_password: password,
      })

      if (error) {
        console.error('Error verificando credenciales de control:', error)
        throw new Error(`No se pudo conectar con la autenticación: ${error.message}`)
      }

      const authResult = typeof data === 'string' ? JSON.parse(data) : data
      if (!authResult?.success) {
        throw new Error(authResult?.message || 'Usuario o contraseña inválidos')
      }

      const nextSession = {
        admin_id: authResult.admin_id,
        username: authResult.username,
        full_name: authResult.full_name,
        login_time: new Date().toISOString(),
      }
      localStorage.setItem('admin_session', JSON.stringify(nextSession))
      setSession(nextSession)
    } catch (error) {
      console.error('Error iniciando sesión en control de acceso:', error)
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

  const showResult = useCallback((data: ScanResult) => {
    const nextResult = { ...data, scannedAt: Date.now() }
    setResult(nextResult)
    try {
      sessionStorage.setItem('access_scan_result', JSON.stringify(nextResult))
    } catch {
      // sessionStorage lleno o bloqueado: el cartel igual se muestra en pantalla
    }
    notify(Boolean(data.valid))
  }, [notify])

  /**
   * Escanea y valida en la misma pantalla: la cámara nunca se cierra ni se navega a otra página.
   */
  const handleScan = useCallback(async (rawValue: string) => {
    if (!session || handlingScanRef.current) return

    const parsedValue = parseScanValue(rawValue)
    if (!parsedValue) return

    // Mismo QR todavía frente a la cámara: mantenemos el cartel y no volvemos a consultar.
    const now = Date.now()
    if (parsedValue === lastScanRef.current.value && now - lastScanRef.current.at < REPEAT_SCAN_MS) return
    lastScanRef.current = { value: parsedValue, at: now }

    handlingScanRef.current = true
    setLoading(true)

    try {
      const data = await requestTicket(rawValue, true)
      if (!data) return

      if (data.error) {
        showResult({ error: data.error, message: data.error })
        setValue('')
        return
      }

      showResult(data)
      setValue('')
    } catch (error) {
      console.error('Error validando entrada escaneada:', error)
      showResult({ error: 'Sin conexión. Reintentá el escaneo.', message: 'Sin conexión. Reintentá el escaneo.' })
      // Un fallo de red no debe bloquear el reintento del mismo QR.
      lastScanRef.current = { value: '', at: 0 }
    } finally {
      setLoading(false)
      setTimeout(() => {
        handlingScanRef.current = false
      }, SCAN_COOLDOWN_MS)
    }
  }, [requestTicket, session, showResult])

  useEffect(() => {
    handleScanRef.current = handleScan
  }, [handleScan])

  /** Botón Validar: valida el código tipeado a mano. */
  const handleValidate = async () => {
    if (!value.trim() || !session || loading) return
    setLoading(true)

    try {
      const data = await requestTicket(value, true)
      if (!data) return

      if (data.error) {
        showResult({ error: data.error, message: data.error })
        return
      }

      showResult(data)
      if (data.valid) setValue('')
    } catch (error) {
      console.error('Error validando entrada:', error)
      showResult({ error: 'Sin conexión. Reintentá.', message: 'Sin conexión. Reintentá.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session || !cameraOpen) return

    let cancelled = false
    const scanner = new Html5Qrcode('ticket-qr-reader')
    scannerRef.current = scanner

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75)
              return { width: size, height: size }
            },
          },
          (decodedText) => {
            // La cámara sigue corriendo: se escanea uno atrás de otro sin tocar nada.
            void handleScanRef.current(decodedText)
          },
          () => undefined,
        )
        if (cancelled) {
          await scanner.stop().catch(() => undefined)
          return
        }
        setCameraReady(true)
      } catch (error) {
        console.error('Error abriendo la cámara:', error)
        if (!cancelled) {
          setCameraReady(false)
          setCameraError(
            'No se pudo abrir la cámara. Verificá que el navegador tenga permiso de cámara y que la página esté en HTTPS. Podés seguir validando con el código de 5 caracteres.',
          )
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      setCameraReady(false)
      const activeScanner = scannerRef.current
      scannerRef.current = null
      if (!activeScanner) return
      activeScanner
        .stop()
        .then(() => activeScanner.clear())
        .catch(() => undefined)
    }
  }, [cameraOpen, session])

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
          <Button type="submit" className="w-full" disabled={loginLoading}>
            {loginLoading ? 'Ingresando…' : 'Ingresar'}
          </Button>
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
        </form>
      </main>
    )
  }

  const isAuthorized = Boolean(result?.valid)
  const isRejected = Boolean(result && !result.valid)
  const bannerTone = isAuthorized
    ? 'border-green-600 bg-green-600 text-white'
    : 'border-red-600 bg-red-600 text-white'
  const bannerTitle = isAuthorized
    ? '✓ PUEDE INGRESAR'
    : result?.alreadyUsed
      ? '✗ ENTRADA YA UTILIZADA'
      : '✗ ENTRADA NO VÁLIDA'

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Control de acceso</p>
        <h1 className="font-serif text-4xl font-semibold">Validar entrada</h1>
        <p className="mt-2 text-muted-foreground">
          Abrí la cámara una vez y escaneá un QR atrás del otro: cada lectura autoriza el ingreso y muestra el cartel
          sin salir de esta pantalla.
        </p>
      </div>

      {result && (
        <div className={`rounded-2xl border-2 p-5 ${bannerTone}`} role="status" aria-live="assertive">
          <p className="text-2xl font-bold tracking-tight">{bannerTitle}</p>
          {result.attendee && (
            <p className="mt-2 text-lg font-semibold">
              {result.attendee.name} {result.attendee.surname}
            </p>
          )}
          {result.attendee && (
            <p className="text-sm opacity-90">
              {result.attendee.event_title}
              {result.attendee.ticket_code ? ` · ${result.attendee.ticket_code}` : ''}
            </p>
          )}
          {isRejected && (
            <p className="mt-2 text-sm opacity-90">{result.message || result.error || 'Entrada inválida'}</p>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Validando…</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => {
            setCameraError('')
            setCameraOpen((open) => !open)
          }}
          variant={cameraOpen ? 'outline' : 'default'}
        >
          {cameraOpen ? 'Cerrar cámara' : 'Abrir cámara'}
        </Button>
        {result && (
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => {
              setResult(null)
              try {
                sessionStorage.removeItem('access_scan_result')
              } catch {
                // nada que limpiar
              }
            }}
          >
            Limpiar cartel
          </Button>
        )}
      </div>

      {cameraOpen && (
        <div className="space-y-2">
          <div id="ticket-qr-reader" className="w-full overflow-hidden rounded-xl border bg-black" />
          <p className="text-xs text-muted-foreground">
            {cameraReady ? 'Cámara activa: apuntá al QR de cada entrada.' : 'Abriendo cámara…'}
          </p>
        </div>
      )}
      {cameraError && <p className="text-sm text-amber-600">{cameraError}</p>}

      <div className="flex gap-2">
        <Input
          placeholder="Código de 5 caracteres"
          value={value}
          onChange={(event) => {
            const next = event.target.value.trim()
            // Si pegan el link del QR viejo, lo resolvemos y validamos igual.
            if (next.includes('/entrada/')) {
              void handleScan(next)
              return
            }
            setValue(next.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleValidate()
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

      <div className="border-t pt-5">
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            localStorage.removeItem('admin_session')
            setSession(null)
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
