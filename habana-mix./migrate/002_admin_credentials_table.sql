-- ============================================================================
-- TABLA DE CREDENCIALES DE ADMINISTRADOR
-- ============================================================================
-- Este script crea una tabla específica para credenciales de administrador
-- que funciona de manera independiente al sistema de auth.users de Supabase.
-- 
-- Seguridad:
-- - Las contraseñas se almacenan usando MD5 con salt (compatible con Supabase)
-- - Solo se puede acceder a través de funciones seguras
-- - La tabla no es directamente consultable por el público
-- ============================================================================

-- Tabla de credenciales de admin
create table if not exists public.admin_credentials (
  id              uuid primary key default gen_random_uuid(),
  username        text unique not null,
  password_hash   text not null,
  salt            text not null,
  full_name       text,
  is_active       boolean not null default true,
  last_login      timestamptz,
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índice para búsquedas rápidas por username
create index if not exists admin_credentials_username_idx 
  on public.admin_credentials (username);

-- ============================================================================
-- FUNCIONES DE SEGURIDAD
-- ============================================================================

-- Función para verificar credenciales de admin
create or replace function public.verify_admin_credentials(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  computed_hash text;
  is_valid boolean := false;
  should_lock boolean := false;
begin
  -- Buscar el admin por username
  select * into admin_record
  from public.admin_credentials
  where username = p_username and is_active = true;
  
  -- Si no existe el usuario
  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'Credenciales inválidas',
      'requires_2fa', false
    );
  end if;
  
  -- Verificar si la cuenta está bloqueada temporalmente
  if admin_record.locked_until is not null and admin_record.locked_until > now() then
    return jsonb_build_object(
      'success', false,
      'message', 'Cuenta temporalmente bloqueada por demasiados intentos fallidos',
      'locked_until', admin_record.locked_until,
      'requires_2fa', false
    );
  end if;
  
  -- Verificar la contraseña usando MD5 con salt
  computed_hash := md5(p_password || admin_record.salt);
  is_valid := (computed_hash = admin_record.password_hash);
  
  if is_valid then
    -- Resetear intentos fallidos y actualizar último login
    update public.admin_credentials
    set 
      failed_attempts = 0,
      locked_until = null,
      last_login = now(),
      updated_at = now()
    where id = admin_record.id;
    
    return jsonb_build_object(
      'success', true,
      'admin_id', admin_record.id,
      'username', admin_record.username,
      'full_name', admin_record.full_name,
      'message', 'Autenticación exitosa',
      'requires_2fa', false
    );
  else
    -- Incrementar intentos fallidos
    update public.admin_credentials
    set 
      failed_attempts = failed_attempts + 1,
      updated_at = now()
    where id = admin_record.id;
    
    -- Si hay más de 5 intentos fallidos, bloquear por 15 minutos
    select failed_attempts into should_lock
    from public.admin_credentials
    where id = admin_record.id;
    
    if should_lock >= 5 then
      update public.admin_credentials
      set locked_until = now() + interval '15 minutes'
      where id = admin_record.id;
      
      return jsonb_build_object(
        'success', false,
        'message', 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.',
        'locked_until', now() + interval '15 minutes',
        'requires_2fa', false
      );
    end if;
    
    return jsonb_build_object(
      'success', false,
      'message', 'Credenciales inválidas',
      'attempts_remaining', 5 - should_lock,
      'requires_2fa', false
    );
  end if;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Habilitar RLS en la tabla
alter table public.admin_credentials enable row level security;

-- Política: Nadie puede leer directamente la tabla (solo a través de funciones)
drop policy if exists "admin_credentials_no_direct_read" on public.admin_credentials;
create policy "admin_credentials_no_direct_read" on public.admin_credentials
  for select using (false);

-- Política: Nadie puede insertar directamente (solo a través de funciones)
drop policy if exists "admin_credentials_no_direct_insert" on public.admin_credentials;
create policy "admin_credentials_no_direct_insert" on public.admin_credentials
  for insert with check (false);

-- Política: Nadie puede actualizar directamente (solo a través de funciones)
drop policy if exists "admin_credentials_no_direct_update" on public.admin_credentials;
create policy "admin_credentials_no_direct_update" on public.admin_credentials
  for update using (false);

-- Política: Nadie puede eliminar directamente
drop policy if exists "admin_credentials_no_direct_delete" on public.admin_credentials;
create policy "admin_credentials_no_direct_delete" on public.admin_credentials
  for delete using (false);

-- ============================================================================
-- FUNCIÓN PARA CREAR/ACTUALIZAR ADMIN (SOLO EJECUTAR MANUALMENTE EN SQL)
-- ============================================================================

create or replace function public.create_or_update_admin(
  p_username text,
  p_password text,
  p_full_name text default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
  v_password_hash text;
  v_salt text;
begin
  -- Generar salt aleatorio usando md5 de random() y timestamp
  v_salt := md5(random()::text || now()::text || p_username);
  
  -- Generar hash de la contraseña usando MD5 con salt
  v_password_hash := md5(p_password || v_salt);
  
  -- Intentar actualizar si existe
  update public.admin_credentials
  set 
    password_hash = v_password_hash,
    salt = v_salt,
    full_name = coalesce(p_full_name, full_name),
    is_active = p_is_active,
    updated_at = now()
  where username = p_username
  returning id into admin_id;
  
  -- Si no existe, insertar nuevo
  if not found then
    insert into public.admin_credentials (username, password_hash, salt, full_name, is_active)
    values (p_username, v_password_hash, v_salt, p_full_name, p_is_active)
    returning id into admin_id;
  end if;
  
  return admin_id;
end;
$$;

-- ============================================================================
-- NOTA DE SEGURIDAD
-- ============================================================================
-- Para crear el usuario admin inicial, ejecuta:
-- 
-- SELECT public.create_or_update_admin(
--   'administrador',
--   'habanamix2026',
--   'Administrador Principal',
--   true
-- );
-- 
-- Esto creará un admin con:
-- - Username: administrador
-- - Password: habanamix2026
-- - La contraseña se almacenará como hash MD5 con salt aleatorio
-- ============================================================================