import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronUp, Download, Trophy, BarChart3, Calendar, Gem, Users, User, Filter, TrendingUp, Layers } from "lucide-react";
import { Player, GameSession, isSoloSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { PlayerBadge } from "@/components/PlayerBadge";
import { RankBadge } from "@/components/RankBadge";
import { exportToCSV } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, AreaChart, Area,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGameTheme } from "@/lib/gameThemes";
import { useGames, GameCategory } from "@/lib/gameStore";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Ranking Tab (Leaderboard) ──────────────────────
type SortKey = "wins" | "winRate" | "totalPoints" | "gamesPlayed" | "sessions" | "coopSessions" | "uniquePartners";
type LeaderboardMode = "all" | "competitive" | "party" | "coop";

export function RankingTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [categoryMode, setCategoryMode] = useState<LeaderboardMode>("all");

  const { games } = useGames();
  const gameCategoryMap = useMemo(() => {
    const map = new Map<string, GameCategory>();
    games.forEach(g => map.set(g.name.toLowerCase(), g.category));
    return map;
  }, [games]);
  const getSessionCategory = (s: GameSession): GameCategory =>
    gameCategoryMap.get(s.gameName.toLowerCase()) || "competitive";

  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));

  // Filter sessions by game + category
  const filteredSessions = useMemo(() => {
    let result = gameFilter === "all" ? sessions : sessions.filter(s => s.gameName === gameFilter);
    if (categoryMode !== "all") {
      result = result.filter(s => getSessionCategory(s) === categoryMode);
    }
    return result.filter(s => !isSoloSession(s));
  }, [sessions, gameFilter, categoryMode, getSessionCategory]);

  // Compute stats based on category mode
  const competitiveStats = useMemo(() => getPlayerStats(players, filteredSessions), [players, filteredSessions]);

  // Party: participation-focused
  const partyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => s.results.forEach(r => { counts[r.playerId] = (counts[r.playerId] || 0) + 1; }));
    return players
      .map(p => ({ player: p, sessions: counts[p.id] || 0 }))
      .filter(x => x.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions);
  }, [players, filteredSessions]);

  // Coop: sessions completed together + unique partners
  const coopStats = useMemo(() => {
    const sessionCount: Record<string, number> = {};
    const partnerSets: Record<string, Set<string>> = {};
    filteredSessions.forEach(s => {
      const pids = s.results.map(r => r.playerId);
      pids.forEach(pid => {
        sessionCount[pid] = (sessionCount[pid] || 0) + 1;
        if (!partnerSets[pid]) partnerSets[pid] = new Set();
        pids.forEach(other => { if (other !== pid) partnerSets[pid].add(other); });
      });
    });
    return players
      .map(p => ({ player: p, coopSessions: sessionCount[p.id] || 0, uniquePartners: partnerSets[p.id]?.size || 0 }))
      .filter(x => x.coopSessions > 0)
      .sort((a, b) => b.coopSessions - a.coopSessions);
  }, [players, filteredSessions]);

  // Reset sort when changing category
  useEffect(() => {
    if (categoryMode === "party") { setSortBy("sessions"); setSortDir("desc"); }
    else if (categoryMode === "coop") { setSortBy("coopSessions"); setSortDir("desc"); }
    else { setSortBy("wins"); setSortDir("desc"); }
  }, [categoryMode]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  };

  const getRowClass = (i: number) => {
    if (sortDir !== "desc") return "";
    if (i === 0) return "leaderboard-gold";
    if (i === 1) return "leaderboard-silver";
    if (i === 2) return "leaderboard-bronze";
    return "";
  };

  const categoryModeOptions: { value: LeaderboardMode; label: string; icon: typeof Trophy }[] = [
    { value: "all", label: "All", icon: BarChart3 },
    { value: "competitive", label: "Competitive", icon: Trophy },
    { value: "party", label: "Party", icon: Users },
    { value: "coop", label: "Co-op", icon: Users },
  ];

  // Sort helpers per mode
  const sortedCompetitive = useMemo(() => {
    const key = sortBy as "wins" | "winRate" | "totalPoints" | "gamesPlayed";
    if (!["wins", "winRate", "totalPoints", "gamesPlayed"].includes(key)) return competitiveStats;
    return [...competitiveStats].sort((a, b) => {
      const diff = (a as any)[key] - (b as any)[key];
      return sortDir === "desc" ? -diff : diff;
    });
  }, [competitiveStats, sortBy, sortDir]);

  const sortedParty = useMemo(() => {
    return [...partyStats].sort((a, b) => sortDir === "desc" ? b.sessions - a.sessions : a.sessions - b.sessions);
  }, [partyStats, sortDir]);

  const sortedCoop = useMemo(() => {
    const key = sortBy === "uniquePartners" ? "uniquePartners" : "coopSessions";
    return [...coopStats].sort((a, b) => sortDir === "desc" ? (b as any)[key] - (a as any)[key] : (a as any)[key] - (b as any)[key]);
  }, [coopStats, sortBy, sortDir]);

  const isEmpty = (categoryMode === "all" || categoryMode === "competitive")
    ? sortedCompetitive.length === 0
    : categoryMode === "party" ? sortedParty.length === 0
    : sortedCoop.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Leaderboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Rankings across all games</p>
        </div>
        <div className="flex items-center gap-2">
          {uniqueGames.length > 0 && (
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                  <SelectValue placeholder="Global" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><span className="font-bold">Global</span></SelectItem>
                {uniqueGames.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {!isEmpty && (
            <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs" onClick={() => exportToCSV(players, sessions, "leaderboard")}>
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          )}
        </div>
      </div>

      {/* Category mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
        {categoryModeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setCategoryMode(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              categoryMode === opt.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <opt.icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="text-center py-12">
          <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">Play some games to see rankings!</p>
        </div>
      ) : (
        <div className="game-card overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Player</th>

                {/* Competitive / All columns */}
                {(categoryMode === "all" || categoryMode === "competitive") && (
                  <>
                    <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("gamesPlayed")}>
                      <span className="inline-flex items-center gap-1">Games <SortIcon field="gamesPlayed" /></span>
                    </th>
                    <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("wins")}>
                      <span className="inline-flex items-center gap-1">Wins <SortIcon field="wins" /></span>
                    </th>
                    <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("winRate")}>
                      <span className="inline-flex items-center gap-1">Win% <SortIcon field="winRate" /></span>
                    </th>
                    <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("totalPoints")}>
                      <span className="inline-flex items-center gap-1">Pts <SortIcon field="totalPoints" /></span>
                    </th>
                  </>
                )}

                {/* Party columns */}
                {categoryMode === "party" && (
                  <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("sessions")}>
                    <span className="inline-flex items-center gap-1">Sessions <SortIcon field="sessions" /></span>
                  </th>
                )}

                {/* Coop columns */}
                {categoryMode === "coop" && (
                  <>
                    <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("coopSessions")}>
                      <span className="inline-flex items-center gap-1">Sessions <SortIcon field="coopSessions" /></span>
                    </th>
                    <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("uniquePartners")}>
                      <span className="inline-flex items-center gap-1">Partners <SortIcon field="uniquePartners" /></span>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(categoryMode === "all" || categoryMode === "competitive") && sortedCompetitive.map((ps, i) => (
                <motion.tr key={ps.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${getRowClass(i)}`}>
                  <td className="p-3">{sortDir === "desc" ? <RankBadge rank={i + 1} size="sm" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}</td>
                  <td className="p-3"><PlayerBadge player={ps.player} size="sm" /></td>
                  <td className="p-3 text-right font-semibold">{ps.gamesPlayed}</td>
                  <td className="p-3 text-right font-semibold">{ps.wins}</td>
                  <td className="p-3 text-right font-semibold">{ps.winRate.toFixed(0)}%</td>
                  <td className="p-3 text-right font-semibold">{ps.totalPoints}</td>
                </motion.tr>
              ))}

              {categoryMode === "party" && sortedParty.map((ps, i) => (
                <motion.tr key={ps.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${getRowClass(i)}`}>
                  <td className="p-3">{sortDir === "desc" ? <RankBadge rank={i + 1} size="sm" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}</td>
                  <td className="p-3"><PlayerBadge player={ps.player} size="sm" /></td>
                  <td className="p-3 text-right font-semibold">{ps.sessions}</td>
                </motion.tr>
              ))}

              {categoryMode === "coop" && sortedCoop.map((ps, i) => (
                <motion.tr key={ps.player.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${getRowClass(i)}`}>
                  <td className="p-3">{sortDir === "desc" ? <RankBadge rank={i + 1} size="sm" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}</td>
                  <td className="p-3"><PlayerBadge player={ps.player} size="sm" /></td>
                  <td className="p-3 text-right font-semibold">{ps.coopSessions}</td>
                  <td className="p-3 text-right font-semibold">{ps.uniquePartners}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Charts Tab ───────────────────────────────────
type ModeFilter = "all" | "multiplayer" | "solo";
type TimeFilter = "all" | "30d" | "90d" | "year";
type CategoryFilter = "all" | GameCategory;

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--game-orange))",
  "hsl(var(--game-pink))", "hsl(var(--game-blue))", "hsl(var(--game-cyan))",
  "hsl(var(--game-purple))", "hsl(var(--game-red))",
];

const CATEGORY_COLORS: Record<string, string> = {
  competitive: "hsl(var(--primary))",
  party: "hsl(var(--game-orange))",
  solo: "hsl(var(--accent))",
  coop: "hsl(var(--game-pink))",
};

const CATEGORY_LABELS: Record<string, string> = {
  competitive: "Competitive",
  party: "Party",
  solo: "Solo",
  coop: "Co-op",
};

export function ChartsTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const { games } = useGames();
  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));

  // Build a gameName -> category lookup from DB
  const gameCategoryMap = useMemo(() => {
    const map = new Map<string, GameCategory>();
    games.forEach(g => map.set(g.name.toLowerCase(), g.category));
    return map;
  }, [games]);

  const getSessionCategory = (s: GameSession): GameCategory => {
    return gameCategoryMap.get(s.gameName.toLowerCase()) || "competitive";
  };

  // Apply filters
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Mode filter
    if (modeFilter === "multiplayer") result = result.filter(s => !isSoloSession(s));
    else if (modeFilter === "solo") result = result.filter(s => isSoloSession(s));

    // Category filter
    if (categoryFilter !== "all") result = result.filter(s => getSessionCategory(s) === categoryFilter);

    // Game filter
    if (gameFilter !== "all") result = result.filter(s => s.gameName === gameFilter);

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      if (timeFilter === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (timeFilter === "90d") cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      else cutoff = new Date(now.getFullYear(), 0, 1); // year
      result = result.filter(s => new Date(s.date) >= cutoff);
    }

    return result;
  }, [sessions, modeFilter, gameFilter, timeFilter]);

  const multiplayerFiltered = filteredSessions.filter(s => !isSoloSession(s));
  const soloFiltered = filteredSessions.filter(s => isSoloSession(s));
  const filteredStats = getPlayerStats(players, multiplayerFiltered);

  // Wins data
  const winsData = filteredStats
    .filter(s => s.gamesPlayed > 0)
    .sort((a, b) => b.wins - a.wins)
    .map(s => ({ name: s.player.name, wins: s.wins, color: s.player.color }));

  // Sessions over time
  const timeData = useMemo(() => {
    const months: Record<string, { total: number; multi: number; solo: number }> = {};
    filteredSessions.forEach(s => {
      const month = new Date(s.date).toLocaleDateString("en", { year: "2-digit", month: "short" });
      if (!months[month]) months[month] = { total: 0, multi: 0, solo: 0 };
      months[month].total++;
      if (isSoloSession(s)) months[month].solo++;
      else months[month].multi++;
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }, [filteredSessions]);

  // Most played games
  const gamesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => { counts[s.gameName] = (counts[s.gameName] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => {
        const theme = getGameTheme(name);
        return { name, count, color: theme.primaryColor };
      });
  }, [filteredSessions]);

  // Player participation
  const participationData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      s.results.forEach(r => {
        counts[r.playerId] = (counts[r.playerId] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([pid, count]) => {
        const p = players.find(pl => pl.id === pid);
        return p ? { name: p.name, sessions: count, color: p.color } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.sessions - a!.sessions) as { name: string; sessions: number; color: string }[];
  }, [filteredSessions, players]);

  // Solo progress: sessions per solo player over time
  const soloProgressData = useMemo(() => {
    if (soloFiltered.length === 0) return [];
    const sorted = [...soloFiltered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((s, i) => {
      const p = players.find(pl => pl.id === s.results[0]?.playerId);
      return { session: `#${i + 1}`, game: s.gameName, player: p?.name || "Unknown", date: s.date };
    });
  }, [soloFiltered, players]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      const cat = getSessionCategory(s);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([cat, count]) => ({
        name: CATEGORY_LABELS[cat] || cat,
        value: count,
        color: CATEGORY_COLORS[cat] || CHART_COLORS[0],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSessions, getSessionCategory]);

  // Most played category
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  const pointsData = filteredStats
    .filter(s => s.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map(s => ({ name: s.player.name, points: s.totalPoints, color: s.player.color }));

  if (players.length === 0 || sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Charts</h2>
        <div className="text-center py-12">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">Play some games to see charts!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Charts</h2>
        <p className="text-muted-foreground text-sm mt-1">Analytics and visual statistics</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as ModeFilter)}>
          <SelectTrigger className="w-[130px] h-9 rounded-lg text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="multiplayer">Multiplayer</SelectItem>
            <SelectItem value="solo">Solo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {uniqueGames.map(g => {
              const gt = getGameTheme(g);
              return (
                <SelectItem key={g} value={g}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gt.primaryColor }} />
                    {g}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[120px] h-9 rounded-lg text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
          <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="competitive">Competitive</SelectItem>
            <SelectItem value="party">Party</SelectItem>
            <SelectItem value="solo">Solo</SelectItem>
            <SelectItem value="coop">Co-op</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-display font-bold text-foreground">{filteredSessions.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Sessions</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-display font-bold text-foreground">{multiplayerFiltered.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Multiplayer</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-display font-bold text-foreground">{soloFiltered.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Solo</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-display font-bold" style={{ color: topCategory ? topCategory.color : undefined }}>{topCategory?.name || "—"}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Top Category</p>
        </div>
      </div>

      {/* Sessions Over Time */}
      {timeData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Sessions Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="multi" name="Multiplayer" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" strokeWidth={2} />
              <Area type="monotone" dataKey="solo" name="Solo" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent)/0.3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Category Distribution */}
      {categoryData.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Category Distribution
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30} strokeWidth={2} stroke="hsl(var(--card))">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-foreground font-medium flex-1">{entry.name}</span>
                  <span className="font-bold text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {gamesData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Most Played Games
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gamesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Sessions" radius={[0, 6, 6, 0]} animationDuration={800}>
                {gamesData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Player Participation */}
      {participationData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Player Participation
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sessions" name="Sessions" radius={[6, 6, 0, 0]} animationDuration={800}>
                {participationData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Wins per Player (only if multiplayer data) */}
      {winsData.length > 0 && modeFilter !== "solo" && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
            Wins per Player
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={winsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wins" radius={[6, 6, 0, 0]} animationDuration={800}
                onMouseEnter={(d) => setHoveredBar(d.name)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {winsData.map((entry, i) => (
                  <Cell key={i} fill={entry.color}
                    opacity={hoveredBar && hoveredBar !== entry.name ? 0.3 : 1}
                    style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Total Points */}
      {pointsData.length > 0 && modeFilter !== "solo" && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Gem className="w-4 h-4 text-primary" />
            Total Points
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pointsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="points" radius={[6, 6, 0, 0]} animationDuration={800}
                onMouseEnter={(d) => setHoveredBar(d.name)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {pointsData.map((entry, i) => (
                  <Cell key={i} fill={entry.color}
                    opacity={hoveredBar && hoveredBar !== entry.name ? 0.3 : 1}
                    style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Solo Progress */}
      {soloProgressData.length > 0 && modeFilter !== "multiplayer" && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            Solo Sessions Log
          </h3>
          <div className="space-y-2">
            {soloProgressData.slice(-10).map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 text-xs">
                <span className="text-muted-foreground font-mono">{entry.session}</span>
                <span className="font-semibold text-foreground flex-1 truncate">{entry.game}</span>
                <span className="text-muted-foreground">{entry.player}</span>
                <span className="text-muted-foreground tabular-nums">{new Date(entry.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {filteredSessions.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">No data matches the selected filters</p>
        </div>
      )}
    </div>
  );
}
