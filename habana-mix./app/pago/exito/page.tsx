import Link from 'next/link'
import { PaymentSuccessConfirmation } from '@/components/payment-success-confirmation'

export const metadata = {
  title: 'Pago confirmado | Habana Mix',
}

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 py-12 text-center">
      <div>
        <p className="text-primary text-[11px] font-semibold tracking-[0.24em] uppercase">
          Habana Mix
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold">Pago recibido</h1>
      </div>

      <PaymentSuccessConfirmation />

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 transition-colors hover:underline"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
