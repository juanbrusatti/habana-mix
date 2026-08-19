-- 026_tickets_and_access_control.sql
-- Ticket único por asistencia paga y clave privada para el control de acceso.

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS ticket_code text,
  ADD COLUMN IF NOT EXISTS ticket_token text,
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

DO $$
DECLARE
  attendance_record record;
  generated_code text;
  generated_token text;
BEGIN
  FOR attendance_record IN
    SELECT id FROM public.attendances
    WHERE is_free IS FALSE
      AND payment_status = 'approved'
      AND ticket_code IS NULL
  LOOP
    LOOP
      generated_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.attendances WHERE ticket_code = generated_code
      );
    END LOOP;

    generated_token := encode(gen_random_bytes(32), 'hex');

    UPDATE public.attendances
    SET ticket_code = generated_code,
        ticket_token = generated_token,
        ticket_token_hash = encode(digest(generated_token, 'sha256'), 'hex')
    WHERE id = attendance_record.id;
  END LOOP;
END$$;
