
-- Tournaments table
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  game_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Tournament matches
CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round integer NOT NULL DEFAULT 1,
  match_order integer NOT NULL DEFAULT 0,
  player1_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  player2_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  player1_score integer NOT NULL DEFAULT 0,
  player2_score integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Player achievements
CREATE TABLE public.player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(player_id, achievement_type)
);

ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

-- RLS for tournaments
CREATE POLICY "Group members can view tournaments" ON public.tournaments
  FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group admins can create tournaments" ON public.tournaments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group admins can update tournaments" ON public.tournaments
  FOR UPDATE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins can delete tournaments" ON public.tournaments
  FOR DELETE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

-- RLS for tournament matches
CREATE POLICY "Group members can view matches" ON public.tournament_matches
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND public.is_group_member(auth.uid(), t.group_id)));

CREATE POLICY "Group members can create matches" ON public.tournament_matches
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND public.is_group_member(auth.uid(), t.group_id)));

CREATE POLICY "Group members can update matches" ON public.tournament_matches
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND public.is_group_member(auth.uid(), t.group_id)));

CREATE POLICY "Group admins can delete matches" ON public.tournament_matches
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND public.is_group_admin(auth.uid(), t.group_id)));

-- RLS for player achievements
CREATE POLICY "Group members can view achievements" ON public.player_achievements
  FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create achievements" ON public.player_achievements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(auth.uid(), group_id));

-- Public share function (no auth needed)
CREATE OR REPLACE FUNCTION public.get_group_share_data(_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'group', (SELECT json_build_object('id', g.id, 'name', g.name) FROM groups g WHERE g.id = _group_id),
    'players', (SELECT COALESCE(json_agg(json_build_object('id', p.id, 'name', p.name, 'color', p.color, 'avatar', p.avatar)), '[]'::json) FROM players p WHERE p.group_id = _group_id),
    'sessions', (SELECT COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'date', s.date, 'game_name', s.game_name)), '[]'::json) FROM sessions s WHERE s.group_id = _group_id ORDER BY s.date DESC),
    'results', (SELECT COALESCE(json_agg(json_build_object('session_id', r.session_id, 'player_id', r.player_id, 'score', r.score, 'is_winner', r.is_winner)), '[]'::json) FROM results r INNER JOIN sessions s ON s.id = r.session_id WHERE s.group_id = _group_id)
  ) INTO result;
  RETURN result;
END;
$$;
