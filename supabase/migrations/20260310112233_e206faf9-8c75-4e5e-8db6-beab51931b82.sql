
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_players_group_id ON public.players USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON public.sessions USING btree (group_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups USING btree (invite_code);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches USING btree (tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_group_id ON public.player_achievements USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_player_id ON public.player_achievements USING btree (player_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_email ON public.group_invites USING btree (email);
CREATE INDEX IF NOT EXISTS idx_sessions_group_date ON public.sessions USING btree (group_id, date DESC);
