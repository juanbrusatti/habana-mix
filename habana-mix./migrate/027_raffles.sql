-- 027_raffles.sql
-- Sesiones de sorteo y ganadores persistidos por evento.

CREATE TABLE IF NOT EXISTS public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_title text NOT NULL,
  prize text,
  winner_count integer NOT NULL DEFAULT 1 CHECK (winner_count BETWEEN 1 AND 50),
  participant_count integer NOT NULL DEFAULT 0,
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'drawing', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.raffle_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL,
  participant_name text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (raffle_id, participant_id),
  UNIQUE (raffle_id, position)
);

CREATE INDEX IF NOT EXISTS raffles_event_created_idx
  ON public.raffles (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS raffle_winners_raffle_idx
  ON public.raffle_winners (raffle_id, position);

ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_winners ENABLE ROW LEVEL SECURITY;
