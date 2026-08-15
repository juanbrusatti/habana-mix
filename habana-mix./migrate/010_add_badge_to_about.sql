-- ============================================================================
-- MIGRACIÓN: AGREGAR SELLO A TABLA ABOUT_CONFIG
-- ============================================================================
-- Agrega campos para controlar el sello decorativo "100% cubano"
-- ============================================================================

-- Agregar campos a la tabla existente
alter table public.about_config
  add column if not exists show_badge boolean default true,
  add column if not exists badge_main_text text default '100% cubano',
  add column if not exists badge_sub_text text default 'Instructores de La Habana';

-- Actualizar los valores existentes si la fila ya existe
update public.about_config
set 
  show_badge = true,
  badge_main_text = '100% cubano',
  badge_sub_text = 'Instructores de La Habana'
where show_badge is null;

-- Actualizar la función de actualización para incluir los nuevos campos
create or replace function public.update_about_config(
  p_admin_id        uuid,
  p_eyebrow         text default null,
  p_title           text default null,
  p_image_url       text default null,
  p_paragraphs      jsonb default null,
  p_stats           jsonb default null,
  p_show_badge      boolean default null,
  p_badge_main_text text default null,
  p_badge_sub_text  text default null
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
    show_badge = coalesce(p_show_badge, show_badge),
    badge_main_text = coalesce(p_badge_main_text, badge_main_text),
    badge_sub_text = coalesce(p_badge_sub_text, badge_sub_text),
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