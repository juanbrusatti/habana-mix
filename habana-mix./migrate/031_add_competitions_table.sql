-- 031_add_competitions_table.sql
-- Tabla para eventos de competencia con enfoque visual y mobile-first

-- Tabla para competiciones
CREATE TABLE IF NOT EXISTS public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla para secciones de competencia (imágenes con descripciones)
CREATE TABLE IF NOT EXISTS public.competition_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  title text,
  description text,
  image_url text,
  button_text text,
  button_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migración para agregar soporte de videos si la tabla ya existe
DO $$
BEGIN
  -- Verificar si la columna media_url existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'competition_sections' 
    AND column_name = 'media_url'
  ) THEN
    -- Si existe image_url, renombrarla a media_url
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'competition_sections' 
      AND column_name = 'image_url'
    ) THEN
      ALTER TABLE public.competition_sections RENAME COLUMN image_url TO media_url;
    END IF;
    
    -- Agregar columna media_type si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'competition_sections' 
      AND column_name = 'media_type'
    ) THEN
      ALTER TABLE public.competition_sections ADD COLUMN media_type text NOT NULL DEFAULT 'image';
      ALTER TABLE public.competition_sections ADD CONSTRAINT competition_sections_media_type_check CHECK (media_type IN ('image', 'video'));
    END IF;
  END IF;
END$$;

-- Tabla para horarios de competencia
CREATE TABLE IF NOT EXISTS public.competition_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS competitions_slug_idx ON public.competitions(slug);
CREATE INDEX IF NOT EXISTS competitions_active_idx ON public.competitions(is_active, sort_order);
CREATE INDEX IF NOT EXISTS competition_sections_competition_idx ON public.competition_sections(competition_id, sort_order);
CREATE INDEX IF NOT EXISTS competition_schedules_competition_idx ON public.competition_schedules(competition_id, sort_order);
CREATE INDEX IF NOT EXISTS competition_schedules_start_time_idx ON public.competition_schedules(start_time);

-- Función para updated_at (solo crear si no existe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (solo crear si no existen)
DROP TRIGGER IF EXISTS competitions_updated_at ON public.competitions;
CREATE TRIGGER competitions_updated_at 
  BEFORE UPDATE ON public.competitions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS competition_sections_updated_at ON public.competition_sections;
CREATE TRIGGER competition_sections_updated_at 
  BEFORE UPDATE ON public.competition_sections 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS competition_schedules_updated_at ON public.competition_schedules;
CREATE TRIGGER competition_schedules_updated_at 
  BEFORE UPDATE ON public.competition_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_schedules ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Competitions read for all" ON public.competitions;
DROP POLICY IF EXISTS "Competitions write for admins" ON public.competitions;
DROP POLICY IF EXISTS "Competition sections read for all" ON public.competition_sections;
DROP POLICY IF EXISTS "Competition sections write for admins" ON public.competition_sections;
DROP POLICY IF EXISTS "Competition schedules read for all" ON public.competition_schedules;
DROP POLICY IF EXISTS "Competition schedules write for admins" ON public.competition_schedules;

-- Políticas para competiciones (lectura pública, escritura sin autenticación para pruebas)
CREATE POLICY "Competitions read for all" 
  ON public.competitions 
  FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

CREATE POLICY "Competitions write for all" 
  ON public.competitions 
  FOR ALL 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Competition sections read for all" 
  ON public.competition_sections 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Competition sections write for all" 
  ON public.competition_sections 
  FOR ALL 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Competition schedules read for all" 
  ON public.competition_schedules 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Competition schedules write for all" 
  ON public.competition_schedules 
  FOR ALL 
  TO anon, authenticated 
  USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.competitions IS 'Eventos de competencia con enfoque visual y mobile-first';
COMMENT ON TABLE public.competition_sections IS 'Secciones visuales de competencia (imágenes/videos con descripciones y botones)';
COMMENT ON TABLE public.competition_schedules IS 'Horarios y programación de competencia';
COMMENT ON COLUMN public.competitions.slug IS 'URL amigable para la competencia';
COMMENT ON COLUMN public.competitions.cover_image_url IS 'Imagen principal de portada';
COMMENT ON COLUMN public.competition_sections.media_url IS 'URL del archivo multimedia (imagen o video)';
COMMENT ON COLUMN public.competition_sections.media_type IS 'Tipo de archivo: image o video';
COMMENT ON COLUMN public.competition_sections.button_url IS 'URL para el botón (ej: WhatsApp)';
COMMENT ON COLUMN public.competition_schedules.start_time IS 'Inicio del horario';
COMMENT ON COLUMN public.competition_schedules.end_time IS 'Fin del horario (opcional)';