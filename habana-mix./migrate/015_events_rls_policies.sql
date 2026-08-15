-- ============================================================================
-- POLÍTICAS RLS PARA TABLA EVENTS
-- ============================================================================
-- Políticas completamente abiertas para desarrollo
-- ============================================================================

-- Habilitar RLS si no está habilitado
alter table public.events enable row level security;

-- Eliminar todas las políticas existentes
drop policy if exists "events_insert_policy" on public.events;
drop policy if exists "events_select_policy" on public.events;
drop policy if exists "events_update_policy" on public.events;
drop policy if exists "events_delete_policy" on public.events;

-- Política para permitir INSERT (creación de eventos) - pública para desarrollo
create policy "events_insert_policy" on public.events
  for insert
  to public
  with check (true);

-- Política para permitir SELECT (lectura de eventos) - pública para desarrollo
create policy "events_select_policy" on public.events
  for select
  to public
  using (true);

-- Política para permitir UPDATE (actualización de eventos) - pública para desarrollo
create policy "events_update_policy" on public.events
  for update
  to public
  using (true)
  with check (true);

-- Política para permitir DELETE (eliminación de eventos) - pública para desarrollo
create policy "events_delete_policy" on public.events
  for delete
  to public
  using (true);