import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type GameMode = "multiplayer" | "solo";
export type GameCategory = "competitive" | "party" | "solo" | "coop";

/** Default stat definitions auto-created per game category */
export const CATEGORY_DEFAULT_STATS: Record<GameCategory, { statKey: string; label: string; type: string; options?: string[] }[]> = {
  competitive: [
    { statKey: "kills", label: "Kills", type: "number" },
    { statKey: "deaths", label: "Deaths", type: "number" },
    { statKey: "assists", label: "Assists", type: "number" },
    { statKey: "mvp", label: "MVP", type: "boolean" },
  ],
  party: [
    { statKey: "fun_rating", label: "Fun Rating (1-10)", type: "number" },
    { statKey: "rounds_played", label: "Rounds Played", type: "number" },
    { statKey: "highlight", label: "Highlight Moment", type: "text" },
  ],
  solo: [
    { statKey: "time_played", label: "Time Played (min)", type: "number" },
    { statKey: "high_score", label: "High Score", type: "number" },
    { statKey: "level_reached", label: "Level Reached", type: "number" },
    { statKey: "completed", label: "Completed", type: "boolean" },
  ],
  coop: [
    { statKey: "team_score", label: "Team Score", type: "number" },
    { statKey: "revives", label: "Revives", type: "number" },
    { statKey: "objectives", label: "Objectives Completed", type: "number" },
    { statKey: "mission_success", label: "Mission Success", type: "boolean" },
  ],
};

async function createDefaultStats(gameId: string, category: GameCategory) {
  const defaults = CATEGORY_DEFAULT_STATS[category];
  if (!defaults || defaults.length === 0) return;

  const rows = defaults.map(d => ({
    game_id: gameId,
    stat_key: d.statKey,
    label: d.label,
    type: d.type,
    options: d.options || null,
  }));
  await supabase.from("game_stat_definitions").insert(rows);
}

export interface GameDef {
  id: string;
  name: string;
  icon: string | null;
  backgroundImage: string | null;
  coverImage: string | null;
  focusX: number;
  focusY: number;
  gameMode: GameMode;
  category: GameCategory;
  createdAt: string;
}

/** Returns CSS object-position from focus point values */
export function getObjectPosition(game?: GameDef | null): string {
  const x = game?.focusX ?? 50;
  const y = game?.focusY ?? 30;
  return `${x}% ${y}%`;
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

const artworkSearchCache = new Map<string, { backgroundImage: string | null; coverImage: string | null }>();

export async function searchGameArtwork(name: string): Promise<{ backgroundImage: string | null; coverImage: string | null }> {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) {
    return { backgroundImage: null, coverImage: null };
  }

  const cached = artworkSearchCache.get(normalizedName);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke("search-game", {
      body: { name },
    });

    if (error || !data?.success || !data?.found) {
      const emptyArtwork = { backgroundImage: null, coverImage: null };
      artworkSearchCache.set(normalizedName, emptyArtwork);
      return emptyArtwork;
    }

    const artwork = {
      backgroundImage: data.background_image || null,
      coverImage: data.cover_image || null,
    };
    artworkSearchCache.set(normalizedName, artwork);
    return artwork;
  } catch {
    const emptyArtwork = { backgroundImage: null, coverImage: null };
    artworkSearchCache.set(normalizedName, emptyArtwork);
    return emptyArtwork;
  }
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
      setGames(data.map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        backgroundImage: g.background_image || null,
        coverImage: g.cover_image || null,
        focusX: g.focus_x ?? 50,
        focusY: g.focus_y ?? 30,
        gameMode: (g.game_mode as GameMode) || "multiplayer",
        category: (g.category as GameCategory) || "competitive",
        createdAt: g.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const findOrCreateGame = useCallback(async (name: string, gameMode: GameMode = "multiplayer", category: GameCategory = "competitive"): Promise<string | null> => {
    if (!user) return null;
    const existing = games.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      // Update game mode/category if different
      const updates: Record<string, any> = {};
      if (existing.gameMode !== gameMode) updates.game_mode = gameMode;
      if (existing.category !== category) updates.category = category;
      if (Object.keys(updates).length > 0) {
        await supabase.from("games").update(updates as any).eq("id", existing.id);
        setGames(prev => prev.map(g => g.id === existing.id ? { ...g, gameMode, category } : g));
      }
      return existing.id;
    }

    // Search RAWG for artwork
    const artwork = await searchGameArtwork(name);

    const insertData: any = { name, game_mode: gameMode, category };
    if (artwork.backgroundImage) insertData.background_image = artwork.backgroundImage;
    if (artwork.coverImage) insertData.cover_image = artwork.coverImage;

    const { data } = await supabase
      .from("games")
      .insert(insertData)
      .select()
      .single();
    if (data) {
      // Auto-create category-specific default stat definitions
      await createDefaultStats(data.id, category);

      const newGame: GameDef = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        backgroundImage: (data as any).background_image || null,
        coverImage: (data as any).cover_image || null,
        focusX: (data as any).focus_x ?? 50,
        focusY: (data as any).focus_y ?? 30,
        gameMode,
        category,
        createdAt: data.created_at,
      };
      setGames(prev => [...prev, newGame]);
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

  const updateStatDefinition = useCallback(async (id: string, updates: { label?: string; type?: string; options?: string[] | null }) => {
    if (!user) return;
    const dbUpdates: Record<string, any> = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.options !== undefined) dbUpdates.options = updates.options;
    await supabase.from("game_stat_definitions").update(dbUpdates).eq("id", id);
    setStatDefs(prev => prev.map(sd => sd.id === id ? { ...sd, ...updates } as StatDefinition : sd));
  }, [user]);

  const deleteStatDefinition = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("game_stat_definitions").delete().eq("id", id);
    setStatDefs(prev => prev.filter(sd => sd.id !== id));
  }, [user]);

  return { statDefs, loading, addStatDefinition, updateStatDefinition, deleteStatDefinition, refetch: fetchStatDefs };
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

export interface AggregatedPlayerStat {
  statKey: string;
  label: string;
  type: string;
  total: number;
  count: number;
  avg: number;
  textValues: string[];
}

export interface PlayerAggregatedStats {
  playerId: string;
  stats: AggregatedPlayerStat[];
}

export function useGameResultStats(gameId: string | null, sessionIds: string[]) {
  const { user } = useAuth();
  const [data, setData] = useState<PlayerAggregatedStats[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user || !gameId || sessionIds.length === 0) { setData([]); return; }
    setLoading(true);

    // 1. Fetch stat definitions for this game
    const { data: defs } = await supabase
      .from("game_stat_definitions")
      .select("*")
      .eq("game_id", gameId);

    if (!defs || defs.length === 0) { setData([]); setLoading(false); return; }

    // 2. Fetch results for these sessions
    const batchSize = 200;
    let allResults: any[] = [];
    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);
      const { data: results } = await supabase
        .from("results")
        .select("id, player_id")
        .in("session_id", batch);
      if (results) allResults = allResults.concat(results);
    }

    if (allResults.length === 0) { setData([]); setLoading(false); return; }

    const resultIds = allResults.map(r => r.id);
    const resultPlayerMap = new Map<string, string>();
    allResults.forEach(r => resultPlayerMap.set(r.id, r.player_id));

    // 3. Fetch result_stats
    let allStats: any[] = [];
    for (let i = 0; i < resultIds.length; i += batchSize) {
      const batch = resultIds.slice(i, i + batchSize);
      const { data: stats } = await supabase
        .from("result_stats")
        .select("*")
        .in("result_id", batch);
      if (stats) allStats = allStats.concat(stats);
    }

    // 4. Aggregate by player + stat definition
    const defMap = new Map(defs.map(d => [d.id, d]));
    const agg = new Map<string, Map<string, { total: number; count: number; textValues: string[] }>>();

    allStats.forEach(rs => {
      const playerId = resultPlayerMap.get(rs.result_id);
      const def = defMap.get(rs.stat_definition_id);
      if (!playerId || !def) return;

      if (!agg.has(playerId)) agg.set(playerId, new Map());
      const playerMap = agg.get(playerId)!;
      if (!playerMap.has(def.id)) playerMap.set(def.id, { total: 0, count: 0, textValues: [] });
      const entry = playerMap.get(def.id)!;

      const val = rs.value;
      const numVal = typeof val === "number" ? val : Number(val);
      if (!isNaN(numVal) && val !== null && val !== "" && typeof val !== "boolean") {
        entry.total += numVal;
        entry.count++;
      } else if (typeof val === "boolean") {
        entry.total += val ? 1 : 0;
        entry.count++;
      } else if (typeof val === "string" && val) {
        entry.textValues.push(val);
        entry.count++;
      }
    });

    const result: PlayerAggregatedStats[] = [];
    agg.forEach((statsMap, playerId) => {
      const playerStats: AggregatedPlayerStat[] = [];
      statsMap.forEach((entry, defId) => {
        const def = defMap.get(defId);
        if (!def) return;
        playerStats.push({
          statKey: def.stat_key,
          label: def.label,
          type: def.type,
          total: entry.total,
          count: entry.count,
          avg: entry.count > 0 ? entry.total / entry.count : 0,
          textValues: entry.textValues,
        });
      });
      result.push({ playerId, stats: playerStats });
    });

    setData(result);
    setLoading(false);
  }, [user, gameId, sessionIds.join(",")]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { data, loading, refetch: fetchStats };
}
