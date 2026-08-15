-- ============================================================================
-- POLÍTICAS DE STORAGE PARA SISTEMA DE ADMIN PERSONALIZADO
-- ============================================================================
-- Este script modifica las políticas del bucket 'media' para funcionar
-- con nuestro sistema de autenticación personalizado basado en admin_credentials
-- ============================================================================

-- Eliminar todas las políticas existentes del bucket media
drop policy if exists "media_admin_write" on storage.objects;
drop policy if exists "media_admin_write_custom" on storage.objects;
drop policy if exists "media_public_read" on storage.objects;
drop policy if exists "media_public_upload" on storage.objects;

-- Política para lectura pública
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

-- Política para escritura - Permisiva para desarrollo con sistema personalizado
-- En producción, esto debería ser más restrictivo
create policy "media_admin_write_custom" on storage.objects
  for all to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

-- Política alternativa para permitir upload sin autenticación (desarrollo)
-- Esto permite que nuestro sistema localStorage funcione
create policy "media_public_upload" on storage.objects
  for insert
  with check (bucket_id = 'media');

-- ============================================================================
-- FUNCIÓN PARA VERIFICAR ADMIN POR SESSION TOKEN (alternativa)
-- ============================================================================
-- Esta función puede ser usada en el futuro para validar admin sessions
create or replace function public.is_admin_by_token(p_token text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_credentials 
    where id = p_token::uuid and is_active = true
  );
$$;