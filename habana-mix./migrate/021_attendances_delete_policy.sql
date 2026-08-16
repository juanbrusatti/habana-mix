-- 021_attendances_delete_policy.sql
-- Permite eliminar asistencias desde el cliente anon usado por el panel admin.
-- En producción conviene reforzar esto con autenticación real, pero esto corrige el fallo actual.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.policyname = 'Allow anon delete' AND p.schemaname = 'public' AND p.tablename = 'attendances'
  ) THEN
    CREATE POLICY "Allow anon delete" ON public.attendances
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.policyname = 'Allow authenticated delete' AND p.schemaname = 'public' AND p.tablename = 'attendances'
  ) THEN
    CREATE POLICY "Allow authenticated delete" ON public.attendances
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END$$;
