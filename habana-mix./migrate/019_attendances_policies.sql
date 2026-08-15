-- 019_attendances_policies.sql
-- Habilita Row Level Security y crea políticas básicas para la tabla `attendances`.
-- Atención: estas políticas permiten acceso público para pruebas (SELECT para anon,
-- INSERT para anon pero sólo si `is_free = true`). Reforzar según necesidades.

-- 1) Habilitar RLS (si ya está habilitado esta instrucción no tiene efecto)
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- 2) Permitir acceso completo al rol `authenticated` (usuarios autenticados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.policyname = 'Allow authenticated all' AND p.schemaname = 'public' AND p.tablename = 'attendances'
  ) THEN
    CREATE POLICY "Allow authenticated all" ON public.attendances
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- 3) Permitir inserts desde el rol `anon` solamente para registros marcados como gratuitos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.policyname = 'Allow anon insert free events' AND p.schemaname = 'public' AND p.tablename = 'attendances'
  ) THEN
    CREATE POLICY "Allow anon insert free events" ON public.attendances
      FOR INSERT
      TO anon
      WITH CHECK (is_free IS TRUE);
  END IF;
END$$;

-- 4) (Opcional para panel admin que usa la anon key) Permitir SELECT para anon
-- Quitar esta política en producción si la administración debe protegerse.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.policyname = 'Allow anon select' AND p.schemaname = 'public' AND p.tablename = 'attendances'
  ) THEN
    CREATE POLICY "Allow anon select" ON public.attendances
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END$$;

-- Nota: Para mayor seguridad en producción, en lugar de conceder SELECT a `anon`,
-- hacer que el panel admin use el service role (server-side) o requerir login
-- y dejar sólo `authenticated` ver/consultar los registros.
