import { motion } from "framer-motion";
import { Trophy, Gamepad2, Users, Flame, Crown, Calendar, Medal, TrendingUp } from "lucide-react";
import { Player, GameSession, PlayerStats } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme } from "@/lib/gameThemes";
import { PlayerBadge } from "@/components/PlayerBadge";
import { isImageAvatar } from "@/lib/avatarOptions";
import { useI18n } from "@/lib/i18n";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

function getWinStreak(players: Player[], sessions: GameSession[]): { player: Player | null; streak: number } {
  if (sessions.length === 0 || players.length === 0) return { player: null, streak: 0 };
  
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentWinnerId: string | null = null;
  let streak = 0;

  for (const session of sorted) {
    const winner = session.results.find(r => r.isWinner);
    if (!winner) break;
    if (currentWinnerId === null) {
      currentWinnerId = winner.playerId;
      streak = 1;
    } else if (winner.playerId === currentWinnerId) {
      streak++;
    } else {
      break;
    }
  }

  const player = players.find(p => p.id === currentWinnerId) || null;
  return { player, streak };
}

function getSessionChartData(sessions: GameSession[], players: Player[]) {
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted.slice(-8).map((s, i) => {
    const winners = s.results.filter(r => r.isWinner).length;
    const theme = getGameTheme(s.gameName);
    return {
      name: s.gameName.length > 8 ? s.gameName.slice(0, 8) + "…" : s.gameName,
      wins: winners,
      players: s.results.length,
      color: theme.primaryColor,
      emoji: theme.emoji,
    };
  });
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--game-orange))",
  "hsl(var(--game-pink))",
  "hsl(var(--game-blue))",
  "hsl(var(--game-cyan))",
  "hsl(var(--game-purple))",
  "hsl(var(--game-red))",
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, type: "spring" as const, bounce: 0.3, duration: 0.5 },
  }),
};

export function DashboardTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const { t } = useI18n();
  const stats = getPlayerStats(players, sessions);
  const topPlayer = stats.length > 0 ? stats.reduce((a, b) => a.wins > b.wins ? a : b) : null;
  const winStreak = getWinStreak(players, sessions);
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentSession = sortedSessions[0] || null;
  const leaderboard = [...stats].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate).slice(0, 5);
  const chartData = getSessionChartData(sessions, players);

  const statCards = [
    {
      icon: Crown,
      label: t("dashboard.topWinner"),
      value: topPlayer && topPlayer.wins > 0 ? (isImageAvatar(topPlayer.player.avatar) ? topPlayer.player.name : topPlayer.player.avatar + " " + topPlayer.player.name) : "—",
      sub: topPlayer && topPlayer.wins > 0 ? `${topPlayer.wins} ${t("dashboard.wins")}` : "",
      gradient: "from-[hsl(var(--game-orange)/0.15)] to-[hsl(var(--game-yellow)/0.08)]",
      iconBg: "bg-[hsl(var(--game-orange)/0.2)]",
      iconColor: "text-[hsl(var(--game-orange))]",
      border: "border-[hsl(var(--game-orange)/0.2)]",
    },
    {
      icon: Gamepad2,
      label: t("dashboard.sessions"),
      value: sessions.length,
      sub: sessions.length === 1 ? "session" : "sessions",
      gradient: "from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)]",
      iconBg: "bg-[hsl(var(--primary)/0.2)]",
      iconColor: "text-primary",
      border: "border-[hsl(var(--primary)/0.2)]",
    },
    {
      icon: Users,
      label: t("dashboard.players"),
      value: players.length,
      sub: players.length === 1 ? "player" : "players",
      gradient: "from-[hsl(var(--game-blue)/0.15)] to-[hsl(var(--game-cyan)/0.05)]",
      iconBg: "bg-[hsl(var(--game-blue)/0.2)]",
      iconColor: "text-[hsl(var(--game-blue))]",
      border: "border-[hsl(var(--game-blue)/0.2)]",
    },
    {
      icon: Flame,
      label: "Win Streak",
      value: winStreak.streak > 0 ? `🔥 ${winStreak.streak}` : "—",
      sub: winStreak.player ? winStreak.player.name : "",
      gradient: "from-[hsl(var(--game-red)/0.15)] to-[hsl(var(--game-orange)/0.05)]",
      iconBg: "bg-[hsl(var(--game-red)/0.2)]",
      iconColor: "text-[hsl(var(--game-red))]",
      border: "border-[hsl(var(--game-red)/0.2)]",
    },
  ];

  // Empty state
  if (sessions.length === 0 && players.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">{t("dashboard.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-6xl mb-4">🎲</div>
          <h3 className="text-xl font-display font-bold text-foreground">{t("dashboard.welcome")}</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{t("dashboard.welcomeMsg")}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4`}
          >
            <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div className="text-xl font-display font-bold text-foreground leading-tight truncate">
              {card.value}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground mt-0.5">{card.label}</div>
            {card.sub && (
              <div className="text-[10px] text-muted-foreground/70 mt-0.5">{card.sub}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Session */}
      {recentSession && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {t("dashboard.recentSessions")}
          </h3>
          <RecentSessionCard session={recentSession} players={players} />
        </motion.div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && leaderboard[0].wins > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Medal className="w-4 h-4 text-[hsl(var(--gold))]" />
            Leaderboard
          </h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {leaderboard.map((ps, i) => (
              <LeaderboardRow key={ps.player.id} stats={ps} rank={i + 1} sessions={sessions} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Players per Session
          </h3>
          <div className="rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <Bar dataKey="players" radius={[6, 6, 0, 0]} name="Players">
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function RecentSessionCard({ session, players }: { session: GameSession; players: Player[] }) {
  const theme = getGameTheme(session.gameName);
  const winner = session.results.find(r => r.isWinner);
  const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
  const sortedResults = [...session.results].sort((a, b) => b.score - a.score);

  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}08, ${theme.secondaryColor}05)` }}
    >
      {/* Header */}
      <div className="p-4 pb-3 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${theme.primaryColor}18`, border: `1.5px solid ${theme.primaryColor}30` }}
        >
          {theme.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground truncate">{session.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {session.gameName} · {new Date(session.date).toLocaleDateString()}
          </p>
        </div>
        {winnerPlayer && (
          <div className="flex items-center gap-1.5 bg-[hsl(var(--gold)/0.12)] px-2.5 py-1 rounded-lg shrink-0">
            <span className="text-sm">👑</span>
            <span className="text-xs font-bold text-foreground">{winnerPlayer.name}</span>
          </div>
        )}
      </div>

      {/* Player Rankings */}
      <div className="px-4 pb-4">
        <div className="space-y-1.5">
          {sortedResults.map((r, i) => {
            const p = players.find(pl => pl.id === r.playerId);
            if (!p) return null;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            return (
              <div
                key={r.playerId}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                  r.isWinner ? "bg-[hsl(var(--gold)/0.08)]" : "bg-card/50"
                }`}
              >
                <span className="w-5 text-center font-bold text-muted-foreground">{medal}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 overflow-hidden"
                  style={{ backgroundColor: p.color + "20", border: `1.5px solid ${p.color}40` }}
                >
                  {isImageAvatar(p.avatar) ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : p.avatar}
                </div>
                <span className="font-semibold text-foreground flex-1 truncate">{p.name}</span>
                <span className="font-bold text-muted-foreground tabular-nums">{r.score} pts</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ stats, rank, sessions }: { stats: PlayerStats; rank: number; sessions: GameSession[] }) {
  const medalColors = ["", "hsl(var(--gold))", "hsl(var(--silver))", "hsl(var(--bronze))"];
  const rowClass = rank === 1 ? "leaderboard-gold" : rank === 2 ? "leaderboard-silver" : rank === 3 ? "leaderboard-bronze" : "";
  
  const gamesWon = new Set(
    sessions
      .filter(s => s.results.some(r => r.playerId === stats.player.id && r.isWinner))
      .map(s => s.gameName)
  ).size;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${rowClass}`}>
      <div className="w-6 text-center">
        {rank <= 3 ? (
          <span className="text-base">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</span>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: stats.player.color + "18", border: `1.5px solid ${stats.player.color}35` }}
      >
        {stats.player.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{stats.player.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {gamesWon} {gamesWon === 1 ? "game" : "games"} won
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{stats.wins}W</p>
        <p className="text-[10px] text-muted-foreground">{stats.winRate.toFixed(0)}%</p>
      </div>
    </div>
  );
}
