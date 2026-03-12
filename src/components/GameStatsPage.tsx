import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, Users, Trophy, Calendar, Crown, TrendingUp, Target } from "lucide-react";
import { Player, GameSession, isSoloSession } from "@/lib/types";
import { getGameTheme } from "@/lib/gameThemes";
import { getPlayerStats } from "@/lib/store";
import { isImageAvatar } from "@/lib/avatarOptions";
import { useCountUp } from "@/hooks/useCountUp";
import { RankBadge } from "@/components/RankBadge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

interface GameStatsPageProps {
  gameName: string;
  players: Player[];
  sessions: GameSession[];
  onBack: () => void;
}

export function GameStatsPage({ gameName, players, sessions, onBack }: GameStatsPageProps) {
  const theme = getGameTheme(gameName);

  const gameSessions = useMemo(
    () => sessions.filter(s => s.gameName === gameName).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [sessions, gameName]
  );

  const multiplayerSessions = useMemo(() => gameSessions.filter(s => !isSoloSession(s)), [gameSessions]);

  const participatingPlayers = useMemo(() => {
    const ids = new Set<string>();
    gameSessions.forEach(s => s.results.forEach(r => ids.add(r.playerId)));
    return players.filter(p => ids.has(p.id));
  }, [gameSessions, players]);

  const leaderboard = useMemo(() => {
    const stats = getPlayerStats(participatingPlayers, multiplayerSessions);
    return [...stats].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  }, [participatingPlayers, multiplayerSessions]);

  const sessionsOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    gameSessions.forEach(s => {
      const month = s.date.substring(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      sessions: count,
    }));
  }, [gameSessions]);

  const recentSessions = useMemo(
    () => [...gameSessions].reverse().slice(0, 10),
    [gameSessions]
  );

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Overview</span>
      </button>

      {/* Game Header with banner */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-border overflow-hidden"
      >
        <div className="relative h-40 overflow-hidden">
          <img src={theme.image} alt={gameName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{gameName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{theme.category} • {theme.description}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border bg-card">
          <div className="p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground"><AnimatedNumber value={gameSessions.length} /></p>
            <p className="text-[10px] text-muted-foreground">Sessions</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground"><AnimatedNumber value={participatingPlayers.length} /></p>
            <p className="text-[10px] text-muted-foreground">Players</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">
              <AnimatedNumber value={multiplayerSessions.filter(s => s.results.some(r => r.isWinner)).length} />
            </p>
            <p className="text-[10px] text-muted-foreground">Matches</p>
          </div>
        </div>
      </motion.div>

      {/* Performance Chart */}
      {sessionsOverTime.length > 1 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-bold text-foreground">Sessions Over Time</p>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionsOverTime}>
                <defs>
                  <linearGradient id="gameGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" fill="url(#gameGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && leaderboard[0].wins > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
            <p className="text-xs font-bold text-foreground">Leaderboard</p>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2rem_2rem_1fr_3.5rem_3.5rem] gap-2 px-3 py-2 border-b border-border text-[10px] text-muted-foreground font-semibold">
              <span>#</span>
              <span></span>
              <span>Player</span>
              <span className="text-center">Wins</span>
              <span className="text-center">Win %</span>
            </div>
            {leaderboard.map((ps, i) => (
              <div
                key={ps.player.id}
                className={`grid grid-cols-[2rem_2rem_1fr_3.5rem_3.5rem] gap-2 items-center px-3 py-2.5 border-b border-border/50 last:border-0 ${
                  i === 0 ? "leaderboard-gold" : i === 1 ? "leaderboard-silver" : i === 2 ? "leaderboard-bronze" : ""
                }`}
              >
                <div className="flex items-center justify-center">
                  <RankBadge rank={i + 1} size="sm" />
                </div>
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs overflow-hidden"
                  style={{ backgroundColor: ps.player.color + "18", border: `1.5px solid ${ps.player.color}35` }}
                >
                  {isImageAvatar(ps.player.avatar) ? (
                    <img src={ps.player.avatar} alt={ps.player.name} className="w-full h-full object-cover" />
                  ) : ps.player.avatar}
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{ps.player.name}</p>
                <p className="text-xs font-bold text-foreground text-center">{ps.wins}</p>
                <p className="text-xs text-muted-foreground text-center">{Math.round(ps.winRate)}%</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Players */}
      {participatingPlayers.length > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-bold text-foreground">Players ({participatingPlayers.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {participatingPlayers.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs overflow-hidden"
                  style={{ backgroundColor: p.color + "18", border: `1.5px solid ${p.color}35` }}
                >
                  {isImageAvatar(p.avatar) ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : p.avatar}
                </div>
                <span className="text-xs font-semibold text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* History */}
      {recentSessions.length > 0 && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <p className="text-xs font-bold text-foreground">Session History</p>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
            {recentSessions.map((session, i) => {
              const winner = session.results.find(r => r.isWinner);
              const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
              const solo = isSoloSession(session);
              const sessionPlayers = session.results
                .map(r => players.find(p => p.id === r.playerId))
                .filter(Boolean) as Player[];

              return (
                <div key={session.id} className="px-3 py-3 flex items-center gap-3">
                  <div className="text-[10px] text-muted-foreground w-16 shrink-0">
                    {new Date(session.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div className="flex -space-x-1.5 shrink-0">
                    {sessionPlayers.slice(0, 4).map(p => (
                      <div
                        key={p.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-card overflow-hidden"
                        style={{ backgroundColor: p.color + "30" }}
                        title={p.name}
                      >
                        {isImageAvatar(p.avatar) ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : p.avatar}
                      </div>
                    ))}
                    {sessionPlayers.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] text-muted-foreground border-2 border-card">
                        +{sessionPlayers.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{session.name}</p>
                  </div>
                  {solo ? (
                    <span className="text-[10px] font-medium text-accent shrink-0">Solo</span>
                  ) : winnerPlayer ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Crown className="w-3 h-3 text-[hsl(var(--gold))]" />
                      <span className="text-[11px] font-semibold text-foreground">{winnerPlayer.name}</span>
                      {winner && winner.score > 0 && (
                        <span className="text-[10px] text-muted-foreground">({winner.score}pts)</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground shrink-0">No winner</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {gameSessions.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">No sessions recorded for this game yet.</p>
        </motion.div>
      )}
    </div>
  );
}
