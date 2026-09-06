import { PaymentStatusScreen } from '@/components/payment-status-screen'

export const metadata = { title: 'Pago pendiente | Habana Mix' }

export default function PaymentPendingPage() {
  return (
    <PaymentStatusScreen
      tone="pending"
      title="Tu pago está en proceso"
      description="Mercado Pago todavía lo está procesando. Apenas se acredite te llega la entrada con el QR por email."
      whatsappText="Hola, mi pago está pendiente y necesito ayuda. ¿Podrían verificar?"
    />
  )
}
