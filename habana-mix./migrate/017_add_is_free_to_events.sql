-- ============================================================================
-- AGREGAR CAMPO IS_FREE A TABLA EVENTS
-- ============================================================================

-- Agregar columna is_free para diferenciar eventos gratuitos y de pago
alter table public.events
  add column if not exists is_free boolean not null default true;