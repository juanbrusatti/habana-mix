-- ============================================================================
-- CREACIÓN DE USUARIO ADMINISTRADOR INICIAL
-- ============================================================================
-- Este script crea el usuario administrador inicial con las credenciales:
-- - Username: administrador
-- - Password: habanamix2026
-- 
-- IMPORTANTE: Ejecuta este script DESPUÉS de haber ejecutado:
-- 1. scripts/001_habana_mix_schema.sql
-- 2. migrate/002_admin_credentials_table.sql
-- ============================================================================

-- Crear el usuario administrador inicial
SELECT public.create_or_update_admin(
  'administrador',
  'habanamix2026',
  'Administrador Principal',
  true
);

-- Verificar que el admin fue creado correctamente
SELECT 
  id,
  username,
  full_name,
  is_active,
  created_at
FROM public.admin_credentials
WHERE username = 'administrador';

-- ============================================================================
-- NOTAS DE SEGURIDAD
-- ============================================================================
-- - La contraseña se almacena como hash bcrypt, no en texto plano
-- - Puedes cambiar la contraseña ejecutando nuevamente esta función
-- - Para desactivar el admin temporalmente, cambia el último parámetro a false
-- - Considera cambiar esta contraseña después del primer acceso
-- ============================================================================