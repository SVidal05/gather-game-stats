
-- Tighten games INSERT policy: only allow if user is a member of at least one group
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;

CREATE POLICY "Group members can create games" ON public.games
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.group_members WHERE user_id = auth.uid())
  )
