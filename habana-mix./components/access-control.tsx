'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ValidationResult {
  valid?: boolean
  alreadyUsed?: boolean
  message?: string
  attendee?: { event_title: string; name: string; surname: string; ticket_code: string }
}

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>
}

interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetectorLike
}

export function AccessControl() {
  const [accessKey, setAccessKey] = useState('')
  const [value, setValue] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const validate = async (rawValue = value) => {
    const parsedValue = rawValue.includes('/entrada/')
      ? rawValue.split('/entrada/')[1].split(/[?#]/)[0]
      : rawValue.trim().toUpperCase()
    if (!parsedValue || !accessKey) return

    const response = await fetch('/api/tickets/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-key': accessKey },
      body: JSON.stringify({ value: parsedValue }),
    })
    const data = await response.json()
    setResult(data)
    setValue('')
  }

  useEffect(() => {
    if (!cameraOpen || !videoRef.current) return
    let active = true
    const start = async () => {
      try {
        const BarcodeDetectorClass = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
        if (!BarcodeDetectorClass) {
          setCameraError('Este navegador no admite escaneo QR. Ingresá el código manualmente.')
          return
        }
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] })
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        streamRef.current = stream
        videoRef.current!.srcObject = stream
        await videoRef.current!.play()
        const scan = async () => {
          if (!active || !videoRef.current) return
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            setCameraOpen(false)
            await validate(codes[0].rawValue)
            return
          }
          requestAnimationFrame(scan)
        }
        scan()
      } catch {
        setCameraError('No se pudo abrir la cámara. Ingresá el código manualmente.')
      }
    }
    start()
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [cameraOpen])

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Control de acceso</p>
        <h1 className="font-serif text-4xl font-semibold">Validar entrada</h1>
        <p className="mt-2 text-muted-foreground">Ingresá el código de control y luego escaneá el QR o escribí el código de 5 caracteres.</p>
      </div>

      <Input type="password" placeholder="Clave del personal" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} />
      <div className="flex gap-2">
        <Input placeholder="Código o enlace del QR" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && validate()} />
        <Button onClick={() => validate()}>Validar</Button>
      </div>
      <Button variant="outline" onClick={() => { setCameraError(''); setCameraOpen(true) }}>Abrir cámara</Button>

      {cameraOpen && <video ref={videoRef} className="w-full rounded-xl border" muted playsInline />}
      {cameraError && <p className="text-sm text-amber-600">{cameraError}</p>}

      {result && (
        <div className={`rounded-xl border p-5 ${result.valid ? 'border-green-500' : 'border-red-500'}`}>
          <p className="font-semibold">{result.message || 'Entrada inválida'}</p>
          {result.attendee && <p className="mt-2 text-sm">{result.attendee.name} {result.attendee.surname} · {result.attendee.event_title}</p>}
        </div>
      )}
    </main>
  )
}
