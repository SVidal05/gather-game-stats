-- 1) Add personal-group flag
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;

-- Ensure only one personal group per owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_one_personal_per_owner
ON public.groups(owner_id)
WHERE is_personal = true;

-- 2) Function to ensure personal group for the authenticated user
CREATE OR REPLACE FUNCTION public.ensure_personal_group()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _group_id uuid;
  _display_name text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO _group_id
  FROM public.groups
  WHERE owner_id = _uid
    AND is_personal = true
  LIMIT 1;

  IF _group_id IS NULL THEN
    INSERT INTO public.groups (name, owner_id, is_personal)
    VALUES ('Personal', _uid, true)
    RETURNING id INTO _group_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _uid
  ) THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (_group_id, _uid, 'admin');
  ELSE
    UPDATE public.group_members
    SET role = 'admin'
    WHERE group_id = _group_id AND user_id = _uid;
  END IF;

  -- Keep personal groups single-user only
  DELETE FROM public.group_members gm
  WHERE gm.group_id = _group_id
    AND gm.user_id <> _uid;

  SELECT NULLIF(TRIM(username), '') INTO _display_name
  FROM public.profiles
  WHERE user_id = _uid
  LIMIT 1;

  IF _display_name IS NULL THEN
    _display_name := 'Me';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE group_id = _group_id AND user_id = _uid
  ) THEN
    INSERT INTO public.players (group_id, user_id, name)
    VALUES (_group_id, _uid, _display_name);
  END IF;

  -- Keep personal groups single-player only
  DELETE FROM public.players p
  WHERE p.group_id = _group_id
    AND p.user_id <> _uid;

  RETURN _group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_personal_group() TO authenticated;

-- 3) Backfill existing users from profiles
INSERT INTO public.groups (name, owner_id, is_personal)
SELECT 'Personal', p.user_id, true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.groups g
  WHERE g.owner_id = p.user_id
    AND g.is_personal = true
);

INSERT INTO public.group_members (group_id, user_id, role)
SELECT g.id, g.owner_id, 'admin'
FROM public.groups g
WHERE g.is_personal = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = g.id
      AND gm.user_id = g.owner_id
  );

INSERT INTO public.players (group_id, user_id, name)
SELECT g.id, g.owner_id, COALESCE(NULLIF(TRIM(pr.username), ''), 'Me')
FROM public.groups g
LEFT JOIN public.profiles pr ON pr.user_id = g.owner_id
WHERE g.is_personal = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.players p
    WHERE p.group_id = g.id
      AND p.user_id = g.owner_id
  );

-- Clean up personal groups to keep single-user/single-player behavior
DELETE FROM public.group_members gm
USING public.groups g
WHERE gm.group_id = g.id
  AND g.is_personal = true
  AND gm.user_id <> g.owner_id;

DELETE FROM public.players p
USING public.groups g
WHERE p.group_id = g.id
  AND g.is_personal = true
  AND p.user_id <> g.owner_id;

-- 4) Block joining/invite-code lookup for personal groups
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT g.id, g.name
  FROM public.groups g
  WHERE g.invite_code = _code
    AND g.is_personal = false
$$;

CREATE OR REPLACE FUNCTION public.join_group_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _group_id uuid;
  _user_id uuid := auth.uid();
BEGIN
  SELECT id INTO _group_id
  FROM public.groups
  WHERE invite_code = _code
    AND is_personal = false;

  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (_group_id, _user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  UPDATE public.group_invites
  SET status = 'accepted'
  WHERE group_id = _group_id
    AND email = (SELECT email FROM auth.users WHERE id = _user_id)
    AND status = 'pending';

  RETURN _group_id;
END;
$$;

-- 5) Policies: personal groups cannot be deleted/invited/joined by others
DROP POLICY IF EXISTS "Group owner can delete groups" ON public.groups;
CREATE POLICY "Group owner can delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id AND is_personal = false);

DROP POLICY IF EXISTS "Group admins can create invites" ON public.group_invites;
CREATE POLICY "Group admins can create invites"
ON public.group_invites
FOR INSERT
TO authenticated
WITH CHECK (
  is_group_admin(auth.uid(), group_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_invites.group_id
      AND g.is_personal = true
  )
);

DROP POLICY IF EXISTS "Group admins can delete invites" ON public.group_invites;
CREATE POLICY "Group admins can delete invites"
ON public.group_invites
FOR DELETE
TO authenticated
USING (
  is_group_admin(auth.uid(), group_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_invites.group_id
      AND g.is_personal = true
  )
);

DROP POLICY IF EXISTS "Group admins and invitees can view invites" ON public.group_invites;
CREATE POLICY "Group admins and invitees can view invites"
ON public.group_invites
FOR SELECT
TO authenticated
USING (
  (is_group_admin(auth.uid(), group_id) OR (email = get_current_user_email()))
  AND NOT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_invites.group_id
      AND g.is_personal = true
  )
);

DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;
CREATE POLICY "Group admins can add members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  (
    is_group_admin(auth.uid(), group_id)
    OR (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1
        FROM public.group_invites gi
        WHERE gi.group_id = group_members.group_id
          AND gi.email = get_current_user_email()
          AND gi.status = 'pending'
      )
      AND role = 'member'
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
      AND g.is_personal = true
  )
);

DROP POLICY IF EXISTS "Group members can create group players" ON public.players;
CREATE POLICY "Group members can create group players"
ON public.players
FOR INSERT
TO authenticated
WITH CHECK (
  (
    ((group_id IS NOT NULL) AND is_group_member(auth.uid(), group_id))
    OR (auth.uid() = user_id)
  )
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = players.group_id
        AND g.is_personal = true
    )
    OR (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = players.group_id
          AND g.is_personal = true
          AND g.owner_id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.players p
        WHERE p.group_id = players.group_id
      )
    )
  )
);
