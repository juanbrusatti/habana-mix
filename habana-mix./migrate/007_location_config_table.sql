-- ============================================================================
-- TABLA DE CONFIGURACIÓN DE UBICACIÓN
-- ============================================================================
-- Esta tabla permite editar dinámicamente los elementos de la sección de ubicación
-- ============================================================================

create table if not exists public.location_config (
  id              uuid primary key default gen_random_uuid(),
  title           text default 'Cómo llegar',
  address         text default 'Av. del Malecón 1245, Local 3',
  city            text default 'Palermo, Buenos Aires',
  directions_note text default 'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  map_embed_url   text default 'https://www.openstreetmap.org/export/embed.html?bbox=-58.4300%2C-34.5860%2C-58.4130%2C-34.5740&layer=mapnik&marker=-34.5800%2C-58.4215',
  map_link_url   text default 'https://www.openstreetmap.org/?mlat=-34.5800&mlon=-58.4215#map=16/-34.5800/-58.4215',
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
insert into public.location_config (title, address, city, directions_note, map_embed_url, map_link_url, phone, whatsapp, hours)
values (
  'Cómo llegar',
  'Av. del Malecón 1245, Local 3',
  'Palermo, Buenos Aires',
  'A dos cuadras de la estación Plaza Italia. Entrada por el pasaje interno, portón amarillo con el mural de la trompeta.',
  'https://www.openstreetmap.org/export/embed.html?bbox=-58.4300%2C-34.5860%2C-58.4130%2C-34.5740&layer=mapnik&marker=-34.5800%2C-58.4215',
  'https://www.openstreetmap.org/?mlat=-34.5800&mlon=-58.4215#map=16/-34.5800/-58.4215',
  '+54 11 5555 1234',
  '5491155551234',
  '[
    {"label": "Lunes a viernes", "value": "17:00 – 23:00"},
    {"label": "Sábados", "value": "11:00 – 20:00"},
    {"label": "Domingos", "value": "Solo eventos"}
  ]'::jsonb
)
on conflict do nothing;

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
  p_address         text default null,
  p_city            text default null,
  p_directions_note text default null,
  p_map_embed_url   text default null,
  p_map_link_url   text default null,
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
    address = coalesce(p_address, address),
    city = coalesce(p_city, city),
    directions_note = coalesce(p_directions_note, directions_note),
    map_embed_url = coalesce(p_map_embed_url, map_embed_url),
    map_link_url = coalesce(p_map_link_url, map_link_url),
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