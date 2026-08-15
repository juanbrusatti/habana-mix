-- 018_create_attendances_table.sql
-- Crear tabla para registrar asistencias/inscripciones a eventos

CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  event_title text NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  dni text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  is_free boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendances_event_id_idx ON attendances(event_id);
CREATE INDEX IF NOT EXISTS attendances_is_free_idx ON attendances(is_free);
