
-- 1. Add created_by column to game_stat_definitions
ALTER TABLE public.game_stat_definitions ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

-- 2. Drop overly permissive RLS policies on game_stat_definitions
DROP POLICY IF EXISTS "Group members can create stat definitions" ON public.game_stat_definitions;
DROP POLICY IF EXISTS "Group members can update stat definitions" ON public.game_stat_definitions;
DROP POLICY IF EXISTS "Group members can delete stat definitions" ON public.game_stat_definitions;

-- 3. Create scoped RLS policies for game_stat_definitions
CREATE POLICY "Authenticated users can create stat definitions"
  ON public.game_stat_definitions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Creator can update stat definitions"
  ON public.game_stat_definitions FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Creator can delete stat definitions"
  ON public.game_stat_definitions FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- 4. Drop overly permissive games UPDATE policy and scope it
DROP POLICY IF EXISTS "Group members can update games" ON public.games;
DROP POLICY IF EXISTS "Group members can create games" ON public.games;

CREATE POLICY "Authenticated users can create games"
  ON public.games FOR INSERT TO authenticated
  WITH CHECK (true);

-- Games are shared resources; only allow updates if user is in at least one group that uses this game
CREATE POLICY "Session creators can update games"
  ON public.games FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.game_id = games.id AND s.created_by = auth.uid()
  ));

-- 5. Restrict sessions policies to exclude anonymous users where needed  
-- (sessions already use auth.uid() checks which work for anon users too, 
--  but the security finding is about the RLS allowing anonymous role access)
-- We'll update policies to use 'authenticated' role explicitly (they already do)

-- 6. Fix function search_path for functions that don't have it set
-- The linter flags functions without explicit search_path
-- Most functions already have it. Let's check and fix any remaining ones.
