
-- Fix all RLS policies: change from RESTRICTIVE to PERMISSIVE

-- =================== GROUPS ===================
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Group owner can delete groups" ON public.groups;

CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Group admins can update groups" ON public.groups FOR UPDATE TO authenticated USING (public.is_group_admin(auth.uid(), id));
CREATE POLICY "Group members can view their groups" ON public.groups FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), id));
CREATE POLICY "Group owner can delete groups" ON public.groups FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- =================== GROUP_MEMBERS ===================
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can update members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view members" ON public.group_members;

CREATE POLICY "Group admins can add members" ON public.group_members FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);
CREATE POLICY "Group admins can remove members" ON public.group_members FOR DELETE TO authenticated USING (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);
CREATE POLICY "Group admins can update members" ON public.group_members FOR UPDATE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Group members can view members" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));

-- =================== GROUP_INVITES ===================
DROP POLICY IF EXISTS "Group admins can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group admins can delete invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can view invites" ON public.group_invites;
DROP POLICY IF EXISTS "Invitees can update their invites" ON public.group_invites;

-- Use a security definer function to safely get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

CREATE POLICY "Group admins can create invites" ON public.group_invites FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Group admins can delete invites" ON public.group_invites FOR DELETE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Group members can view invites" ON public.group_invites FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id) OR email = public.get_current_user_email());
CREATE POLICY "Invitees can update their invites" ON public.group_invites FOR UPDATE TO authenticated USING (email = public.get_current_user_email());

-- =================== PLAYERS ===================
DROP POLICY IF EXISTS "Group admins can delete group players" ON public.players;
DROP POLICY IF EXISTS "Group admins can update group players" ON public.players;
DROP POLICY IF EXISTS "Group members can create group players" ON public.players;
DROP POLICY IF EXISTS "Group members can view group players" ON public.players;
DROP POLICY IF EXISTS "Users can create their own players" ON public.players;
DROP POLICY IF EXISTS "Users can delete their own players" ON public.players;
DROP POLICY IF EXISTS "Users can update their own players" ON public.players;
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;

CREATE POLICY "Group members can view group players" ON public.players FOR SELECT TO authenticated USING ((group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)) OR auth.uid() = user_id);
CREATE POLICY "Group members can create group players" ON public.players FOR INSERT TO authenticated WITH CHECK ((group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)) OR auth.uid() = user_id);
CREATE POLICY "Group members can update group players" ON public.players FOR UPDATE TO authenticated USING ((group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)) OR auth.uid() = user_id);
CREATE POLICY "Group admins can delete group players" ON public.players FOR DELETE TO authenticated USING ((group_id IS NOT NULL AND public.is_group_admin(auth.uid(), group_id)) OR auth.uid() = user_id);

-- =================== SESSIONS ===================
DROP POLICY IF EXISTS "Group members can create group sessions" ON public.sessions;
DROP POLICY IF EXISTS "Group members can update group sessions" ON public.sessions;
DROP POLICY IF EXISTS "Group members can view group sessions" ON public.sessions;
DROP POLICY IF EXISTS "Session creator or admin can delete group sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;

CREATE POLICY "Users can view sessions" ON public.sessions FOR SELECT TO authenticated USING ((group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)) OR auth.uid() = user_id);
CREATE POLICY "Users can create sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK ((group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)) OR auth.uid() = user_id);
CREATE POLICY "Users can update sessions" ON public.sessions FOR UPDATE TO authenticated USING ((group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id)) OR auth.uid() = user_id);
CREATE POLICY "Users can delete sessions" ON public.sessions FOR DELETE TO authenticated USING ((group_id IS NOT NULL AND (created_by = auth.uid() OR public.is_group_admin(auth.uid(), group_id))) OR auth.uid() = user_id);

-- =================== RESULTS ===================
DROP POLICY IF EXISTS "Group members can create group results" ON public.results;
DROP POLICY IF EXISTS "Group members can delete group results" ON public.results;
DROP POLICY IF EXISTS "Group members can update group results" ON public.results;
DROP POLICY IF EXISTS "Group members can view group results" ON public.results;
DROP POLICY IF EXISTS "Users can create results for their sessions" ON public.results;
DROP POLICY IF EXISTS "Users can delete results of their sessions" ON public.results;
DROP POLICY IF EXISTS "Users can update results of their sessions" ON public.results;
DROP POLICY IF EXISTS "Users can view results of their sessions" ON public.results;

CREATE POLICY "Users can view results" ON public.results FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND ((sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)) OR sessions.user_id = auth.uid())));
CREATE POLICY "Users can create results" ON public.results FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND ((sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)) OR sessions.user_id = auth.uid())));
CREATE POLICY "Users can update results" ON public.results FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND ((sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)) OR sessions.user_id = auth.uid())));
CREATE POLICY "Users can delete results" ON public.results FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = results.session_id AND ((sessions.group_id IS NOT NULL AND public.is_group_member(auth.uid(), sessions.group_id)) OR sessions.user_id = auth.uid())));

-- =================== PROFILES ===================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =================== PLAYER_ACHIEVEMENTS ===================
DROP POLICY IF EXISTS "Group members can create achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Group members can view achievements" ON public.player_achievements;

CREATE POLICY "Group members can view achievements" ON public.player_achievements FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members can create achievements" ON public.player_achievements FOR INSERT TO authenticated WITH CHECK (public.is_group_member(auth.uid(), group_id));

-- =================== TOURNAMENTS ===================
DROP POLICY IF EXISTS "Group admins can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Group admins can delete tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Group admins can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Group members can view tournaments" ON public.tournaments;

CREATE POLICY "Group members can view tournaments" ON public.tournaments FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members can create tournaments" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group admins can update tournaments" ON public.tournaments FOR UPDATE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Group admins can delete tournaments" ON public.tournaments FOR DELETE TO authenticated USING (public.is_group_admin(auth.uid(), group_id));

-- =================== TOURNAMENT_MATCHES ===================
DROP POLICY IF EXISTS "Group admins can delete matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Group members can create matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Group members can update matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Group members can view matches" ON public.tournament_matches;

CREATE POLICY "Group members can view matches" ON public.tournament_matches FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_matches.tournament_id AND public.is_group_member(auth.uid(), t.group_id)));
CREATE POLICY "Group members can create matches" ON public.tournament_matches FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_matches.tournament_id AND public.is_group_member(auth.uid(), t.group_id)));
CREATE POLICY "Group members can update matches" ON public.tournament_matches FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_matches.tournament_id AND public.is_group_member(auth.uid(), t.group_id)));
CREATE POLICY "Group admins can delete matches" ON public.tournament_matches FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_matches.tournament_id AND public.is_group_admin(auth.uid(), t.group_id)));
