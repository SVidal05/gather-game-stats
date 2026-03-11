import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface GameDef {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
}

export interface StatDefinition {
  id: string;
  gameId: string;
  statKey: string;
  label: string;
  type: "number" | "boolean" | "text" | "select";
  options: string[] | null;
  createdAt: string;
}

export function useGames() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameDef[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    if (!user) { setGames([]); setLoading(false); return; }
    const { data } = await supabase
      .from("games")
      .select("*")
      .order("name", { ascending: true });
    if (data) {
      setGames(data.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        createdAt: g.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const findOrCreateGame = useCallback(async (name: string): Promise<string | null> => {
    if (!user) return null;
    // Check if game exists
    const existing = games.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const { data } = await supabase
      .from("games")
      .insert({ name })
      .select()
      .single();
    if (data) {
      setGames(prev => [...prev, { id: data.id, name: data.name, icon: data.icon, createdAt: data.created_at }]);
      return data.id;
    }
    return null;
  }, [user, games]);

  return { games, loading, findOrCreateGame, refetch: fetchGames };
}

export function useStatDefinitions(gameId: string | null) {
  const { user } = useAuth();
  const [statDefs, setStatDefs] = useState<StatDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatDefs = useCallback(async () => {
    if (!user || !gameId) { setStatDefs([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("game_stat_definitions")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });
    if (data) {
      setStatDefs(data.map(d => ({
        id: d.id,
        gameId: d.game_id,
        statKey: d.stat_key,
        label: d.label,
        type: d.type as StatDefinition["type"],
        options: d.options as string[] | null,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [user, gameId]);

  useEffect(() => { fetchStatDefs(); }, [fetchStatDefs]);

  const addStatDefinition = useCallback(async (def: { statKey: string; label: string; type: string; options?: string[] }) => {
    if (!user || !gameId) return;
    const { data } = await supabase
      .from("game_stat_definitions")
      .insert({
        game_id: gameId,
        stat_key: def.statKey,
        label: def.label,
        type: def.type,
        options: def.options || null,
      })
      .select()
      .single();
    if (data) {
      setStatDefs(prev => [...prev, {
        id: data.id,
        gameId: data.game_id,
        statKey: data.stat_key,
        label: data.label,
        type: data.type as StatDefinition["type"],
        options: data.options as string[] | null,
        createdAt: data.created_at,
      }]);
    }
  }, [user, gameId]);

  return { statDefs, loading, addStatDefinition, refetch: fetchStatDefs };
}

export async function saveResultStats(
  resultId: string,
  stats: { statDefinitionId: string; value: any }[]
) {
  if (stats.length === 0) return;
  const rows = stats
    .filter(s => s.value !== "" && s.value !== undefined && s.value !== null)
    .map(s => ({
      result_id: resultId,
      stat_definition_id: s.statDefinitionId,
      value: typeof s.value === "object" ? s.value : JSON.parse(JSON.stringify(s.value)),
    }));
  if (rows.length > 0) {
    await supabase.from("result_stats").insert(rows);
  }
}
