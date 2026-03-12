import { useMemo } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Users, Crown, Calendar, Medal, Target, Zap, Star, User, Trophy, TrendingUp } from "lucide-react";
import { Player, GameSession, PlayerStats, isSoloSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme } from "@/lib/gameThemes";
import { isImageAvatar } from "@/lib/avatarOptions";
import { useCountUp } from "@/hooks/useCountUp";
import { RankBadge } from "@/components/RankBadge";

// ─── Helpers ────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated}{suffix}</>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, type: "spring" as const, bounce: 0.25, duration: 0.45 },
  }),
};

// ─── Metric Card (compact) ──────────────────
function MetricCard({ icon: Icon, label, value, iconClass, delay }: {
  icon: React.ElementType; label: string; value: number; iconClass: string; delay: number;
}) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-display font-bold text-foreground leading-none">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Game Spotlight ─────────────────────────
function GameSpotlight({ sessions, players, onGameClick }: { sessions: GameSession[]; players: Player[]; onGameClick?: (gameName: string) => void }) {
  const spotlight = useMemo(() => {
    if (sessions.length === 0) return null;
    const counts: Record<string, { count: number; playerIds: Set<string> }> = {};
    sessions.forEach(s => {
      if (!counts[s.gameName]) counts[s.gameName] = { count: 0, playerIds: new Set() };
      counts[s.gameName].count++;
      s.results.forEach(r => counts[s.gameName].playerIds.add(r.playerId));
    });
    const top = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)[0];
    if (!top) return null;
    const theme = getGameTheme(top[0]);
    return { name: top[0], count: top[1].count, playerCount: top[1].playerIds.size, theme };
  }, [sessions]);

  if (!spotlight) return null;

  return (
    <motion.div
      custom={1}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => onGameClick?.(spotlight.name)}
    >
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={spotlight.theme.image}
          alt={spotlight.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Most Played</p>
            <h3 className="text-xl font-display font-bold text-foreground">{spotlight.name}</h3>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-right">
              <p className="text-lg font-display font-bold text-foreground leading-none">
                <AnimatedNumber value={spotlight.count} />
              </p>
              <p className="text-[10px] text-muted-foreground">sessions</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-display font-bold text-foreground leading-none">
                <AnimatedNumber value={spotlight.playerCount} />
              </p>
              <p className="text-[10px] text-muted-foreground">players</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Top Player ─────────────────────────────
function TopPlayerWidget({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const topPlayer = useMemo(() => {
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
    return player ? { player, score: scores[topId!] } : null;
  }, [players, sessions]);

  if (!topPlayer) return null;

  return (
    <motion.div
      custom={2}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-[hsl(var(--gold)/0.25)] bg-gradient-to-r from-[hsl(var(--gold)/0.06)] to-transparent p-3 flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-[hsl(var(--gold)/0.15)] flex items-center justify-center shrink-0">
        <Star className="w-4.5 h-4.5 text-[hsl(var(--gold))]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Player</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 overflow-hidden"
            style={{ backgroundColor: topPlayer.player.color + "20", border: `1.5px solid ${topPlayer.player.color}40` }}
          >
            {isImageAvatar(topPlayer.player.avatar) ? (
              <img src={topPlayer.player.avatar} alt={topPlayer.player.name} className="w-full h-full object-cover" />
            ) : topPlayer.player.avatar}
          </div>
          <span className="text-sm font-bold text-foreground truncate">{topPlayer.player.name}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-display font-bold text-[hsl(var(--gold))]">
          <AnimatedNumber value={topPlayer.score} />
        </p>
        <p className="text-[10px] text-muted-foreground">pts</p>
      </div>
    </motion.div>
  );
}

// ─── Activity Heatmap ──────────────────────────
function ActivityHeatmap({ sessions }: { sessions: GameSession[] }) {
  const grid = useMemo(() => {
    const now = new Date();
    const result: { date: string; count: number; level: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = sessions.filter(s => s.date === dateStr).length;
      result.push({ date: dateStr, count, level: count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3 });
    }
    return result;
  }, [sessions]);

  const levelColors = [
    "bg-secondary",
    "bg-[hsl(var(--accent)/0.4)]",
    "bg-[hsl(var(--accent)/0.7)]",
    "bg-accent",
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-accent" />
        <p className="text-xs font-bold text-foreground">Activity</p>
        <span className="text-[10px] text-muted-foreground ml-auto">Last 28 days</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.015, type: "spring", bounce: 0.3 }}
            className={`w-full aspect-square rounded-sm ${levelColors[day.level]}`}
            title={`${day.date}: ${day.count} sessions`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1 mt-1.5 justify-end">
        <span className="text-[9px] text-muted-foreground mr-1">Less</span>
        {levelColors.map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
}

// ─── Recent Sessions List ───────────────────
function RecentSessionsList({ sessions, players }: { sessions: GameSession[]; players: Player[] }) {
  const recent = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3),
    [sessions]
  );

  if (recent.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-bold text-foreground">Recent Sessions</p>
      </div>
      <div className="space-y-1.5">
        {recent.map((session, i) => {
          const theme = getGameTheme(session.gameName);
          const winner = session.results.find(r => r.isWinner);
          const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
          const solo = isSoloSession(session);

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: `${theme.primaryColor}15` }}
              >
                <img src={theme.image} alt={session.gameName} className="w-full h-full object-cover rounded-md" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{session.gameName}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
              </div>
              {solo ? (
                <span className="text-[10px] font-medium text-accent">Solo</span>
              ) : winnerPlayer ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Crown className="w-3 h-3 text-[hsl(var(--gold))]" />
                  <span className="text-[11px] font-semibold text-foreground">{winnerPlayer.name}</span>
                </div>
              ) : null}
            </motion.div>
          );
        })}
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
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.06, type: "spring", bounce: 0.2 }}
      className={`flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 ${rowClass}`}
    >
      <div className="w-5 flex items-center justify-center">
        <RankBadge rank={rank} size="sm" />
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 overflow-hidden"
        style={{ backgroundColor: stats.player.color + "18", border: `1.5px solid ${stats.player.color}35` }}
      >
        {isImageAvatar(stats.player.avatar) ? (
          <img src={stats.player.avatar} alt={stats.player.name} className="w-full h-full object-cover" />
        ) : stats.player.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{stats.player.name}</p>
        <p className="text-[10px] text-muted-foreground">{gamesWon} {gamesWon === 1 ? "game" : "games"} won</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground"><AnimatedNumber value={stats.wins} />W</p>
        <p className="text-[10px] text-muted-foreground"><AnimatedNumber value={Math.round(stats.winRate)} />%</p>
      </div>
    </motion.div>
  );
}

// ─── Main Overview ─────────────────────────
export function OverviewTab({ players, sessions, onGameClick }: { players: Player[]; sessions: GameSession[]; onGameClick?: (gameName: string) => void }) {
  const multiplayerSessions = sessions.filter(s => !isSoloSession(s));
  const soloSessions = sessions.filter(s => isSoloSession(s));
  const stats = getPlayerStats(players, multiplayerSessions);
  const leaderboard = [...stats].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate).slice(0, 5);
  const uniqueGames = new Set(sessions.map(s => s.gameName)).size;

  // Empty state
  if (sessions.length === 0 && players.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Overview</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Your group's activity at a glance</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.3 }} className="text-center py-16">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <Gamepad2 className="w-14 h-14 text-primary/40 mx-auto" />
          </motion.div>
          <h3 className="text-lg font-display font-bold text-foreground mt-4">Welcome to GameNight!</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Start by adding players, then create your first session.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
        <h2 className="text-xl font-display font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Your group's activity at a glance</p>
      </motion.div>

      {/* 1. Group Summary — 4 compact metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard icon={Gamepad2} label="Sessions" value={sessions.length} iconClass="bg-[hsl(var(--primary)/0.15)] text-primary" delay={0} />
        <MetricCard icon={Users} label="Players" value={players.length} iconClass="bg-[hsl(var(--game-blue)/0.15)] text-[hsl(var(--game-blue))]" delay={1} />
        <MetricCard icon={Target} label="Games" value={uniqueGames} iconClass="bg-[hsl(var(--accent)/0.15)] text-accent" delay={2} />
        <MetricCard icon={User} label="Solo" value={soloSessions.length} iconClass="bg-[hsl(var(--game-purple)/0.15)] text-[hsl(var(--game-purple))]" delay={3} />
      </div>

      {/* 2. Game Spotlight */}
      <GameSpotlight sessions={sessions} players={players} onGameClick={onGameClick} />

      {/* 3. Top Player */}
      <TopPlayerWidget players={players} sessions={sessions} />

      {/* 4. Leaderboard */}
      {leaderboard.length > 0 && leaderboard[0].wins > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-2">
            <Medal className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
            <p className="text-xs font-bold text-foreground">Leaderboard</p>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {leaderboard.map((ps, i) => (
              <LeaderboardRow key={ps.player.id} stats={ps} rank={i + 1} sessions={sessions} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* 5. Activity section */}
      {sessions.length > 0 && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border bg-card p-4 space-y-5">
          <ActivityHeatmap sessions={sessions} />
          <RecentSessionsList sessions={sessions} players={players} />
        </motion.div>
      )}
    </div>
  );
}
