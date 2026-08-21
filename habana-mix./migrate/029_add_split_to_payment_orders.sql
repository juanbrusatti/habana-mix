-- 029_add_split_to_payment_orders.sql
-- Agrega campos para registrar split payments en las órdenes de pago

-- Habilitar split payment para esta orden
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_enabled boolean NOT NULL DEFAULT false;

-- Monto que se envió a la segunda cuenta
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_amount numeric(12, 2);

-- Descripción del split
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_description text;

-- ID del pago split en la segunda cuenta
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_payment_id text;

-- Estado del split payment
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_payment_status text
  CHECK (split_payment_status IN ('pending', 'approved', 'failed'));

-- Error si falló el split payment
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_payment_error text;

-- Timestamp de ejecución del split payment
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS split_payment_executed_at timestamptz;

-- Índices para consultas de split payments
CREATE INDEX IF NOT EXISTS payment_orders_split_enabled_idx
  ON public.payment_orders (split_enabled, split_payment_status)
  WHERE split_enabled = true;

-- Comentarios para documentación
COMMENT ON COLUMN public.payment_orders.split_enabled IS 'Indica si esta orden tiene split payment habilitado';
COMMENT ON COLUMN public.payment_orders.split_amount IS 'Monto que se envía a la segunda cuenta de MercadoPago';
COMMENT ON COLUMN public.payment_orders.split_description IS 'Descripción del split payment';
COMMENT ON COLUMN public.payment_orders.split_payment_id IS 'ID del pago en la segunda cuenta de MercadoPago';
COMMENT ON COLUMN public.payment_orders.split_payment_status IS 'Estado del split payment (pending, approved, failed)';
COMMENT ON COLUMN public.payment_orders.split_payment_error IS 'Mensaje de error si falló el split payment';
COMMENT ON COLUMN public.payment_orders.split_payment_executed_at IS 'Timestamp de ejecución del split payment';
