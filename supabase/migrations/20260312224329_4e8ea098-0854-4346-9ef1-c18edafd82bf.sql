
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'competitive';

-- Backfill existing solo games
UPDATE public.games SET category = 'solo' WHERE game_mode = 'solo';
