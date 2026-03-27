
CREATE OR REPLACE FUNCTION public.get_group_member_emails(_group_id uuid)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT gm.user_id, u.email::text
  FROM public.group_members gm
  JOIN auth.users u ON u.id = gm.user_id
  WHERE gm.group_id = _group_id
    AND is_group_member(auth.uid(), _group_id)
$$;
