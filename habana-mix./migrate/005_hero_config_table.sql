-- ============================================================================
-- TABLA DE CONFIGURACIÓN DEL HERO
-- ============================================================================
-- Esta tabla permite editar dinámicamente los elementos del hero/head
-- 
-- Campos editables:
-- - Imagen principal
-- - Texto de "Academia de baile cubano"
-- - Título "Habana Mix"
-- - Subtítulo descriptivo
-- - Colores y tamaños
-- ============================================================================

create table if not exists public.hero_config (
  id              uuid primary key default gen_random_uuid(),
  badge_text      text default 'Academia de baile cubano',
  title           text default 'Habana Mix',
  subtitle        text default 'Donde el sabor de La Habana se aprende bailando. Salsa cubana, timba, bachata y rueda de casino.',
  image_url       text default '/images/hero-habana.png',
  title_color     text default '#ffffff',
  subtitle_color  text default 'rgba(255,255,255,0.7)',
  badge_color     text default 'rgba(255,255,255,0.1)',
  badge_text_color text default '#ffffff',
  title_size      text default 'text-9xl',
  subtitle_size   text default 'text-lg',
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);

-- Insertar configuración inicial
insert into public.hero_config (badge_text, title, subtitle, image_url)
values (
  'Academia de baile cubano',
  'Habana Mix',
  'Donde el sabor de La Habana se aprende bailando. Salsa cubana, timba, bachata y rueda de casino.',
  '/images/hero-habana.png'
)
on conflict do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.hero_config enable row level security;

-- Solo admins pueden leer
drop policy if exists "hero_config_admin_read" on public.hero_config;
create policy "hero_config_admin_read" on public.hero_config
  for select using (public.is_admin());

-- Solo admins pueden actualizar
drop policy if exists "hero_config_admin_update" on public.hero_config;
create policy "hero_config_admin_update" on public.hero_config
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- FUNCIÓN PARA OBTENER CONFIGURACIÓN DEL HERO (pública)
-- ============================================================================

create or replace function public.get_hero_config()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select row_to_json(hc.*)::jsonb
  from public.hero_config hc
  limit 1;
$$;

-- ============================================================================
-- FUNCIÓN PARA ACTUALIZAR CONFIGURACIÓN DEL HERO (solo admin)
-- ============================================================================

create or replace function public.update_hero_config(
  p_admin_id        uuid,
  p_badge_text      text default null,
  p_title           text default null,
  p_subtitle        text default null,
  p_image_url       text default null,
  p_title_color     text default null,
  p_subtitle_color  text default null,
  p_badge_color     text default null,
  p_badge_text_color text default null,
  p_title_size      text default null,
  p_subtitle_size   text default null
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
  update public.hero_config
  set 
    badge_text = coalesce(p_badge_text, badge_text),
    title = coalesce(p_title, title),
    subtitle = coalesce(p_subtitle, subtitle),
    image_url = coalesce(p_image_url, image_url),
    title_color = coalesce(p_title_color, title_color),
    subtitle_color = coalesce(p_subtitle_color, subtitle_color),
    badge_color = coalesce(p_badge_color, badge_color),
    badge_text_color = coalesce(p_badge_text_color, badge_text_color),
    title_size = coalesce(p_title_size, title_size),
    subtitle_size = coalesce(p_subtitle_size, subtitle_size),
    updated_at = now(),
    updated_by = p_admin_id
  where id = (select id from public.hero_config limit 1)
  returning * into updated_config;

  return jsonb_build_object(
    'success', true,
    'message', 'Configuración actualizada',
    'config', row_to_json(updated_config.*)::jsonb
  );
end;
$$;