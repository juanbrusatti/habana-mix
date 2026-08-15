-- ============================================================================
-- AGREGAR CAMPO UPDATED_BY A TABLA EVENTS
-- ============================================================================
-- Este campo es necesario para las funciones CRUD de eventos
-- ============================================================================

alter table public.events
  add column if not exists updated_by uuid;

-- Agregar columna updated_by a la tabla classes también para consistencia
alter table public.classes
  add column if not exists updated_by uuid;