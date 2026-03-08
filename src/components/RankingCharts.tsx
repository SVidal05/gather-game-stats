import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Player, GameSession, PlayerStats } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { PlayerBadge } from "@/components/PlayerBadge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CHART_COLORS = [
  "hsl(262, 80%, 55%)", "hsl(210, 90%, 55%)", "hsl(162, 60%, 45%)",
  "hsl(28, 90%, 55%)", "hsl(330, 80%, 58%)", "hsl(45, 95%, 55%)",
  "hsl(0, 72%, 55%)", "hsl(185, 70%, 45%)",
];

// ─── Ranking Tab ──────────────────────────────────
type SortKey = "wins" | "winRate" | "totalPoints" | "gamesPlayed";

export function RankingTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const stats = getPlayerStats(players, sessions);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Ranking</h2>
        <p className="text-muted-foreground text-sm mt-1">Leaderboard across all games</p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-muted-foreground font-semibold">Play some games to see rankings!</p>
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
                  <span className="inline-flex items-center gap-1">Points <SortIcon field="totalPoints" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ps, i) => (
                <motion.tr
                  key={ps.player.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="p-3 font-extrabold text-muted-foreground">
                    {i === 0 && sortDir === "desc" ? "🥇" : i === 1 && sortDir === "desc" ? "🥈" : i === 2 && sortDir === "desc" ? "🥉" : i + 1}
                  </td>
                  <td className="p-3"><PlayerBadge player={ps.player} size="sm" /></td>
                  <td className="p-3 text-right font-bold">{ps.gamesPlayed}</td>
                  <td className="p-3 text-right font-bold">{ps.wins}</td>
                  <td className="p-3 text-right font-bold">{ps.winRate.toFixed(0)}%</td>
                  <td className="p-3 text-right font-bold">{ps.totalPoints}</td>
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
export function ChartsTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const [gameFilter, setGameFilter] = useState<string>("all");
  const stats = getPlayerStats(players, sessions);
  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));

  const filteredSessions = gameFilter === "all" ? sessions : sessions.filter(s => s.gameName === gameFilter);
  const filteredStats = getPlayerStats(players, filteredSessions);

  // Wins per player
  const winsData = filteredStats
    .filter(s => s.gamesPlayed > 0)
    .sort((a, b) => b.wins - a.wins)
    .map(s => ({ name: s.player.name, wins: s.wins, color: s.player.color }));

  // Sessions over time
  const sessionsByMonth: Record<string, number> = {};
  filteredSessions.forEach(s => {
    const month = new Date(s.date).toLocaleDateString("en", { year: "2-digit", month: "short" });
    sessionsByMonth[month] = (sessionsByMonth[month] || 0) + 1;
  });
  const timeData = Object.entries(sessionsByMonth).map(([month, count]) => ({ month, sessions: count }));

  // Points per player
  const pointsData = filteredStats
    .filter(s => s.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map(s => ({ name: s.player.name, points: s.totalPoints, color: s.player.color }));

  if (players.length === 0 || sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-foreground">Charts</h2>
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-muted-foreground font-semibold">Play some games to see charts!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Charts</h2>
          <p className="text-muted-foreground text-sm mt-1">Visual statistics</p>
        </div>
        {uniqueGames.length > 1 && (
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              {uniqueGames.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {winsData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="game-card">
          <h3 className="font-bold text-foreground mb-4">🏆 Wins per Player</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={winsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="wins" radius={[8, 8, 0, 0]}>
                {winsData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {timeData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card">
          <h3 className="font-bold text-foreground mb-4">📅 Sessions Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {pointsData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="game-card">
          <h3 className="font-bold text-foreground mb-4">💎 Total Points</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pointsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="points" radius={[8, 8, 0, 0]}>
                {pointsData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
