
-- Create a function to create a group and add the owner as admin atomically
CREATE OR REPLACE FUNCTION public.create_group_with_owner(_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _group_id uuid;
  _result json;
BEGIN
  INSERT INTO public.groups (name, owner_id)
  VALUES (_name, _user_id)
  RETURNING id INTO _group_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (_group_id, _user_id, 'admin');

  SELECT json_build_object(
    'id', g.id,
    'name', g.name,
    'owner_id', g.owner_id,
    'invite_code', g.invite_code,
    'created_at', g.created_at
  ) INTO _result
  FROM public.groups g WHERE g.id = _group_id;

  RETURN _result;
END;
$$;
