import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Player, GameSession, PlayerStats, PlayerResult } from "./types";

export function usePlayers(groupId: string | null) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    if (!user || !groupId) { setPlayers([]); setLoading(false); return; }
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (data) {
      setPlayers(data.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        avatar: p.avatar,
        createdAt: p.created_at,
      })));
    }
    setLoading(false);
  }, [user, groupId]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const addPlayer = useCallback(async (player: Omit<Player, "id" | "createdAt">) => {
    if (!user || !groupId) return;
    const { data } = await supabase
      .from("players")
      .insert({ user_id: user.id, group_id: groupId, name: player.name, color: player.color, avatar: player.avatar })
      .select()
      .single();
    if (data) {
      setPlayers(prev => [...prev, { id: data.id, name: data.name, color: data.color, avatar: data.avatar, createdAt: data.created_at }]);
    }
  }, [user, groupId]);

  const removePlayer = useCallback(async (id: string) => {
    await supabase.from("players").delete().eq("id", id);
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePlayer = useCallback(async (id: string, updates: Partial<Player>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    await supabase.from("players").update(dbUpdates).eq("id", id);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  return { players, addPlayer, removePlayer, updatePlayer, loading };
}

export function useSessions(groupId: string | null) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user || !groupId) { setSessions([]); setLoading(false); return; }
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (!sessionsData) { setLoading(false); return; }

    const sessionIds = sessionsData.map(s => s.id);
    let allResults: any[] = [];
    if (sessionIds.length > 0) {
      const { data: resultsData } = await supabase
        .from("results")
        .select("*")
        .in("session_id", sessionIds);
      allResults = resultsData || [];
    }

    const resultsBySession = new Map<string, PlayerResult[]>();
    allResults.forEach(r => {
      const arr = resultsBySession.get(r.session_id) || [];
      arr.push({ playerId: r.player_id, score: r.score, isWinner: r.is_winner });
      resultsBySession.set(r.session_id, arr);
    });

    setSessions(sessionsData.map(s => ({
      id: s.id,
      name: s.name,
      date: s.date,
      gameName: s.game_name,
      playerIds: (resultsBySession.get(s.id) || []).map(r => r.playerId),
      results: resultsBySession.get(s.id) || [],
      notes: s.notes || "",
      customStats: s.custom_stats as Record<string, Record<string, string | number>> | undefined,
      createdAt: s.created_at,
    })));
    setLoading(false);
  }, [user, groupId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const addSession = useCallback(async (session: Omit<GameSession, "id" | "createdAt">) => {
    if (!user || !groupId) return;
    const { data: sessionData } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        group_id: groupId,
        created_by: user.id,
        name: session.name,
        game_name: session.gameName,
        date: session.date,
        notes: session.notes,
        custom_stats: session.customStats as any,
      })
      .select()
      .single();

    if (!sessionData) return;

    const resultsToInsert = session.results.map(r => ({
      session_id: sessionData.id,
      player_id: r.playerId,
      score: r.score,
      is_winner: r.isWinner,
    }));

    await supabase.from("results").insert(resultsToInsert);

    setSessions(prev => [...prev, {
      id: sessionData.id,
      name: sessionData.name,
      date: sessionData.date,
      gameName: sessionData.game_name,
      playerIds: session.playerIds,
      results: session.results,
      notes: sessionData.notes || "",
      customStats: sessionData.custom_stats as any,
      createdAt: sessionData.created_at,
    }]);
  }, [user, groupId]);

  const removeSession = useCallback(async (id: string) => {
    await supabase.from("results").delete().eq("session_id", id);
    await supabase.from("sessions").delete().eq("id", id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSession = useCallback(async (id: string, updates: Partial<GameSession>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.gameName !== undefined) dbUpdates.game_name = updates.gameName;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.customStats !== undefined) dbUpdates.custom_stats = updates.customStats;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("sessions").update(dbUpdates).eq("id", id);
    }

    if (updates.results) {
      await supabase.from("results").delete().eq("session_id", id);
      const resultsToInsert = updates.results.map(r => ({
        session_id: id,
        player_id: r.playerId,
        score: r.score,
        is_winner: r.isWinner,
      }));
      await supabase.from("results").insert(resultsToInsert);
    }

    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  return { sessions, addSession, removeSession, updateSession, loading };
}

export function getPlayerStats(players: Player[], sessions: GameSession[]): PlayerStats[] {
  return players.map(player => {
    const playerSessions = sessions.filter(s => s.results.some(r => r.playerId === player.id));
    const wins = sessions.filter(s => s.results.some(r => r.playerId === player.id && r.isWinner)).length;
    const totalPoints = sessions.reduce((sum, s) => {
      const result = s.results.find(r => r.playerId === player.id);
      return sum + (result?.score || 0);
    }, 0);

    return {
      player,
      gamesPlayed: playerSessions.length,
      wins,
      winRate: playerSessions.length > 0 ? (wins / playerSessions.length) * 100 : 0,
      totalPoints,
    };
  });
}
