-- 026_tickets_and_access_control.sql
-- Ticket único por asistencia paga y clave privada para el control de acceso.

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS ticket_code text,
  ADD COLUMN IF NOT EXISTS ticket_token_hash text,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by text,
  ADD COLUMN IF NOT EXISTS ticket_email_sent_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS attendances_ticket_code_unique
  ON public.attendances (ticket_code)
  WHERE ticket_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS attendances_ticket_token_hash_unique
  ON public.attendances (ticket_token_hash)
  WHERE ticket_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS attendances_checked_in_idx
  ON public.attendances (checked_in_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendances_ticket_code_format'
      AND conrelid = 'public.attendances'::regclass
  ) THEN
    ALTER TABLE public.attendances
      ADD CONSTRAINT attendances_ticket_code_format
      CHECK (ticket_code IS NULL OR ticket_code ~ '^[A-Z0-9]{5}$');
  END IF;
END$$;
