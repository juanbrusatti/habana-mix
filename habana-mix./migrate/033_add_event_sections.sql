-- 033_add_event_sections.sql
-- Tabla para secciones / galería de imágenes de eventos (enfoque visual y mobile-first)

CREATE TABLE IF NOT EXISTS public.event_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text,
  description text,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS event_sections_event_idx ON public.event_sections(event_id, sort_order);

-- Desactivar RLS para consistencia con eventos y competiciones
ALTER TABLE public.event_sections DISABLE ROW LEVEL SECURITY;

-- Comentarios
COMMENT ON TABLE public.event_sections IS 'Imágenes y secciones visuales asociadas a un evento';
COMMENT ON COLUMN public.event_sections.image_url IS 'URL de la imagen alojada en Storage';
COMMENT ON COLUMN public.event_sections.sort_order IS 'Orden de aparición en la vista de detalle';
