import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Player, GameSession, PlayerResult } from "@/lib/types";

/**
 * Fetches ALL sessions across ALL groups the user is a member of.
 * Used for global achievement calculations.
 */
export function useAllUserSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setSessions([]); setPlayers([]); setLoading(false); return; }

    // Get all groups the user is a member of
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setSessions([]); setPlayers([]); setLoading(false); return;
    }

    const groupIds = memberships.map(m => m.group_id);

    // Fetch all sessions from all user's groups with pagination
    let allSessions: any[] = [];
    const pageSize = 1000;
    const batchSize = 200;

    for (let g = 0; g < groupIds.length; g += batchSize) {
      const groupBatch = groupIds.slice(g, g + batchSize);
      let from = 0;
      while (true) {
        const { data: page } = await supabase
          .from("sessions")
          .select("*")
          .in("group_id", groupBatch)
          .order("created_at", { ascending: true })
          .range(from, from + pageSize - 1);
        if (!page || page.length === 0) break;
        allSessions = allSessions.concat(page);
        if (page.length < pageSize) break;
        from += pageSize;
      }
    }

    if (allSessions.length === 0) { setSessions([]); setPlayers([]); setLoading(false); return; }

    // Fetch results
    const sessionIds = allSessions.map(s => s.id);
    let allResults: any[] = [];
    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);
      let from = 0;
      while (true) {
        const { data: page } = await supabase
          .from("results")
          .select("*")
          .in("session_id", batch)
          .range(from, from + pageSize - 1);
        if (!page || page.length === 0) break;
        allResults = allResults.concat(page);
        if (page.length < pageSize) break;
        from += pageSize;
      }
    }

    const resultsBySession = new Map<string, PlayerResult[]>();
    const playerIds = new Set<string>();
    allResults.forEach(r => {
      const arr = resultsBySession.get(r.session_id) || [];
      arr.push({ playerId: r.player_id, score: r.score, isWinner: r.is_winner });
      resultsBySession.set(r.session_id, arr);
      playerIds.add(r.player_id);
    });

    setSessions(allSessions.map(s => ({
      id: s.id,
      name: s.name,
      date: s.date,
      gameName: s.game_name,
      gameId: s.game_id || undefined,
      playerIds: (resultsBySession.get(s.id) || []).map(r => r.playerId),
      results: resultsBySession.get(s.id) || [],
      notes: s.notes || "",
      customStats: s.custom_stats as any,
      createdAt: s.created_at,
    })));

    // Fetch all players that participated
    if (playerIds.size > 0) {
      const ids = Array.from(playerIds);
      let allPlayers: any[] = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { data } = await supabase
          .from("players")
          .select("*")
          .in("id", batch);
        if (data) allPlayers = allPlayers.concat(data);
      }
      setPlayers(allPlayers.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        avatar: p.avatar,
        createdAt: p.created_at,
        linkedUserId: p.linked_user_id || null,
      })));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessions, players, loading, refetch: fetch };
}
