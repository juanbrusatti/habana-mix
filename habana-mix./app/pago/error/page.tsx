import { MessageCircle } from 'lucide-react'

export default function PaymentErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase text-primary">Mercado Pago</p>
      <h1 className="font-serif text-4xl font-semibold">El pago no se completó</h1>
      <p className="text-muted-foreground">
        No se realizó ningún cobro. Puedes volver al evento e intentarlo nuevamente.
      </p>
      <a className="font-semibold underline underline-offset-4" href="/">
        Volver al inicio
      </a>
      <a
        href="https://wa.me/5493584178955?text=Hola,%20tuve%20problemas%20con%20el%20pago%20de%20mi%20entrada.%20¿Podrían%20ayudarme?"
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
