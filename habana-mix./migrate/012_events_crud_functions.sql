-- ============================================================================
-- FUNCIONES CRUD PARA EVENTOS
-- ============================================================================
-- Estas funciones permiten al administrador crear, leer, actualizar y eliminar eventos
-- ============================================================================

-- ============================================================================
-- CREAR EVENTO
-- ============================================================================
create or replace function public.create_event(
  p_admin_id       uuid,
  p_slug           text,
  p_title          text,
  p_starts_at      timestamptz,
  p_subtitle       text default null,
  p_description    text default null,
  p_image_url      text default null,
  p_ends_at        timestamptz default null,
  p_location       text default null,
  p_price_label    text default null,
  p_cta_label      text default 'Reservar lugar',
  p_cta_url        text default null,
  p_theme          card_theme default 'amber',
  p_layout         card_layout default 'overlay',
  p_tags           text[] default '{}',
  p_featured       boolean default false,
  p_overlay_opacity smallint default 60,
  p_accent_color   text default null,
  p_status         content_status default 'published',
  p_sort_order     integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  new_event record;
begin
  -- Verificar que sea admin
  select is_active into is_admin
  from public.admin_credentials
  where id = p_admin_id;
  
  if not is_admin then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

  -- Crear evento
  insert into public.events (
    slug, title, subtitle, description, image_url,
    starts_at, ends_at, location, price_label, cta_label, cta_url,
    theme, layout, tags, featured, overlay_opacity, accent_color,
    status, sort_order, updated_by
  )
  values (
    p_slug, p_title, p_subtitle, p_description, p_image_url,
    p_starts_at, p_ends_at, p_location, p_price_label, p_cta_label, p_cta_url,
    p_theme, p_layout, p_tags, p_featured, p_overlay_opacity, p_accent_color,
    p_status, p_sort_order, p_admin_id
  )
  returning * into new_event;

  return jsonb_build_object(
    'success', true,
    'message', 'Evento creado',
    'event', row_to_json(new_event.*)::jsonb
  );
end;
$$;

-- ============================================================================
-- ACTUALIZAR EVENTO
-- ============================================================================
create or replace function public.update_event(
  p_admin_id       uuid,
  p_event_id       uuid,
  p_slug           text default null,
  p_title          text default null,
  p_starts_at      timestamptz default null,
  p_subtitle       text default null,
  p_description    text default null,
  p_image_url      text default null,
  p_ends_at        timestamptz default null,
  p_location       text default null,
  p_price_label    text default null,
  p_cta_label      text default null,
  p_cta_url        text default null,
  p_theme          card_theme default null,
  p_layout         card_layout default null,
  p_tags           text[] default null,
  p_featured       boolean default null,
  p_overlay_opacity smallint default null,
  p_accent_color   text default null,
  p_status         content_status default null,
  p_sort_order     integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  updated_event record;
begin
  -- Verificar que sea admin
  select is_active into is_admin
  from public.admin_credentials
  where id = p_admin_id;
  
  if not is_admin then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

  -- Actualizar evento
  update public.events
  set 
    slug = coalesce(p_slug, slug),
    title = coalesce(p_title, title),
    subtitle = coalesce(p_subtitle, subtitle),
    description = coalesce(p_description, description),
    image_url = coalesce(p_image_url, image_url),
    starts_at = coalesce(p_starts_at, starts_at),
    ends_at = coalesce(p_ends_at, ends_at),
    location = coalesce(p_location, location),
    price_label = coalesce(p_price_label, price_label),
    cta_label = coalesce(p_cta_label, cta_label),
    cta_url = coalesce(p_cta_url, cta_url),
    theme = coalesce(p_theme, theme),
    layout = coalesce(p_layout, layout),
    tags = coalesce(p_tags, tags),
    featured = coalesce(p_featured, featured),
    overlay_opacity = coalesce(p_overlay_opacity, overlay_opacity),
    accent_color = coalesce(p_accent_color, accent_color),
    status = coalesce(p_status, status),
    sort_order = coalesce(p_sort_order, sort_order),
    updated_at = now(),
    updated_by = p_admin_id
  where id = p_event_id
  returning * into updated_event;

  return jsonb_build_object(
    'success', true,
    'message', 'Evento actualizado',
    'event', row_to_json(updated_event.*)::jsonb
  );
end;
$$;

-- ============================================================================
-- ELIMINAR EVENTO
-- ============================================================================
create or replace function public.delete_event(
  p_admin_id uuid,
  p_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  -- Verificar que sea admin
  select is_active into is_admin
  from public.admin_credentials
  where id = p_admin_id;
  
  if not is_admin then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

  -- Eliminar evento
  delete from public.events
  where id = p_event_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Evento eliminado'
  );
end;
$$;

-- ============================================================================
-- OBTENER EVENTOS PUBLICADOS
-- ============================================================================
create or replace function public.get_published_events()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_agg(row_to_json(e.*)::jsonb) as events
  from (
    select *
    from public.events e
    where e.status = 'published'
    order by e.sort_order, e.starts_at
  ) e;
$$;