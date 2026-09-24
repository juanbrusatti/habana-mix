-- ============================================================================
-- ÁLBUMES DE FOTOS
-- ============================================================================
-- Sección "Fotos" independiente de los eventos: el admin crea un álbum con
-- título, fecha, portada y el link de la carpeta de Google Drive. Cualquiera
-- entra, abre el Drive, busca su foto y la descarga.
--
-- Las fotos NO se suben a Supabase: quedan en Drive. Acá solo se guarda el
-- link, así que no consumen el storage ni el egress del plan gratuito.
--
-- Es aditiva: crea una tabla nueva y no toca nada existente. Si se borra un
-- evento, sus álbumes no se ven afectados.
-- ============================================================================

create table if not exists public.photo_albums (
  id            uuid primary key default gen_random_uuid(),
  title         text        not null,
  description   text,
  album_date    date,
  cover_url     text,
  drive_url     text        not null,
  is_published  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists photo_albums_date_idx
  on public.photo_albums (album_date desc nulls last, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Lectura pública solo de los álbumes publicados. Sin políticas de escritura:
-- crear, editar y borrar pasa por /api/admin/albums, que valida el admin y
-- usa la service role.

alter table public.photo_albums enable row level security;

drop policy if exists "photo_albums_public_read" on public.photo_albums;
create policy "photo_albums_public_read" on public.photo_albums
  for select using (is_published = true);
