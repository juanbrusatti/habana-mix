-- 024_paid_checkout_orders.sql
-- Guarda órdenes de Checkout Pro mientras el comprador completa el pago.
-- Solo las órdenes aprobadas se convierten en filas de attendances.

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_title text NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  dni text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS')),
  preference_id text,
  payment_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_preference_unique
  ON public.payment_orders (preference_id)
  WHERE preference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_payment_unique
  ON public.payment_orders (payment_id)
  WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_orders_event_status_idx
  ON public.payment_orders (event_id, status, created_at DESC);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
