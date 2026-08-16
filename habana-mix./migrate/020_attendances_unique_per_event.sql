-- 020_attendances_unique_per_event.sql
-- 1) Limpiar duplicados existentes
--    Esto evita fallar al crear los índices únicos por evento.

WITH ranked_dni AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id, upper(trim(dni))
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.attendances
  WHERE dni IS NOT NULL AND trim(dni) <> ''
)
DELETE FROM public.attendances a
USING ranked_dni r
WHERE a.id = r.id AND r.rn > 1;

WITH ranked_phone AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id, regexp_replace(phone, '\D', '', 'g')
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.attendances
  WHERE phone IS NOT NULL AND trim(phone) <> ''
)
DELETE FROM public.attendances a
USING ranked_phone r
WHERE a.id = r.id AND r.rn > 1;

WITH ranked_email AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id, lower(trim(email))
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.attendances
  WHERE email IS NOT NULL AND trim(email) <> ''
)
DELETE FROM public.attendances a
USING ranked_email r
WHERE a.id = r.id AND r.rn > 1;

-- 2) Crear índices únicos por evento para DNI, teléfono y email.
CREATE UNIQUE INDEX IF NOT EXISTS attendances_event_dni_unique
  ON public.attendances (event_id, upper(trim(dni)));

CREATE UNIQUE INDEX IF NOT EXISTS attendances_event_phone_unique
  ON public.attendances (event_id, regexp_replace(phone, '\D', '', 'g'));

CREATE UNIQUE INDEX IF NOT EXISTS attendances_event_email_unique
  ON public.attendances (event_id, lower(trim(email)));
