-- ============================================================================
-- TABLA DE CONFIGURACIÓN DEL FOOTER
-- ============================================================================
-- Esta tabla permite editar dinámicamente todos los elementos del footer
-- ============================================================================

create table if not exists public.footer_config (
  id              uuid primary key default gen_random_uuid(),
  description     text default 'Salsa cubana, timba y bachata con el sabor de La Habana. Más que una academia: una comunidad.',
  email           text default 'hola@habanamix.com',
  copyright_text  text default 'Hecho con sabor cubano',
  nav_groups      jsonb default '[
    {
      "title": "La academia",
      "links": [
        {"label": "Próximos eventos", "href": "#eventos"},
        {"label": "Nuestras clases", "href": "#clases"},
        {"label": "Quiénes somos", "href": "#nosotros"},
        {"label": "Cómo llegar", "href": "#como-llegar"}
      ]
    },
    {
      "title": "Estilos",
      "links": [
        {"label": "Salsa cubana", "href": "#clases"},
        {"label": "Bachata", "href": "#clases"},
        {"label": "Timba", "href": "#clases"},
        {"label": "Rueda de casino", "href": "#clases"}
      ]
    }
  ]'::jsonb,
  socials         jsonb default '[
    {"label": "Instagram", "href": "https://instagram.com"},
    {"label": "Facebook", "href": "https://facebook.com"},
    {"label": "YouTube", "href": "https://youtube.com"}
  ]'::jsonb,
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);

-- Insertar configuración inicial
insert into public.footer_config (description, email, copyright_text, nav_groups, socials)
values (
  'Salsa cubana, timba y bachata con el sabor de La Habana. Más que una academia: una comunidad.',
  'hola@habanamix.com',
  'Hecho con sabor cubano',
  '[
    {
      "title": "La academia",
      "links": [
        {"label": "Próximos eventos", "href": "#eventos"},
        {"label": "Nuestras clases", "href": "#clases"},
        {"label": "Quiénes somos", "href": "#nosotros"},
        {"label": "Cómo llegar", "href": "#como-llegar"}
      ]
    },
    {
      "title": "Estilos",
      "links": [
        {"label": "Salsa cubana", "href": "#clases"},
        {"label": "Bachata", "href": "#clases"},
        {"label": "Timba", "href": "#clases"},
        {"label": "Rueda de casino", "href": "#clases"}
      ]
    }
  ]'::jsonb,
  '[
    {"label": "Instagram", "href": "https://instagram.com"},
    {"label": "Facebook", "href": "https://facebook.com"},
    {"label": "YouTube", "href": "https://youtube.com"}
  ]'::jsonb
)
on conflict do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.footer_config enable row level security;

-- Solo admins pueden leer
drop policy if exists "footer_config_admin_read" on public.footer_config;
create policy "footer_config_admin_read" on public.footer_config
  for select using (public.is_admin());

-- Solo admins pueden actualizar
drop policy if exists "footer_config_admin_update" on public.footer_config;
create policy "footer_config_admin_update" on public.footer_config
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- FUNCIÓN PARA OBTENER CONFIGURACIÓN DEL FOOTER (pública)
-- ============================================================================

create or replace function public.get_footer_config()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select row_to_json(fc.*)::jsonb
  from public.footer_config fc
  limit 1;
$$;

-- ============================================================================
-- FUNCIÓN PARA ACTUALIZAR CONFIGURACIÓN DEL FOOTER (solo admin)
-- ============================================================================

create or replace function public.update_footer_config(
  p_admin_id       uuid,
  p_description    text default null,
  p_email          text default null,
  p_copyright_text text default null,
  p_nav_groups     jsonb default null,
  p_socials        jsonb default null
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
  update public.footer_config
  set 
    description = coalesce(p_description, description),
    email = coalesce(p_email, email),
    copyright_text = coalesce(p_copyright_text, copyright_text),
    nav_groups = coalesce(p_nav_groups, nav_groups),
    socials = coalesce(p_socials, socials),
    updated_at = now(),
    updated_by = p_admin_id
  where id = (select id from public.footer_config limit 1)
  returning * into updated_config;

  return jsonb_build_object(
    'success', true,
    'message', 'Configuración actualizada',
    'config', row_to_json(updated_config.*)::jsonb
  );
end;
$$;