import { PaymentStatusScreen } from '@/components/payment-status-screen'

export const metadata = { title: 'El pago no se completó | Habana Mix' }

export default function PaymentErrorPage() {
  return (
    <PaymentStatusScreen
      tone="error"
      title="El pago no se completó"
      description="No se hizo ningún cobro. Podés volver al evento e intentarlo de nuevo."
      whatsappText="Hola, tuve problemas con el pago de mi entrada. ¿Podrían ayudarme?"
    />
  )
}
