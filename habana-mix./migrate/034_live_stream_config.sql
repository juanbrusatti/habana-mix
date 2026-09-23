-- ============================================================================
-- TRANSMISIÓN EN VIVO
-- ============================================================================
-- El video NO pasa por Vercel ni por Supabase: se embebe el reproductor de
-- Twitch (o YouTube) y el stream viaja de la CDN de ellos al espectador.
-- Acá solo guardamos el interruptor y el canal, así que esto entra sin
-- problemas en los planes gratuitos.
--
-- Campos editables desde el admin:
-- - is_live: interruptor de "estamos transmitiendo"
-- - provider + channel: de dónde sale el video
-- - title / subtitle: qué se anuncia en la web
-- - show_chat: si se muestra el chat del proveedor al lado del video
-- ============================================================================

create table if not exists public.live_stream_config (
  id          uuid primary key default gen_random_uuid(),
  is_live     boolean not null default false,
  provider    text    not null default 'twitch',
  channel     text    default '',
  title       text    default 'Transmisión en vivo',
  subtitle    text    default 'Estamos transmitiendo ahora mismo.',
  show_chat   boolean not null default true,
  started_at  timestamptz,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  constraint live_stream_provider_valido check (provider in ('twitch', 'youtube'))
);

-- Fila única de configuración
insert into public.live_stream_config (is_live, provider, channel)
select false, 'twitch', ''
where not exists (select 1 from public.live_stream_config);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.live_stream_config enable row level security;

-- Nadie escribe directo: toda edición pasa por update_live_config(), que valida
-- el admin. Sin políticas de insert/update/delete, la tabla queda cerrada.
drop policy if exists "live_stream_admin_read" on public.live_stream_config;
create policy "live_stream_admin_read" on public.live_stream_config
  for select using (public.is_admin());

-- ============================================================================
-- LECTURA PÚBLICA (la usa la web para saber si hay que mostrar el player)
-- ============================================================================

create or replace function public.get_live_config()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select row_to_json(lc.*)::jsonb
  from public.live_stream_config lc
  limit 1;
$$;

-- ============================================================================
-- ACTUALIZACIÓN (solo admin activo)
-- ============================================================================

create or replace function public.update_live_config(
  p_admin_id  uuid,
  p_is_live   boolean default null,
  p_provider  text    default null,
  p_channel   text    default null,
  p_title     text    default null,
  p_subtitle  text    default null,
  p_show_chat boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_config record;
  admin_ok boolean;
  estaba_en_vivo boolean;
begin
  select is_active into admin_ok
  from public.admin_credentials
  where id = p_admin_id;

  if not coalesce(admin_ok, false) then
    return jsonb_build_object('success', false, 'message', 'No autorizado');
  end if;

  select is_live into estaba_en_vivo
  from public.live_stream_config
  limit 1;

  update public.live_stream_config
  set
    is_live    = coalesce(p_is_live, is_live),
    provider   = coalesce(p_provider, provider),
    channel    = coalesce(p_channel, channel),
    title      = coalesce(p_title, title),
    subtitle   = coalesce(p_subtitle, subtitle),
    show_chat  = coalesce(p_show_chat, show_chat),
    -- Se marca la hora solo cuando el vivo se enciende (apagado -> encendido)
    started_at = case
                   when coalesce(p_is_live, is_live) and not coalesce(estaba_en_vivo, false)
                     then now()
                   when not coalesce(p_is_live, is_live)
                     then null
                   else started_at
                 end,
    updated_at = now(),
    updated_by = p_admin_id
  where id = (select id from public.live_stream_config limit 1)
  returning * into updated_config;

  return jsonb_build_object(
    'success', true,
    'message', 'Transmisión actualizada',
    'config', row_to_json(updated_config.*)::jsonb
  );
end;
$$;
