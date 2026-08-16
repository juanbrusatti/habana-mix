-- 022_cascade_delete_attendances_on_event_delete.sql
-- Asegura que, al borrar un evento, se eliminen también las asistencias asociadas.
-- Esto evita residuos en la base cuando se elimina un evento completo.

ALTER TABLE public.attendances
  DROP CONSTRAINT IF EXISTS attendances_event_id_fkey;

ALTER TABLE public.attendances
  ADD CONSTRAINT attendances_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
