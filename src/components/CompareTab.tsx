import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GitCompareArrows, TrendingUp, Swords, BarChart3, Radar as RadarIcon, Users } from "lucide-react";
import { Player, GameSession, PlayerStats, isSoloSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PlayerBadge } from "@/components/PlayerBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import { isImageAvatar } from "@/lib/avatarOptions";
import { Checkbox } from "@/components/ui/checkbox";

interface CompareTabProps {
  players: Player[];
  sessions: GameSession[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

function PlayerAvatarDisplay({ player, className = "" }: { player: Player; className?: string }) {
  return (
    <div
      className={`rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ backgroundColor: player.color + "20", border: `2px solid ${player.color}40` }}
    >
      {isImageAvatar(player.avatar) ? (
        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg">{player.avatar}</span>
      )}
    </div>
  );
}

// ─── Multi-Player Radar Compare ─────────────────
function MultiRadarCompare({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const stats = useMemo(() => getPlayerStats(players, sessions.filter(s => !isSoloSession(s))), [players, sessions]);

  const togglePlayer = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 6 ? prev : [...prev, id]
    );
  };

  const selectedStats = useMemo(() => stats.filter(s => selectedIds.includes(s.player.id)), [stats, selectedIds]);

  // Normalize values to 0-100 for radar
  const radarData = useMemo(() => {
    if (selectedStats.length === 0) return [];

    const maxGames = Math.max(...selectedStats.map(s => s.gamesPlayed), 1);
    const maxWins = Math.max(...selectedStats.map(s => s.wins), 1);
    const maxPoints = Math.max(...selectedStats.map(s => s.totalPoints), 1);
    const maxPodiums = Math.max(...selectedStats.map(s => s.podiums), 1);
    const maxAvg = Math.max(...selectedStats.map(s => s.gamesPlayed > 0 ? s.totalPoints / s.gamesPlayed : 0), 1);

    const axes = [
      { axis: "Games", key: "games" },
      { axis: "Wins", key: "wins" },
      { axis: "Win %", key: "winRate" },
      { axis: "Points", key: "points" },
      { axis: "Avg Pts", key: "avgPts" },
      { axis: "Podiums", key: "podiums" },
    ];

    return axes.map(({ axis, key }) => {
      const entry: Record<string, any> = { axis };
      selectedStats.forEach(s => {
        let val = 0;
        if (key === "games") val = (s.gamesPlayed / maxGames) * 100;
        else if (key === "wins") val = (s.wins / maxWins) * 100;
        else if (key === "winRate") val = s.winRate;
        else if (key === "points") val = (s.totalPoints / maxPoints) * 100;
        else if (key === "avgPts") val = ((s.gamesPlayed > 0 ? s.totalPoints / s.gamesPlayed : 0) / maxAvg) * 100;
        else if (key === "podiums") val = (s.podiums / maxPodiums) * 100;
        entry[s.player.id] = Math.round(val);
      });
      return entry;
    });
  }, [selectedStats]);

  const activePlayers = stats.filter(s => s.gamesPlayed > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card !p-4 space-y-4">
      <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
        <RadarIcon className="w-4 h-4 text-primary" /> Multi-Player Radar
      </h3>
      <p className="text-xs text-muted-foreground">Select up to 6 players to compare on a radar chart</p>

      {/* Player chips */}
      <div className="flex flex-wrap gap-2">
        {activePlayers.map(ps => {
          const selected = selectedIds.includes(ps.player.id);
          return (
            <button
              key={ps.player.id}
              onClick={() => togglePlayer(ps.player.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selected
                  ? "border-primary/50 bg-primary/10 text-foreground shadow-sm"
                  : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: ps.player.color, opacity: selected ? 1 : 0.4 }}
              />
              {ps.player.name}
            </button>
          );
        })}
      </div>

      {/* Radar */}
      {selectedStats.length >= 2 ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            {selectedStats.map(s => (
              <Radar
                key={s.player.id}
                name={s.player.name}
                dataKey={s.player.id}
                stroke={s.player.color}
                fill={s.player.color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value: string) => (
                <span className="text-foreground text-xs font-medium">{value}</span>
              )}
            />
            <Tooltip content={<RadarTooltip selectedStats={selectedStats} />} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-8">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Select at least 2 players</p>
        </div>
      )}
    </motion.div>
  );
}

function RadarTooltip({ active, payload, label, selectedStats }: any & { selectedStats: PlayerStats[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => {
        const ps = selectedStats?.find((s: PlayerStats) => s.player.id === entry.dataKey);
        return (
          <p key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{ps?.player.name || entry.name}:</span>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </p>
        );
      })}
    </div>
  );
}

// ─── Main Compare Tab ─────────────────────────
export function CompareTab({ players, sessions }: CompareTabProps) {
  const { t } = useI18n();
  const [player1Id, setPlayer1Id] = useState<string>("");
  const [player2Id, setPlayer2Id] = useState<string>("");

  const stats = getPlayerStats(players, sessions.filter(s => !isSoloSession(s)));
  const p1Stats = stats.find(s => s.player.id === player1Id);
  const p2Stats = stats.find(s => s.player.id === player2Id);

  const headToHead = useMemo(() => {
    if (!player1Id || !player2Id) return { p1Wins: 0, p2Wins: 0, draws: 0 };
    let p1Wins = 0, p2Wins = 0, draws = 0;
    sessions.forEach(session => {
      const r1 = session.results.find(r => r.playerId === player1Id);
      const r2 = session.results.find(r => r.playerId === player2Id);
      if (!r1 || !r2) return;
      if (r1.isWinner && !r2.isWinner) p1Wins++;
      else if (r2.isWinner && !r1.isWinner) p2Wins++;
      else if (r1.isWinner && r2.isWinner) draws++;
    });
    return { p1Wins, p2Wins, draws };
  }, [player1Id, player2Id, sessions]);

  const comparisonData = useMemo(() => {
    if (!p1Stats || !p2Stats) return [];
    return [
      { stat: t("ranking.games"), [p1Stats.player.name]: p1Stats.gamesPlayed, [p2Stats.player.name]: p2Stats.gamesPlayed },
      { stat: t("ranking.wins"), [p1Stats.player.name]: p1Stats.wins, [p2Stats.player.name]: p2Stats.wins },
      { stat: "Win%", [p1Stats.player.name]: Math.round(p1Stats.winRate), [p2Stats.player.name]: Math.round(p2Stats.winRate) },
      { stat: "Points", [p1Stats.player.name]: p1Stats.totalPoints, [p2Stats.player.name]: p2Stats.totalPoints },
    ];
  }, [p1Stats, p2Stats, t]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <GitCompareArrows className="w-6 h-6 text-primary" /> Compare
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Side-by-side player comparison</p>
      </div>

      {/* Multi-Player Radar */}
      <MultiRadarCompare players={players} sessions={sessions} />

      {/* 1v1 Section */}
      <div className="pt-2">
        <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-4">
          <Swords className="w-5 h-5 text-primary" /> 1 vs 1
        </h3>

        {/* Player Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Player 1</label>
            <Select value={player1Id} onValueChange={setPlayer1Id}>
              <SelectTrigger className="rounded-lg mt-1 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {players.filter(p => p.id !== player2Id).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Player 2</label>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger className="rounded-lg mt-1 h-11"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {players.filter(p => p.id !== player1Id).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {p1Stats && p2Stats && (
        <>
          {/* Head to Head */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card !p-5">
            <h3 className="text-sm font-display font-semibold text-foreground text-center mb-4 flex items-center justify-center gap-2">
              <Swords className="w-4 h-4 text-primary" /> Head to Head
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <PlayerAvatarDisplay player={p1Stats.player} className="w-12 h-12 mx-auto" />
                <p className="text-sm font-semibold text-foreground mt-2">{p1Stats.player.name}</p>
                <p className="text-3xl font-display font-bold mt-2" style={{ color: p1Stats.player.color }}>{headToHead.p1Wins}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground font-semibold">VS</p>
                {headToHead.draws > 0 && <p className="text-xs text-muted-foreground mt-1">{headToHead.draws} draws</p>}
              </div>
              <div>
                <PlayerAvatarDisplay player={p2Stats.player} className="w-12 h-12 mx-auto" />
                <p className="text-sm font-semibold text-foreground mt-2">{p2Stats.player.name}</p>
                <p className="text-3xl font-display font-bold mt-2" style={{ color: p2Stats.player.color }}>{headToHead.p2Wins}</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Comparison */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="game-card space-y-3">
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Stats
            </h3>
            {[
              { label: t("ranking.games"), v1: p1Stats.gamesPlayed, v2: p2Stats.gamesPlayed },
              { label: t("ranking.wins"), v1: p1Stats.wins, v2: p2Stats.wins },
              { label: "Win Rate", v1: `${p1Stats.winRate.toFixed(0)}%`, v2: `${p2Stats.winRate.toFixed(0)}%` },
              { label: "Total Points", v1: p1Stats.totalPoints, v2: p2Stats.totalPoints },
              { label: "Avg Points", v1: p1Stats.gamesPlayed > 0 ? (p1Stats.totalPoints / p1Stats.gamesPlayed).toFixed(1) : "0", v2: p2Stats.gamesPlayed > 0 ? (p2Stats.totalPoints / p2Stats.gamesPlayed).toFixed(1) : "0" },
            ].map((row, i) => {
              const n1 = typeof row.v1 === "number" ? row.v1 : parseFloat(String(row.v1));
              const n2 = typeof row.v2 === "number" ? row.v2 : parseFloat(String(row.v2));
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`flex-1 text-right text-sm font-semibold ${n1 > n2 ? "text-foreground" : "text-muted-foreground"}`}>{row.v1}</span>
                  <span className="text-xs text-muted-foreground font-medium w-24 text-center bg-secondary rounded-md px-2 py-1">{row.label}</span>
                  <span className={`flex-1 text-left text-sm font-semibold ${n2 > n1 ? "text-foreground" : "text-muted-foreground"}`}>{row.v2}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Comparison Chart */}
          {comparisonData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card !p-4">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Comparison
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="stat" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={p1Stats.player.name} fill={p1Stats.player.color} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={p2Stats.player.name} fill={p2Stats.player.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}

      {(!player1Id || !player2Id) && (
        <div className="text-center py-8">
          <Swords className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">Select two players above to compare 1v1</p>
        </div>
      )}
    </div>
  );
}
