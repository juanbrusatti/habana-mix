import { MessageCircle } from 'lucide-react'

export default function PaymentPendingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase text-primary">Mercado Pago</p>
      <h1 className="font-serif text-4xl font-semibold">Pago pendiente</h1>
      <p className="text-muted-foreground">
        Mercado Pago todavía está procesando tu pago. Te avisaremos cuando cambie el estado.
      </p>
      <a className="font-semibold underline underline-offset-4" href="/">
        Volver al inicio
      </a>
      <a
        href="https://wa.me/5493584178955?text=Hola,%20mi%20pago%20está%20pendiente%20y%20necesito%20ayuda.%20¿Podrían%20verificar?"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
      >
        <MessageCircle className="h-4 w-4" />
        Contactar por WhatsApp
      </a>
    </main>
  )
}
