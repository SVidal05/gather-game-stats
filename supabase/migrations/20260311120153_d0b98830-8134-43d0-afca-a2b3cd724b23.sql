
-- Fix: Create a secure function to accept/reject invites (only changes status, nothing else)
CREATE OR REPLACE FUNCTION public.update_invite_status(_invite_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  UPDATE public.group_invites
  SET status = _status
  WHERE id = _invite_id
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or not authorized';
  END IF;
END;
$$;

-- Remove direct UPDATE policy since users should use the function
DROP POLICY IF EXISTS "Invitees can update their invite status" ON public.group_invites
