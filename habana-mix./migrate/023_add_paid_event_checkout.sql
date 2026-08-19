-- 023_add_paid_event_checkout.sql
-- Agrega un precio numérico para Checkout Pro y el estado de pago de cada asistencia.
-- El precio del evento es el importe final que se cobra al comprador.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_amount numeric(12, 2);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'ARS';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_price_amount_positive') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_price_amount_positive
      CHECK (price_amount IS NULL OR price_amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_price_currency_supported') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_price_currency_supported
      CHECK (price_currency IN ('ARS'));
  END IF;
END$$;

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_provider text;

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_preference_id text;

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_id text;

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_amount numeric(12, 2);

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS payment_currency text;

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendances_payment_status_valid') THEN
    ALTER TABLE public.attendances ADD CONSTRAINT attendances_payment_status_valid
      CHECK (payment_status IN ('pending', 'approved', 'rejected', 'refunded'));
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS attendances_payment_id_unique
  ON public.attendances (payment_id)
  WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS attendances_payment_status_idx
  ON public.attendances (payment_status, created_at DESC);
