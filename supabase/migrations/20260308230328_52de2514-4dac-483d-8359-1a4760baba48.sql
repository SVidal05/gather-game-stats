
-- Create groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  invite_code text NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create group_invites table
CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, email)
);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Add group_id to players (nullable for backward compat, will migrate)
ALTER TABLE public.players ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add group_id and created_by to sessions
ALTER TABLE public.sessions ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.sessions ADD COLUMN created_by uuid;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Security definer function to check group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role = 'admin'
  )
$$;

-- RLS for groups: members can view, owner/admin can manage
CREATE POLICY "Group members can view their groups" ON public.groups
  FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group admins can update groups" ON public.groups
  FOR UPDATE TO authenticated
  USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Group owner can delete groups" ON public.groups
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- RLS for group_members
CREATE POLICY "Group members can view members" ON public.group_members
  FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group admins can add members" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);

CREATE POLICY "Group admins can update members" ON public.group_members
  FOR UPDATE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins can remove members" ON public.group_members
  FOR DELETE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);

-- RLS for group_invites
CREATE POLICY "Group members can view invites" ON public.group_invites
  FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Group admins can create invites" ON public.group_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Invitees can update their invites" ON public.group_invites
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Group admins can delete invites" ON public.group_invites
  FOR DELETE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

-- Update players RLS: allow group members to manage players within their groups
CREATE POLICY "Group members can view group players" ON public.players
  FOR SELECT TO authenticated
  USING (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create group players" ON public.players
  FOR INSERT TO authenticated
  WITH CHECK (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group admins can update group players" ON public.players
  FOR UPDATE TO authenticated
  USING (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group admins can delete group players" ON public.players
  FOR DELETE TO authenticated
  USING (group_id IS NOT NULL AND public.is_group_admin(auth.uid(), group_id));

-- Update sessions RLS: group members can manage sessions
CREATE POLICY "Group members can view group sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create group sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update group sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Session creator or admin can delete group sessions" ON public.sessions
  FOR DELETE TO authenticated
  USING (group_id IS NOT NULL AND (created_by = auth.uid() OR public.is_group_admin(auth.uid(), group_id)));

-- Results: group members can manage results for group sessions
CREATE POLICY "Group members can view group results" ON public.results
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)));

CREATE POLICY "Group members can create group results" ON public.results
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)));

CREATE POLICY "Group members can update group results" ON public.results
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)));

CREATE POLICY "Group members can delete group results" ON public.results
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)));

-- Function to get group by invite code (for join flow)
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name FROM public.groups g WHERE g.invite_code = _code
$$;

-- Function to join group by invite code
CREATE OR REPLACE FUNCTION public.join_group_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id uuid;
  _user_id uuid := auth.uid();
BEGIN
  SELECT id INTO _group_id FROM public.groups WHERE invite_code = _code;
  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (_group_id, _user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Also accept any pending invites for this user
  UPDATE public.group_invites
  SET status = 'accepted'
  WHERE group_id = _group_id
    AND email = (SELECT email FROM auth.users WHERE id = _user_id)
    AND status = 'pending';

  RETURN _group_id;
END;
$$;
