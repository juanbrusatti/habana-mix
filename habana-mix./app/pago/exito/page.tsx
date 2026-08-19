export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase text-primary">Mercado Pago</p>
      <h1 className="font-serif text-4xl font-semibold">Pago recibido</h1>
      <p className="text-muted-foreground">
        Estamos confirmando tu reserva. Recibirás la confirmación en el email informado.
      </p>
      <a className="font-semibold underline underline-offset-4" href="/">
        Volver al inicio
      </a>
    </main>
  )
}
