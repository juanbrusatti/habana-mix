-- ============================================================================
-- TABLA DE CONFIGURACIÓN DE QUIÉNES SOMOS
-- ============================================================================
-- Esta tabla permite editar dinámicamente los elementos de la sección "Quiénes somos"
-- ============================================================================

create table if not exists public.about_config (
  id              uuid primary key default gen_random_uuid(),
  eyebrow         text default 'Quiénes somos',
  title           text default 'Un pedacito de Cuba en tu ciudad',
  image_url       text default '/images/about-academia.png',
  paragraphs      jsonb default '[
    "Habana Mix nació de una idea simple: que cualquiera pueda sentir el sabor cubano sin importar de dónde venga ni cuánto haya bailado antes.",
    "Nuestros instructores se formaron en La Habana y llevan más de diez años enseñando salsa cubana, timba, bachata y rueda de casino. Acá no se copian pasos: se aprende a escuchar la música.",
    "Más que una academia, somos una comunidad. Se entra por una clase y se queda por la gente."
  ]'::jsonb,
  stats           jsonb default '[
    {"value": "10+", "label": "Años enseñando"},
    {"value": "1.200", "label": "Alumnos felices"},
    {"value": "4", "label": "Estilos cubanos"},
    {"value": "2", "label": "Fiestas al mes"}
  ]'::jsonb,
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);

-- Insertar configuración inicial
insert into public.about_config (eyebrow, title, image_url, paragraphs, stats)
values (
  'Quiénes somos',
  'Un pedacito de Cuba en tu ciudad',
  '/images/about-academia.png',
  '[
    "Habana Mix nació de una idea simple: que cualquiera pueda sentir el sabor cubano sin importar de dónde venga ni cuánto haya bailado antes.",
    "Nuestros instructores se formaron en La Habana y llevan más de diez años enseñando salsa cubana, timba, bachata y rueda de casino. Acá no se copian pasos: se aprende a escuchar la música.",
    "Más que una academia, somos una comunidad. Se entra por una clase y se queda por la gente."
  ]'::jsonb,
  '[
    {"value": "10+", "label": "Años enseñando"},
    {"value": "1.200", "label": "Alumnos felices"},
    {"value": "4", "label": "Estilos cubanos"},
    {"value": "2", "label": "Fiestas al mes"}
  ]'::jsonb
)
on conflict do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.about_config enable row level security;

-- Solo admins pueden leer
drop policy if exists "about_config_admin_read" on public.about_config;
create policy "about_config_admin_read" on public.about_config
  for select using (public.is_admin());

-- Solo admins pueden actualizar
drop policy if exists "about_config_admin_update" on public.about_config;
create policy "about_config_admin_update" on public.about_config
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- FUNCIÓN PARA OBTENER CONFIGURACIÓN DE QUIÉNES SOMOS (pública)
-- ============================================================================

create or replace function public.get_about_config()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select row_to_json(ac.*)::jsonb
  from public.about_config ac
  limit 1;
$$;

-- ============================================================================
-- FUNCIÓN PARA ACTUALIZAR CONFIGURACIÓN DE QUIÉNES SOMOS (solo admin)
-- ============================================================================

create or replace function public.update_about_config(
  p_admin_id    uuid,
  p_eyebrow     text default null,
  p_title       text default null,
  p_image_url   text default null,
  p_paragraphs  jsonb default null,
  p_stats       jsonb default null
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
  update public.about_config
  set 
    eyebrow = coalesce(p_eyebrow, eyebrow),
    title = coalesce(p_title, title),
    image_url = coalesce(p_image_url, image_url),
    paragraphs = coalesce(p_paragraphs, paragraphs),
    stats = coalesce(p_stats, stats),
    updated_at = now(),
    updated_by = p_admin_id
  where id = (select id from public.about_config limit 1)
  returning * into updated_config;

  return jsonb_build_object(
    'success', true,
    'message', 'Configuración actualizada',
    'config', row_to_json(updated_config.*)::jsonb
  );
end;
$$;