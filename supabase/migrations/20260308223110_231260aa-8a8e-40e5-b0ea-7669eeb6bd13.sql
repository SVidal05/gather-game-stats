
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'hsl(262, 80%, 55%)',
  avatar TEXT NOT NULL DEFAULT '🎮',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own players" ON public.players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own players" ON public.players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own players" ON public.players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own players" ON public.players FOR DELETE USING (auth.uid() = user_id);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  game_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  custom_stats JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- Results table
CREATE TABLE public.results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results of their sessions" ON public.results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = results.session_id AND sessions.user_id = auth.uid())
  );

CREATE POLICY "Users can create results for their sessions" ON public.results
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = results.session_id AND sessions.user_id = auth.uid())
  );

CREATE POLICY "Users can update results of their sessions" ON public.results
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = results.session_id AND sessions.user_id = auth.uid())
  );

CREATE POLICY "Users can delete results of their sessions" ON public.results
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = results.session_id AND sessions.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_players_user_id ON public.players(user_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_results_session_id ON public.results(session_id);
CREATE INDEX idx_results_player_id ON public.results(player_id);
