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
    </main>
  )
}
