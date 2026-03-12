import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronUp, Download, Trophy, BarChart3, Calendar, Gem } from "lucide-react";
import { Player, GameSession, isSoloSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { PlayerBadge } from "@/components/PlayerBadge";
import { RankBadge } from "@/components/RankBadge";
import { useI18n } from "@/lib/i18n";
import { exportToCSV } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGameTheme } from "@/lib/gameThemes";

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

// ─── Ranking Tab ──────────────────────────────────
type SortKey = "wins" | "winRate" | "totalPoints" | "gamesPlayed";

export function RankingTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [gameFilter, setGameFilter] = useState<string>("all");

  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));
  const filteredSessions = gameFilter === "all" ? sessions : sessions.filter(s => s.gameName === gameFilter);
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
          <h2 className="text-2xl font-display font-bold text-foreground">{t("ranking.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t("ranking.subtitle")}</p>
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
          <p className="text-muted-foreground font-medium text-sm">{t("ranking.noRanking")}</p>
        </div>
      ) : (
        <div className="game-card overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">{t("ranking.player")}</th>
                <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("gamesPlayed")}>
                  <span className="inline-flex items-center gap-1">{t("ranking.games")} <SortIcon field="gamesPlayed" /></span>
                </th>
                <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort("wins")}>
                  <span className="inline-flex items-center gap-1">{t("ranking.wins")} <SortIcon field="wins" /></span>
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
export function ChartsTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const { t } = useI18n();
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const uniqueGames = Array.from(new Set(sessions.map(s => s.gameName)));

  const filteredSessions = gameFilter === "all" ? sessions : sessions.filter(s => s.gameName === gameFilter);
  const filteredStats = getPlayerStats(players, filteredSessions);

  const winsData = filteredStats
    .filter(s => s.gamesPlayed > 0)
    .sort((a, b) => b.wins - a.wins)
    .map(s => ({ name: s.player.name, wins: s.wins, color: s.player.color }));

  const sessionsByMonth: Record<string, number> = {};
  filteredSessions.forEach(s => {
    const month = new Date(s.date).toLocaleDateString("en", { year: "2-digit", month: "short" });
    sessionsByMonth[month] = (sessionsByMonth[month] || 0) + 1;
  });
  const timeData = Object.entries(sessionsByMonth).map(([month, count]) => ({ month, sessions: count }));

  const pointsData = filteredStats
    .filter(s => s.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map(s => ({ name: s.player.name, points: s.totalPoints, color: s.player.color }));

  if (players.length === 0 || sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground">{t("charts.title")}</h2>
        <div className="text-center py-12">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">{t("charts.noCharts")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">{t("charts.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t("charts.subtitle")}</p>
        </div>
        {uniqueGames.length > 1 && (
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="w-36 rounded-lg h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("charts.allGames")}</SelectItem>
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
        )}
      </div>

      {winsData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
            {t("charts.winsPerPlayer")}
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

      {timeData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {t("charts.sessionsOverTime")}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {pointsData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="game-card !p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Gem className="w-4 h-4 text-primary" />
            {t("charts.totalPoints")}
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
    </div>
  );
}
