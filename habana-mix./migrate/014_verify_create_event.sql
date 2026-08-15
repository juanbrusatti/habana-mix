-- ============================================================================
-- VERIFICACIÓN Y CREACIÓN DE FUNCIÓN CREATE_EVENT
-- ============================================================================

-- Crear o reemplazar la función
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