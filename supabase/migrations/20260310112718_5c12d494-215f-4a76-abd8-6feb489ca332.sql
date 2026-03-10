
-- Fix 1: CRITICAL - Privilege escalation on group_members INSERT
-- Current policy allows any user to join any group and set any role
-- New policy: admin can add members OR user can self-join ONLY if they have a pending invite, and role must be 'member'
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;

CREATE POLICY "Group admins can add members" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Admins can add anyone
    is_group_admin(auth.uid(), group_id)
    OR (
      -- Users can only add themselves
      auth.uid() = user_id
      -- Must have a pending invite for their email in this group
      AND EXISTS (
        SELECT 1 FROM public.group_invites gi
        WHERE gi.group_id = group_members.group_id
          AND gi.email = get_current_user_email()
          AND gi.status = 'pending'
      )
      -- Can only join as 'member', never as 'admin'
      AND role = 'member'
    )
  );

-- Fix 2: Restrict invite email visibility to admins only (not all members)
DROP POLICY IF EXISTS "Group members can view invites" ON public.group_invites;

CREATE POLICY "Group admins and invitees can view invites" ON public.group_invites
  FOR SELECT TO authenticated
  USING (
    is_group_admin(auth.uid(), group_id)
    OR email = get_current_user_email()
  );
