'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  CircleCheckBigIcon,
  Clock3,
  FileImage,
  Loader2,
  Loader2Icon,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DanceClass } from '@/lib/types'
import { cn } from '@/lib/utils'

type Step = 'datos' | 'comprobante' | 'listo'

const paymentMethods = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'mercadopago', label: 'Mercado Pago' },
]

export function EnrollDialog({
  danceClass,
  open,
  onOpenChange,
}: {
  danceClass: DanceClass | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState<Step>('datos')
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    payment_method: 'transferencia',
    payment_reference: '',
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    // reinicia el flujo cada vez que se abre para otra clase
    setStep('datos')
    setFile(null)
    setSubmitting(false)
  }, [open, danceClass?.id])

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleDatos = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Completá tu nombre y email para continuar.')
      return
    }
    setStep('comprobante')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Adjuntá el comprobante de pago (imagen o PDF).')
      return
    }
    setSubmitting(true)

    /**
     * TODO (al conectar Supabase):
     *
     * 1. Registro / login:
     *    await supabase.auth.signUp({ email, password, options: {
     *      data: { full_name, phone },
     *      emailRedirectTo: `${location.origin}/auth/callback`,
     *    }})
     *
     * 2. Subir comprobante al bucket privado "comprobantes":
     *    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`
     *    await supabase.storage.from('comprobantes').upload(path, file)
     *
     * 3. Crear la inscripción (queda status = 'pending'):
     *    await supabase.from('enrollments').insert({
     *      user_id: user.id, class_id: danceClass.id, receipt_url: path, ...form
     *    })
     *
     * 4. El admin aprueba desde el panel -> el trigger SQL genera access_code
     *    y el alumno lo ve en su cuenta / recibe email.
     */
    await new Promise((r) => setTimeout(r, 1100))

    setSubmitting(false)
    setStep('listo')
    toast.success('Inscripción enviada. Te avisamos cuando la aprobemos.')
  }

  if (!danceClass) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-border/70 bg-card max-h-[92svh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-lg"
      >
        {/* Cabecera con la clase elegida */}
        <div className="border-border/60 relative border-b p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="border-border/70 bg-background/60 text-foreground/70 hover:text-foreground absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border transition-transform active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="gap-1.5 pr-12 text-left">
            <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
              {step === 'listo' ? 'Solicitud enviada' : 'Inscripción'}
            </p>
            <DialogTitle className="font-serif text-2xl leading-tight font-semibold">
              {danceClass.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {danceClass.schedule.join(' · ')} · $
              {Number(danceClass.price_amount).toLocaleString('es-ES')}
              {danceClass.price_period ? `/${danceClass.price_period}` : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Indicador de pasos */}
          {step !== 'listo' && (
            <div className="mt-5 flex items-center gap-2">
              {(['datos', 'comprobante'] as Step[]).map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                      step === s || (s === 'datos' && step === 'comprobante')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium capitalize',
                      step === s ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {s === 'datos' ? 'Tus datos' : 'Comprobante'}
                  </span>
                  {i === 0 && <span className="bg-border h-px flex-1" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paso 1: datos + cuenta */}
        {step === 'datos' && (
          <form onSubmit={handleDatos} className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre y apellido</Label>
              <Input
                id="full_name"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => set('full_name')(e.target.value)}
                placeholder="Camila Rodríguez"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => set('email')(e.target.value)}
                placeholder="camila@email.com"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set('phone')(e.target.value)}
                placeholder="+54 9 11 5555 1234"
                className="h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-12 w-full rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97]"
            >
              Continuar
            </Button>
          </form>
        )}

        {/* Paso 2: comprobante */}
        {step === 'comprobante' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set('payment_method')(m.value)}
                    className={cn(
                      'rounded-xl border px-2 py-3 text-xs font-semibold transition-all duration-200 active:scale-95',
                      form.payment_method === m.value
                        ? 'border-primary bg-primary/12 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Nº de operación (opcional)</Label>
              <Input
                id="reference"
                value={form.payment_reference}
                onChange={(e) => set('payment_reference')(e.target.value)}
                placeholder="Ej. 0012938471"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Dropzone / file input */}
            <div className="grid gap-2">
              <Label htmlFor="receipt">Comprobante de pago</Label>
              <label
                htmlFor="receipt"
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-7 text-center transition-colors',
                  file
                    ? 'border-primary/60 bg-primary/8'
                    : 'border-border hover:border-primary/50 bg-muted/25',
                )}
              >
                {file ? (
                  <>
                    <FileImage className="text-primary h-7 w-7" />
                    <span className="text-foreground max-w-full truncate text-sm font-medium">
                      {file.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {(file.size / 1024).toFixed(0)} KB · Tocá para cambiar
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="text-muted-foreground h-7 w-7" />
                    <span className="text-foreground text-sm font-medium">
                      Subir imagen o PDF
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Captura de la transferencia · máx. 5 MB
                    </span>
                  </>
                )}
                <input
                  id="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error('El archivo supera los 5 MB.')
                      return
                    }
                    setFile(f)
                  }}
                />
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Nota para el equipo (opcional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes')(e.target.value)}
                placeholder="Ej. pagué el pack de 2 clases semanales"
                className="resize-none rounded-xl"
              />
            </div>

            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('datos')}
                className="h-12 flex-1 rounded-full font-semibold transition-transform active:scale-[0.97]"
              >
                Atrás
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 flex-[1.6] rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  'Enviar inscripción'
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Paso 3: confirmación */}
        {step === 'listo' && (
          <div className="flex flex-col items-center gap-4 p-7 text-center sm:p-8">
            <span className="bg-primary/12 text-primary flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h3 className="font-serif text-2xl font-semibold">
              ¡Recibimos tu comprobante!
            </h3>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed text-pretty">
              Nuestro equipo lo revisa y, una vez aprobado, te enviamos por email
              tu <strong className="text-foreground">código único de acceso</strong>.
              Mostralo en la recepción de la academia para entrar a tus clases.
            </p>

            <div className="border-border/70 bg-muted/35 text-muted-foreground mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm">
              <Clock3 className="h-4 w-4" />
              Estado: <span className="text-foreground font-semibold">pendiente de aprobación</span>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 h-12 w-full rounded-full text-[15px] font-semibold transition-transform active:scale-[0.97]"
            >
              Listo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
