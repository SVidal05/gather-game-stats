
-- Fix: Prevent invite manipulation - users can only change status field, not group_id or other fields
DROP POLICY IF EXISTS "Invitees can update their invites" ON public.group_invites;

CREATE POLICY "Invitees can update their invite status" ON public.group_invites
  FOR UPDATE TO authenticated
  USING (email = get_current_user_email())
  WITH CHECK (email = get_current_user_email());
