-- ============================================================================
-- FOTOS DEL EVENTO (link de Google Drive)
-- ============================================================================
-- Después del evento el admin pega el link de la carpeta de Drive con las
-- fotos. El evento aparece en la sección pública /fotos y cualquiera entra,
-- abre el Drive, busca su foto y la descarga.
--
-- Las fotos NO se suben a Supabase: quedan en Drive, así que no consumen el
-- storage ni el egress del plan gratuito.
--
-- Es aditiva: solo agrega una columna nueva y no toca nada existente.
-- ============================================================================

alter table public.events
  add column if not exists photos_url text;
