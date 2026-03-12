import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Users, Crown, Calendar, Medal, TrendingUp, Target, Zap, Star, BarChart3, Flame, User } from "lucide-react";
import { Player, GameSession, PlayerStats, isSoloSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme } from "@/lib/gameThemes";
import { isImageAvatar } from "@/lib/avatarOptions";
import { useCountUp } from "@/hooks/useCountUp";
import { RankBadge } from "@/components/RankBadge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

// ─── Helpers ────────────────────────────────
function getWinStreak(players: Player[], sessions: GameSession[]): { player: Player | null; streak: number } {
  if (sessions.length === 0 || players.length === 0) return { player: null, streak: 0 };
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentWinnerId: string | null = null;
  let streak = 0;
  for (const session of sorted) {
    const winner = session.results.find(r => r.isWinner);
    if (!winner) break;
    if (currentWinnerId === null) { currentWinnerId = winner.playerId; streak = 1; }
    else if (winner.playerId === currentWinnerId) streak++;
    else break;
  }
  return { player: players.find(p => p.id === currentWinnerId) || null, streak };
}

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--game-orange))",
  "hsl(var(--game-pink))", "hsl(var(--game-blue))", "hsl(var(--game-cyan))",
  "hsl(var(--game-purple))", "hsl(var(--game-red))",
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, type: "spring" as const, bounce: 0.3, duration: 0.5 },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.25 + i * 0.1, type: "spring" as const, bounce: 0.2, duration: 0.5 },
  }),
};

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated}{suffix}</>;
}

// ─── Activity Heatmap ──────────────────────────
function ActivityWidget({ sessions }: { sessions: GameSession[] }) {
  const weeks = useMemo(() => {
    const now = new Date();
    const grid: { date: string; count: number; level: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = sessions.filter(s => s.date === dateStr).length;
      grid.push({ date: dateStr, count, level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3 });
    }
    return grid;
  }, [sessions]);

  const levelColors = [
    "bg-secondary",
    "bg-[hsl(var(--accent)/0.4)]",
    "bg-[hsl(var(--accent)/0.7)]",
    "bg-accent",
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent)/0.15)] flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Recent Activity</p>
          <p className="text-[10px] text-muted-foreground">Last 28 days</p>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.02, type: "spring", bounce: 0.4 }}
            className={`w-full aspect-square rounded-sm ${levelColors[day.level]}`}
            title={`${day.date}: ${day.count} sessions`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-muted-foreground mr-1">Less</span>
        {levelColors.map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
}

function MVPWidget({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const mvp = useMemo(() => {
    if (sessions.length < 2 || players.length === 0) return null;
    const recent = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const scores: Record<string, number> = {};
    recent.forEach(s => {
      s.results.forEach(r => {
        scores[r.playerId] = (scores[r.playerId] || 0) + r.score + (r.isWinner ? 10 : 0);
      });
    });
    const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
    const player = players.find(p => p.id === topId);
    const score = topId ? scores[topId] : 0;
    return player ? { player, score } : null;
  }, [players, sessions]);

  if (!mvp) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", bounce: 0.3 }}
      className="rounded-xl border border-[hsl(var(--gold)/0.3)] bg-gradient-to-br from-[hsl(var(--gold)/0.08)] to-[hsl(var(--game-orange)/0.05)] p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold)/0.15)] flex items-center justify-center">
          <Star className="w-5 h-5 text-[hsl(var(--gold))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent MVP</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 overflow-hidden"
              style={{ backgroundColor: mvp.player.color + "20", border: `1.5px solid ${mvp.player.color}40` }}
            >
              {isImageAvatar(mvp.player.avatar) ? (
                <img src={mvp.player.avatar} alt={mvp.player.name} className="w-full h-full object-cover" />
              ) : mvp.player.avatar}
            </div>
            <span className="text-sm font-bold text-foreground truncate">{mvp.player.name}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-display font-bold text-[hsl(var(--gold))]">
            <AnimatedNumber value={mvp.score} />
          </p>
          <p className="text-[10px] text-muted-foreground">points</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Overview ─────────────────────────
export function OverviewTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const multiplayerSessions = sessions.filter(s => !isSoloSession(s));
  const soloSessions = sessions.filter(s => isSoloSession(s));
  const stats = getPlayerStats(players, multiplayerSessions);
  const topPlayer = stats.length > 0 ? stats.reduce((a, b) => a.wins > b.wins ? a : b) : null;
  const winStreak = getWinStreak(players, multiplayerSessions);
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentSession = sortedSessions[0] || null;
  const leaderboard = [...stats].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate).slice(0, 5);

  // Most played game
  const mostPlayedGame = useMemo(() => {
    if (sessions.length === 0) return null;
    const counts: Record<string, number> = {};
    sessions.forEach(s => { counts[s.gameName] = (counts[s.gameName] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], count: top[1] } : null;
  }, [sessions]);

  const statCards = [
    {
      icon: Gamepad2,
      label: "Total Sessions",
      numValue: sessions.length,
      gradient: "from-[hsl(var(--primary)/0.15)] to-[hsl(var(--primary)/0.05)]",
      iconBg: "bg-[hsl(var(--primary)/0.2)]",
      iconColor: "text-primary",
      border: "border-[hsl(var(--primary)/0.2)]",
    },
    {
      icon: Users,
      label: "Multiplayer",
      numValue: multiplayerSessions.length,
      gradient: "from-[hsl(var(--game-blue)/0.15)] to-[hsl(var(--game-cyan)/0.05)]",
      iconBg: "bg-[hsl(var(--game-blue)/0.2)]",
      iconColor: "text-[hsl(var(--game-blue))]",
      border: "border-[hsl(var(--game-blue)/0.2)]",
    },
    {
      icon: User,
      label: "Solo",
      numValue: soloSessions.length,
      gradient: "from-[hsl(var(--accent)/0.15)] to-[hsl(var(--accent)/0.05)]",
      iconBg: "bg-[hsl(var(--accent)/0.2)]",
      iconColor: "text-accent",
      border: "border-[hsl(var(--accent)/0.2)]",
    },
    {
      icon: Flame,
      label: "Win Streak",
      numValue: winStreak.streak,
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
          <h2 className="text-2xl font-display font-bold text-foreground">Overview</h2>
          <p className="text-muted-foreground text-sm mt-1">Your group's activity at a glance</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.3 }} className="text-center py-16">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <Gamepad2 className="w-16 h-16 text-primary/40 mx-auto" />
          </motion.div>
          <h3 className="text-xl font-display font-bold text-foreground mt-4">Welcome to GameNight!</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Start by adding players, then create your first session.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="text-2xl font-display font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Your group's activity at a glance</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 cursor-default`}
          >
            <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div className="text-xl font-display font-bold text-foreground leading-tight">
              <AnimatedNumber value={card.numValue} />
            </div>
            <div className="text-[11px] font-medium text-muted-foreground mt-0.5">{card.label}</div>
            {card.sub && (
              <div className="text-[10px] text-muted-foreground/70 mt-0.5">{card.sub}</div>
            )}
            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br from-foreground/[0.03] to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* Most Played Game & Players Count */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-bold text-foreground">Quick Stats</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground">
                <AnimatedNumber value={players.length} />
              </p>
              <p className="text-[10px] text-muted-foreground">Players</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-foreground truncate">
                {mostPlayedGame ? mostPlayedGame.name : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Most Played</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-primary">
                <AnimatedNumber value={new Set(sessions.map(s => s.gameName)).size} />
              </p>
              <p className="text-[10px] text-muted-foreground">Games</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MVP Widget */}
      <MVPWidget players={players} sessions={sessions} />

      {/* Activity Heatmap */}
      {sessions.length > 0 && (
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
          <ActivityWidget sessions={sessions} />
        </motion.div>
      )}

      {/* Recent Session */}
      {recentSession && (
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <h3 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Recent Sessions
          </h3>
          <RecentSessionCard session={recentSession} players={players} />
        </motion.div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && leaderboard[0].wins > 0 && (
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
          <h3 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Medal className="w-4 h-4 text-[hsl(var(--gold))]" />
            Leaderboard
          </h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {leaderboard.map((ps, i) => (
              <LeaderboardRow key={ps.player.id} stats={ps} rank={i + 1} sessions={sessions} index={i} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Recent Session Card ────────────────────
function RecentSessionCard({ session, players }: { session: GameSession; players: Player[] }) {
  const theme = getGameTheme(session.gameName);
  const winner = session.results.find(r => r.isWinner);
  const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
  const sortedResults = [...session.results].sort((a, b) => b.score - a.score);
  const solo = isSoloSession(session);

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}08, ${theme.secondaryColor}05)` }}>
      <div className="p-4 pb-3 flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: `${theme.primaryColor}18`, border: `1.5px solid ${theme.primaryColor}30` }}
        >
          <div className="w-full h-full relative">
            <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
          </div>
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground truncate">{session.name}</p>
          <p className="text-[11px] text-muted-foreground">{session.gameName} · {new Date(session.date).toLocaleDateString()}</p>
        </div>
        {solo ? (
          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">Solo</span>
        ) : winnerPlayer ? (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
            className="flex items-center gap-1.5 bg-[hsl(var(--gold)/0.12)] px-2.5 py-1 rounded-lg shrink-0"
          >
            <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
            <span className="text-xs font-bold text-foreground">{winnerPlayer.name}</span>
          </motion.div>
        ) : null}
      </div>
      <div className="px-4 pb-4">
        <div className="space-y-1.5">
          {sortedResults.map((r, i) => {
            const p = players.find(pl => pl.id === r.playerId);
            if (!p) return null;
            return (
              <motion.div
                key={r.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${r.isWinner ? "bg-[hsl(var(--gold)/0.08)]" : "bg-card/50"}`}
              >
                {!solo && <span className="w-5 text-center"><RankBadge rank={i + 1} size="sm" /></span>}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 overflow-hidden" style={{ backgroundColor: p.color + "20", border: `1.5px solid ${p.color}40` }}>
                  {isImageAvatar(p.avatar) ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : p.avatar}
                </div>
                <span className="font-semibold text-foreground flex-1 truncate">{p.name}</span>
                {!solo && (
                  <span className="font-bold text-muted-foreground tabular-nums">
                    <AnimatedNumber value={r.score} /> pts
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Row ────────────────────────
function LeaderboardRow({ stats, rank, sessions, index }: { stats: PlayerStats; rank: number; sessions: GameSession[]; index: number }) {
  const rowClass = rank === 1 ? "leaderboard-gold" : rank === 2 ? "leaderboard-silver" : rank === 3 ? "leaderboard-bronze" : "";
  const gamesWon = new Set(sessions.filter(s => s.results.some(r => r.playerId === stats.player.id && r.isWinner)).map(s => s.gameName)).size;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.08, type: "spring", bounce: 0.2 }}
      className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${rowClass}`}
    >
      <div className="w-6 text-center flex items-center justify-center">
        <RankBadge rank={rank} size="md" />
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 overflow-hidden" style={{ backgroundColor: stats.player.color + "18", border: `1.5px solid ${stats.player.color}35` }}>
        {isImageAvatar(stats.player.avatar) ? <img src={stats.player.avatar} alt={stats.player.name} className="w-full h-full object-cover" /> : stats.player.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{stats.player.name}</p>
        <p className="text-[10px] text-muted-foreground">{gamesWon} {gamesWon === 1 ? "game" : "games"} won</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground"><AnimatedNumber value={stats.wins} />W</p>
        <p className="text-[10px] text-muted-foreground"><AnimatedNumber value={Math.round(stats.winRate)} />%</p>
      </div>
    </motion.div>
  );
}
