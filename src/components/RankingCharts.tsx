import { useState, useMemo } from "react";
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
type SortKey = "wins" | "winRate" | "totalPoints" | "gamesPlayed";

export function RankingTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [gameFilter, setGameFilter] = useState<string>("all");

  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));
  const filteredSessions = (gameFilter === "all" ? sessions : sessions.filter(s => s.gameName === gameFilter)).filter(s => !isSoloSession(s));
  const stats = getPlayerStats(players, filteredSessions);

  const sorted = [...stats].sort((a, b) => {
    const diff = a[sortBy] - b[sortBy];
    return sortDir === "desc" ? -diff : diff;
  });

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
              <SelectTrigger className="w-[160px] h-9 rounded-lg text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                  <SelectValue placeholder="Global" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-1.5 font-bold">Global</span>
                </SelectItem>
                {uniqueGames.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {sorted.length > 0 && (
            <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs" onClick={() => exportToCSV(players, sessions, "leaderboard")}>
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {sorted.map((ps, i) => (
                <motion.tr
                  key={ps.player.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${getRowClass(i)}`}
                >
                  <td className="p-3">
                    {sortDir === "desc" ? <RankBadge rank={i + 1} size="sm" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                  </td>
                  <td className="p-3"><PlayerBadge player={ps.player} size="sm" /></td>
                  <td className="p-3 text-right font-semibold">{ps.gamesPlayed}</td>
                  <td className="p-3 text-right font-semibold">{ps.wins}</td>
                  <td className="p-3 text-right font-semibold">{ps.winRate.toFixed(0)}%</td>
                  <td className="p-3 text-right font-semibold">{ps.totalPoints}</td>
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
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));

  // Apply filters
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Mode filter
    if (modeFilter === "multiplayer") result = result.filter(s => !isSoloSession(s));
    else if (modeFilter === "solo") result = result.filter(s => isSoloSession(s));

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
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
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

      {/* Most Played Games */}
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
