-- ============================================================================
-- AGREGAR COLUMNA SALT A TABLA EXISTENTE
-- ============================================================================
-- Este script agrega la columna salt a la tabla admin_credentials existente
-- ============================================================================

-- Agregar columna salt si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'admin_credentials' 
    AND column_name = 'salt'
  ) THEN
    ALTER TABLE public.admin_credentials ADD COLUMN salt text;
  END IF;
END $$;

-- Actualizar registros existentes con salt aleatorio
UPDATE public.admin_credentials 
SET salt = md5(random()::text || now()::text || username)
WHERE salt IS NULL;

-- Regenerar hashes con el nuevo salt
UPDATE public.admin_credentials 
SET password_hash = md5('habanamix2026' || salt)
WHERE username = 'administrador';

-- Verificar la actualización
SELECT id, username, full_name, is_active, created_at
FROM public.admin_credentials
WHERE username = 'administrador';