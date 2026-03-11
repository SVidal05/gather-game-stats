
-- 1) Create games table for normalized game names
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can view all games
CREATE POLICY "Authenticated users can view games" ON public.games
  FOR SELECT TO authenticated USING (true);

-- RLS: authenticated users can insert games
CREATE POLICY "Authenticated users can create games" ON public.games
  FOR INSERT TO authenticated WITH CHECK (true);

-- 2) Add game_id to sessions (nullable for backward compat)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.games(id);

-- 3) Add position to results (nullable for backward compat)
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS position integer;

-- 4) Index on sessions.game_id
CREATE INDEX IF NOT EXISTS idx_sessions_game_id ON public.sessions(game_id);

-- 5) Backfill: create game entries from existing session game_name values
INSERT INTO public.games (name)
SELECT DISTINCT game_name FROM public.sessions WHERE game_name IS NOT NULL AND game_name != ''
ON CONFLICT (name) DO NOTHING;

-- 6) Backfill: link existing sessions to games
UPDATE public.sessions s
SET game_id = g.id
FROM public.games g
WHERE s.game_name = g.name AND s.game_id IS NULL
