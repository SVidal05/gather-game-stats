ALTER TABLE public.games ADD COLUMN game_mode text NOT NULL DEFAULT 'multiplayer';

-- Add UPDATE policy for games so game_mode can be set
CREATE POLICY "Group members can update games"
ON public.games
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM group_members WHERE group_members.user_id = auth.uid()));