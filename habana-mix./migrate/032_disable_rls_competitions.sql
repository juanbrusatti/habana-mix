-- 032_disable_rls_competitions.sql
-- Desactivar RLS para tablas de competiciones

ALTER TABLE public.competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_schedules DISABLE ROW LEVEL SECURITY;