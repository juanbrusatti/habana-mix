-- 028_add_split_payment_to_events.sql
-- Agrega campos para configurar pagos divididos (split payments) en eventos
-- Permite que una parte del pago vaya a una cuenta de MercadoPago y otra a otra cuenta

-- Habilitar split payment para el evento
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS split_enabled boolean NOT NULL DEFAULT false;

-- Monto que va a la segunda cuenta de MercadoPago
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS split_amount numeric(12, 2);

-- Porcentaje alternativo (si se prefiere porcentaje sobre el total)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS split_percentage numeric(5, 2);

-- Descripción para el registro interno (para admin)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS split_description text;

-- Constraints para asegurar valores válidos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_split_amount_positive') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_split_amount_positive
      CHECK (split_amount IS NULL OR split_amount > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_split_percentage_valid') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_split_percentage_valid
      CHECK (split_percentage IS NULL OR (split_percentage > 0 AND split_percentage <= 100));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_split_either_amount_or_percentage') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_split_either_amount_or_percentage
      CHECK (
        NOT split_enabled OR 
        (split_amount IS NOT NULL AND split_percentage IS NULL) OR
        (split_amount IS NULL AND split_percentage IS NOT NULL)
      );
  END IF;
END$$;

-- Comentario para documentación
COMMENT ON COLUMN public.events.split_enabled IS 'Habilita la división del pago entre dos cuentas de MercadoPago';
COMMENT ON COLUMN public.events.split_amount IS 'Monto fijo que se envía a la segunda cuenta de MercadoPago';
COMMENT ON COLUMN public.events.split_percentage IS 'Porcentaje del total que se envía a la segunda cuenta de MercadoPago (0-100)';
COMMENT ON COLUMN public.events.split_description IS 'Descripción interna para el admin sobre la configuración del split';
