
-- Add linked_user_id to players table
ALTER TABLE public.players ADD COLUMN linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Link only the first (oldest) player per group/user combo
WITH ranked AS (
  SELECT id, user_id, group_id,
    ROW_NUMBER() OVER (PARTITION BY group_id, user_id ORDER BY created_at ASC) as rn
  FROM public.players
)
UPDATE public.players p
SET linked_user_id = r.user_id
FROM ranked r
WHERE p.id = r.id AND r.rn = 1;

-- Now add unique constraint
CREATE UNIQUE INDEX players_group_linked_user_unique ON public.players (group_id, linked_user_id) WHERE linked_user_id IS NOT NULL;
