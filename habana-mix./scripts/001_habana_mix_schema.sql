-- ============================================================================
-- HABANA MIX — Esquema completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- Es idempotente: se puede correr varias veces sin romper nada.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type card_theme as enum ('amber', 'coral', 'teal', 'noche', 'crema');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_layout as enum ('overlay', 'split', 'minimal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type class_level as enum ('principiante', 'intermedio', 'avanzado', 'todos');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- PROFILES  (1:1 con auth.users) — el flag is_admin controla el panel
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Crea el profile automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: ¿el usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- EVENTS — cada card es 100% personalizable por el admin
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  subtitle        text,
  description     text,
  image_url       text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  location        text,
  price_label     text,               -- "Entrada $25" / "Gratis con clase"
  price_amount    numeric(12,2),
  price_currency  text not null default 'ARS',
  cta_label       text default 'Reservar lugar',
  cta_url         text,
  -- personalización visual
  theme           card_theme not null default 'amber',
  layout          card_layout not null default 'overlay',
  tags            text[] not null default '{}',
  featured        boolean not null default false,
  overlay_opacity smallint not null default 60 check (overlay_opacity between 0 and 100),
  accent_color    text,               -- hex/oklch opcional que sobrescribe el theme
  status          content_status not null default 'published',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists events_status_starts_idx
  on public.events (status, starts_at);

-- ----------------------------------------------------------------------------
-- CLASSES
-- ----------------------------------------------------------------------------
create table if not exists public.classes (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  style           text not null,               -- "Salsa cubana", "Bachata"
  level           class_level not null default 'todos',
  description     text,
  image_url       text,
  instructor      text,
  schedule        text[] not null default '{}',-- ["Lunes 19:00", "Jueves 20:30"]
  duration_min    integer,
  price_amount    numeric(10,2) not null default 0,
  price_currency  text not null default 'USD',
  price_period    text default 'mes',          -- "mes" | "clase" | "pack 4"
  capacity        integer,
  spots_left      integer,
  -- personalización visual
  theme           card_theme not null default 'teal',
  layout          card_layout not null default 'split',
  tags            text[] not null default '{}',
  featured        boolean not null default false,
  overlay_opacity smallint not null default 55 check (overlay_opacity between 0 and 100),
  accent_color    text,
  status          content_status not null default 'published',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists classes_status_sort_idx
  on public.classes (status, sort_order);

-- ----------------------------------------------------------------------------
-- ENROLLMENTS — inscripción + comprobante de pago + código de acceso
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users (id) on delete set null,
  class_id          uuid not null references public.classes (id) on delete cascade,
  full_name         text not null,
  email             text not null,
  phone             text,
  receipt_url       text,                       -- path en Storage bucket "comprobantes"
  payment_method    text,                       -- "transferencia" | "efectivo" | "zelle"...
  payment_reference text,
  notes             text,
  status            enrollment_status not null default 'pending',
  access_code       text unique,                -- se genera al aprobar
  reviewed_by       uuid references auth.users (id) on delete set null,
  reviewed_at       timestamptz,
  admin_note        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists enrollments_status_idx on public.enrollments (status, created_at desc);
create index if not exists enrollments_user_idx   on public.enrollments (user_id);

-- Genera un código único legible: HM-XXXXXX
create or replace function public.generate_access_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- sin caracteres ambiguos
  code text;
  i int;
begin
  loop
    code := 'HM-';
    for i in 1..6 loop
      code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.enrollments e where e.access_code = code);
  end loop;
  return code;
end;
$$;

-- Al pasar a 'approved' se asigna el código automáticamente
create or replace function public.on_enrollment_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    if new.access_code is null then
      new.access_code := public.generate_access_code();
    end if;
    new.reviewed_at := now();
  end if;

  if new.status = 'rejected' and (old.status is distinct from 'rejected') then
    new.reviewed_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists enrollments_status_trigger on public.enrollments;
create trigger enrollments_status_trigger
  before update on public.enrollments
  for each row execute function public.on_enrollment_status_change();

-- ----------------------------------------------------------------------------
-- SITE_CONTENT — hero, mapa, quiénes somos, footer (todo editable por admin)
-- ----------------------------------------------------------------------------
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','events','classes','site_content'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s;', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles    enable row level security;
alter table public.events      enable row level security;
alter table public.classes     enable row level security;
alter table public.enrollments enable row level security;
alter table public.site_content enable row level security;

-- PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- EVENTS: lectura pública de lo publicado, escritura solo admin
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (status = 'published' or public.is_admin());

drop policy if exists "events_admin_write" on public.events;
create policy "events_admin_write" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- CLASSES
drop policy if exists "classes_public_read" on public.classes;
create policy "classes_public_read" on public.classes
  for select using (status = 'published' or public.is_admin());

drop policy if exists "classes_admin_write" on public.classes;
create policy "classes_admin_write" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

-- ENROLLMENTS: el alumno ve/crea las suyas; el admin ve y modifica todas
drop policy if exists "enrollments_select_own" on public.enrollments;
create policy "enrollments_select_own" on public.enrollments
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "enrollments_insert_own" on public.enrollments;
create policy "enrollments_insert_own" on public.enrollments
  for insert with check (auth.uid() = user_id);

drop policy if exists "enrollments_update_admin" on public.enrollments;
create policy "enrollments_update_admin" on public.enrollments
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enrollments_delete_admin" on public.enrollments;
create policy "enrollments_delete_admin" on public.enrollments
  for delete using (public.is_admin());

-- SITE_CONTENT
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content
  for select using (true);

drop policy if exists "site_content_admin_write" on public.site_content;
create policy "site_content_admin_write" on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- STORAGE — buckets para comprobantes (privado) y media del sitio (público)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- El usuario sube su comprobante dentro de una carpeta con su propio uid
drop policy if exists "comprobantes_insert_own" on storage.objects;
create policy "comprobantes_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "comprobantes_select_own_or_admin" on storage.objects;
create policy "comprobantes_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media_admin_write" on storage.objects;
create policy "media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
