-- ============================================================================
-- DESHABILITAR RLS PARA TABLA EVENTS (TEMPORAL PARA DESARROLLO)
-- ============================================================================

-- Deshabilitar RLS completamente para la tabla events
alter table public.events disable row level security;