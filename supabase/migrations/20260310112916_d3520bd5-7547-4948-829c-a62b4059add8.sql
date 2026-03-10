
-- Fix 1: Sessions UPDATE - only creator or admin can update
DROP POLICY IF EXISTS "Users can update sessions" ON public.sessions;
CREATE POLICY "Users can update sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (
    (group_id IS NOT NULL AND (created_by = auth.uid() OR is_group_admin(auth.uid(), group_id)))
    OR (auth.uid() = user_id)
  );

-- Fix 2: Results UPDATE - only session creator or admin
DROP POLICY IF EXISTS "Users can update results" ON public.results;
CREATE POLICY "Users can update results" ON public.results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = results.session_id
      AND (
        (s.group_id IS NOT NULL AND (s.created_by = auth.uid() OR is_group_admin(auth.uid(), s.group_id)))
        OR s.user_id = auth.uid()
      )
    )
  );

-- Fix 3: Results DELETE - only session creator or admin
DROP POLICY IF EXISTS "Users can delete results" ON public.results;
CREATE POLICY "Users can delete results" ON public.results
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = results.session_id
      AND (
        (s.group_id IS NOT NULL AND (s.created_by = auth.uid() OR is_group_admin(auth.uid(), s.group_id)))
        OR s.user_id = auth.uid()
      )
    )
  );

-- Fix 4: Tournament matches UPDATE - only admin or tournament creator
DROP POLICY IF EXISTS "Group members can update matches" ON public.tournament_matches;
CREATE POLICY "Admins or creators can update matches" ON public.tournament_matches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_matches.tournament_id
      AND (is_group_admin(auth.uid(), t.group_id) OR t.created_by = auth.uid())
    )
  );

-- Fix 5: Player achievements INSERT - only for own players or admin
DROP POLICY IF EXISTS "Group members can create achievements" ON public.player_achievements;
CREATE POLICY "Members can create own achievements" ON public.player_achievements
  FOR INSERT TO authenticated
  WITH CHECK (
    is_group_member(auth.uid(), group_id)
    AND (
      EXISTS (SELECT 1 FROM players p WHERE p.id = player_id AND p.user_id = auth.uid())
      OR is_group_admin(auth.uid(), group_id)
    )
  );
