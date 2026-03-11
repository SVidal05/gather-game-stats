
-- 1) game_stat_definitions: defines custom stats per game
CREATE TABLE public.game_stat_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  stat_key text NOT NULL,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  options jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (game_id, stat_key)
);

ALTER TABLE public.game_stat_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stat definitions" ON public.game_stat_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Group members can create stat definitions" ON public.game_stat_definitions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE user_id = auth.uid()));

CREATE POLICY "Group members can update stat definitions" ON public.game_stat_definitions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE user_id = auth.uid()));

CREATE POLICY "Group members can delete stat definitions" ON public.game_stat_definitions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE user_id = auth.uid()));

CREATE INDEX idx_game_stat_definitions_game_id ON public.game_stat_definitions(game_id);

-- 2) result_stats: stores stat values per player result
CREATE TABLE public.result_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  stat_definition_id uuid NOT NULL REFERENCES public.game_stat_definitions(id) ON DELETE CASCADE,
  value jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.result_stats ENABLE ROW LEVEL SECURITY;

-- RLS mirrors results table access
CREATE POLICY "Users can view result stats" ON public.result_stats
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.results r
    JOIN public.sessions s ON s.id = r.session_id
    WHERE r.id = result_stats.result_id
      AND ((s.group_id IS NOT NULL AND is_group_member(auth.uid(), s.group_id)) OR s.user_id = auth.uid())
  ));

CREATE POLICY "Users can create result stats" ON public.result_stats
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.results r
    JOIN public.sessions s ON s.id = r.session_id
    WHERE r.id = result_stats.result_id
      AND ((s.group_id IS NOT NULL AND is_group_member(auth.uid(), s.group_id)) OR s.user_id = auth.uid())
  ));

CREATE POLICY "Users can update result stats" ON public.result_stats
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.results r
    JOIN public.sessions s ON s.id = r.session_id
    WHERE r.id = result_stats.result_id
      AND ((s.group_id IS NOT NULL AND (s.created_by = auth.uid() OR is_group_admin(auth.uid(), s.group_id))) OR s.user_id = auth.uid())
  ));

CREATE POLICY "Users can delete result stats" ON public.result_stats
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.results r
    JOIN public.sessions s ON s.id = r.session_id
    WHERE r.id = result_stats.result_id
      AND ((s.group_id IS NOT NULL AND (s.created_by = auth.uid() OR is_group_admin(auth.uid(), s.group_id))) OR s.user_id = auth.uid())
  ));

CREATE INDEX idx_result_stats_result_id ON public.result_stats(result_id);
CREATE INDEX idx_result_stats_stat_definition_id ON public.result_stats(stat_definition_id);
