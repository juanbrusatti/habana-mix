-- 031_add_webhook_processed_at.sql
-- Agrega columna de auditoría para saber exactamente cuándo el webhook de
-- Mercado Pago procesó cada orden. Útil para debugging y soporte.

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS webhook_processed_at timestamptz;

COMMENT ON COLUMN public.payment_orders.webhook_processed_at
  IS 'Timestamp en que el webhook de MP procesó la orden y creó la asistencia';

-- Índice para consultas de auditoría (ej: órdenes procesadas hoy)
CREATE INDEX IF NOT EXISTS payment_orders_webhook_processed_idx
  ON public.payment_orders (webhook_processed_at)
  WHERE webhook_processed_at IS NOT NULL;
