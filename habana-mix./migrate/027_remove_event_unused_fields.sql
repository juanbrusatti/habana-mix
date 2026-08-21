-- ============================================================================
-- 027 — Quitar campos no usados de events
-- ============================================================================
-- Se eliminan: cta_url, featured, status, sort_order
--
-- Motivo:
-- - Orden: por created_at (orden de creación)
-- - Destacado: todos los eventos se muestran igual
-- - Estado: existe = publicado; borrar = dejar de mostrar
-- - URL del botón: gratuito → reservar; de pago → MercadoPago
-- ============================================================================

-- 1) Quitar funciones RPC que referencian las columnas (cualquier overload)
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_event', 'update_event', 'get_published_events')
  loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

-- 2) Políticas / índices que dependen de status u otras columnas a borrar
drop policy if exists "events_public_read" on public.events;
drop policy if exists "events_admin_write" on public.events;
drop index if exists public.events_status_starts_idx;

-- 3) Columnas
alter table public.events
  drop column if exists cta_url,
  drop column if exists featured,
  drop column if exists status,
  drop column if exists sort_order;

-- 3b) Recrear lectura pública simple (existe = publicado)
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (true);

-- 4) Índice por orden de creación
create index if not exists events_created_at_idx
  on public.events (created_at);

-- 5) Funciones CRUD simplificadas (opcionales; el admin usa insert/update directo)
create or replace function public.create_event(
  p_admin_id        uuid,
  p_slug            text,
  p_title           text,
  p_starts_at       timestamptz,
  p_subtitle        text default null,
  p_description     text default null,
  p_image_url       text default null,
  p_ends_at         timestamptz default null,
  p_location        text default null,
  p_price_label     text default null,
  p_cta_label       text default 'Reservar lugar',
  p_theme           card_theme default 'amber',
  p_layout          card_layout default 'overlay',
  p_tags            text[] default '{}',
  p_overlay_opacity smallint default 60,
  p_accent_color    text default null
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
  select is_active into is_admin
  from public.admin_credentials
  where id = p_admin_id;

  if not is_admin then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

  insert into public.events (
    slug, title, subtitle, description, image_url,
    starts_at, ends_at, location, price_label, cta_label,
    theme, layout, tags, overlay_opacity, accent_color, updated_by
  )
  values (
    p_slug, p_title, p_subtitle, p_description, p_image_url,
    p_starts_at, p_ends_at, p_location, p_price_label, p_cta_label,
    p_theme, p_layout, p_tags, p_overlay_opacity, p_accent_color, p_admin_id
  )
  returning * into new_event;

  return jsonb_build_object(
    'success', true,
    'message', 'Evento creado',
    'event', row_to_json(new_event.*)::jsonb
  );
end;
$$;

create or replace function public.update_event(
  p_admin_id        uuid,
  p_event_id        uuid,
  p_slug            text default null,
  p_title           text default null,
  p_starts_at       timestamptz default null,
  p_subtitle        text default null,
  p_description     text default null,
  p_image_url       text default null,
  p_ends_at         timestamptz default null,
  p_location        text default null,
  p_price_label     text default null,
  p_cta_label       text default null,
  p_theme           card_theme default null,
  p_layout          card_layout default null,
  p_tags            text[] default null,
  p_overlay_opacity smallint default null,
  p_accent_color    text default null
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
  select is_active into is_admin
  from public.admin_credentials
  where id = p_admin_id;

  if not is_admin then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

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
    theme = coalesce(p_theme, theme),
    layout = coalesce(p_layout, layout),
    tags = coalesce(p_tags, tags),
    overlay_opacity = coalesce(p_overlay_opacity, overlay_opacity),
    accent_color = coalesce(p_accent_color, accent_color),
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

create or replace function public.get_published_events()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(row_to_json(e.*)::jsonb), '[]'::jsonb) as events
  from (
    select *
    from public.events e
    order by e.created_at
  ) e;
$$;

-- 6) Si content_status ya no se usa en ninguna tabla, se puede borrar
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and udt_name = 'content_status'
  ) then
    drop type if exists public.content_status;
  end if;
end $$;
