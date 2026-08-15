-- ============================================================================
-- MIGRACIÓN: ACTUALIZAR ESTRUCTURA DE TABLA LOCATION_CONFIG
-- ============================================================================
-- Este script actualiza la tabla location_config para usar campos de dirección
-- básicos en lugar de URLs complejas, facilitando el uso de Google Maps
-- ============================================================================

-- Eliminar la tabla existente y recrearla con la nueva estructura
drop table if exists public.location_config cascade;

-- Recrear la tabla con la nueva estructura
create table public.location_config (
  id              uuid primary key default gen_random_uuid(),
  title           text default 'Cómo llegar',
  street          text default 'Av. del Malecón',
  street_number   text default '1245',
  apartment       text default 'Local 3',
  city            text default 'Palermo',
  state           text default 'Buenos Aires',
  country         text default 'Argentina',
  postal_code     text default 'C1414',
  directions_note text default 'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  phone           text default '+54 11 5555 1234',
  whatsapp        text default '5491155551234',
  hours           jsonb default '[
    {"label": "Lunes a viernes", "value": "17:00 – 23:00"},
    {"label": "Sábados", "value": "11:00 – 20:00"},
    {"label": "Domingos", "value": "Solo eventos"}
  ]'::jsonb,
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);

-- Insertar configuración inicial
insert into public.location_config (title, street, street_number, apartment, city, state, country, postal_code, directions_note, phone, whatsapp, hours)
values (
  'Cómo llegar',
  'Av. del Malecón',
  '1245',
  'Local 3',
  'Palermo',
  'Buenos Aires',
  'Argentina',
  'C1414',
  'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  '+54 11 5555 1234',
  '5491155551234',
  '[
    {"label": "Lunes a viernes", "value": "17:00 – 23:00"},
    {"label": "Sábados", "value": "11:00 – 20:00"},
    {"label": "Domingos", "value": "Solo eventos"}
  ]'::jsonb
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.location_config enable row level security;

-- Solo admins pueden leer
drop policy if exists "location_config_admin_read" on public.location_config;
create policy "location_config_admin_read" on public.location_config
  for select using (public.is_admin());

-- Solo admins pueden actualizar
drop policy if exists "location_config_admin_update" on public.location_config;
create policy "location_config_admin_update" on public.location_config
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- FUNCIÓN PARA OBTENER CONFIGURACIÓN DE UBICACIÓN (pública)
-- ============================================================================

create or replace function public.get_location_config()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select row_to_json(lc.*)::jsonb
  from public.location_config lc
  limit 1;
$$;

-- ============================================================================
-- FUNCIÓN PARA ACTUALIZAR CONFIGURACIÓN DE UBICACIÓN (solo admin)
-- ============================================================================

create or replace function public.update_location_config(
  p_admin_id        uuid,
  p_title           text default null,
  p_street          text default null,
  p_street_number   text default null,
  p_apartment       text default null,
  p_city            text default null,
  p_state           text default null,
  p_country         text default null,
  p_postal_code     text default null,
  p_directions_note text default null,
  p_phone           text default null,
  p_whatsapp        text default null,
  p_hours           jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_config record;
  is_admin boolean;
begin
  -- Verificar que sea admin usando nuestro sistema personalizado
  select is_active into is_admin
  from public.admin_credentials
  where id = p_admin_id;
  
  if not is_admin then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

  -- Actualizar solo los campos proporcionados
  update public.location_config
  set 
    title = coalesce(p_title, title),
    street = coalesce(p_street, street),
    street_number = coalesce(p_street_number, street_number),
    apartment = coalesce(p_apartment, apartment),
    city = coalesce(p_city, city),
    state = coalesce(p_state, state),
    country = coalesce(p_country, country),
    postal_code = coalesce(p_postal_code, postal_code),
    directions_note = coalesce(p_directions_note, directions_note),
    phone = coalesce(p_phone, phone),
    whatsapp = coalesce(p_whatsapp, whatsapp),
    hours = coalesce(p_hours, hours),
    updated_at = now(),
    updated_by = p_admin_id
  where id = (select id from public.location_config limit 1)
  returning * into updated_config;

  return jsonb_build_object(
    'success', true,
    'message', 'Configuración actualizada',
    'config', row_to_json(updated_config.*)::jsonb
  );
end;
$$;