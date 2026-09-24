-- ============================================================================
-- FOTOS DEL EVENTO (link de Google Drive)
-- ============================================================================
-- Después del evento el admin pega el link de la carpeta de Drive con las
-- fotos. Los asistentes lo ven en su entrada (/entrada/<token>) y pueden
-- recibirlo por email desde el panel.
--
-- Las fotos NO se suben a Supabase: quedan en Drive, así que no consumen el
-- storage ni el egress del plan gratuito.
--
-- Es aditiva: solo agrega columnas nuevas y no toca nada existente.
-- ============================================================================

alter table public.events
  add column if not exists photos_url text;

-- Cuándo se mandó el link por email, para no mandarlo dos veces sin querer.
alter table public.events
  add column if not exists photos_emailed_at timestamptz;
