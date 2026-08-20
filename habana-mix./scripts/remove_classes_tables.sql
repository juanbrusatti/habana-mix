-- ============================================================================
-- ELIMINACIÓN DE TABLAS RELACIONADAS CON CLASES
-- ============================================================================
-- Este script elimina de forma segura todas las tablas, enums, triggers y 
-- políticas relacionadas con el sistema de clases, ya que temporalmente no se 
-- utilizará. Solo se mantendrá el sistema de eventos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Eliminar triggers de enrollments
-- ----------------------------------------------------------------------------
drop trigger if exists enrollments_status_trigger on public.enrollments;

-- ----------------------------------------------------------------------------
-- 2. Eliminar funciones relacionadas con enrollments
-- ----------------------------------------------------------------------------
drop function if exists public.generate_access_code();
drop function if exists public.on_enrollment_status_change();

-- ----------------------------------------------------------------------------
-- 3. Eliminar políticas RLS de enrollments
-- ----------------------------------------------------------------------------
drop policy if exists "enrollments_select_own" on public.enrollments;
drop policy if exists "enrollments_insert_own" on public.enrollments;
drop policy if exists "enrollments_update_admin" on public.enrollments;
drop policy if exists "enrollments_delete_admin" on public.enrollments;

-- ----------------------------------------------------------------------------
-- 4. Eliminar políticas RLS de classes
-- ----------------------------------------------------------------------------
drop policy if exists "classes_public_read" on public.classes;
drop policy if exists "classes_admin_write" on public.classes;

-- ----------------------------------------------------------------------------
-- 5. Eliminar trigger de updated_at en classes
-- ----------------------------------------------------------------------------
drop trigger if exists touch_classes on public.classes;

-- ----------------------------------------------------------------------------
-- 6. Eliminar índices de classes
-- ----------------------------------------------------------------------------
drop index if exists public.classes_status_sort_idx;

-- ----------------------------------------------------------------------------
-- 7. Eliminar índices de enrollments
-- ----------------------------------------------------------------------------
drop index if exists public.enrollments_status_idx;
drop index if exists public.enrollments_user_idx;

-- ----------------------------------------------------------------------------
-- 8. Eliminar tablas (en orden de dependencias)
-- ----------------------------------------------------------------------------
-- Primero enrollments porque tiene foreign key a classes
drop table if exists public.enrollments cascade;

-- Luego classes
drop table if exists public.classes cascade;

-- ----------------------------------------------------------------------------
-- 9. Eliminar enums relacionados
-- ----------------------------------------------------------------------------
drop type if exists public.class_level;
drop type if exists public.enrollment_status;

-- ----------------------------------------------------------------------------
-- VERIFICACIÓN
-- ----------------------------------------------------------------------------
-- Las siguientes tablas deben permanecer intactas:
-- - profiles (usuarios y admin)
-- - events (sistema de eventos)
-- - site_content (configuración del sitio)
-- - attendances (asistencia a eventos)
-- - tickets (sistema de tickets)

-- ============================================================================
-- COMPLETADO
-- ============================================================================
-- El sistema de clases ha sido completamente eliminado.
-- El sistema de eventos, asistencia y tickets permanece intacto.
-- ============================================================================