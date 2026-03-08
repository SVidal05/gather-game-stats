import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Calendar, TrendingUp, Flame, Target, ChevronRight } from "lucide-react";
import { Player, GameSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme, GAME_THEMES, getCategoryColor, getCategoryEmoji, GameTheme } from "@/lib/gameThemes";
import { PlayerBadge } from "@/components/PlayerBadge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

interface GamesTabProps {
  players: Player[];
  sessions: GameSession[];
}

export function GamesTab({ players, sessions }: GamesTabProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Get unique games played
  const gamesPlayed = useMemo(() => {
    const gameMap = new Map<string, { count: number; lastPlayed: string }>();
    sessions.forEach(s => {
      const existing = gameMap.get(s.gameName);
      if (!existing || s.date > existing.lastPlayed) {
        gameMap.set(s.gameName, {
          count: (existing?.count || 0) + 1,
          lastPlayed: s.date,
        });
      }
    });
    return Array.from(gameMap.entries())
      .map(([name, data]) => ({ name, ...data, theme: getGameTheme(name) }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  // All known games (played + from themes)
  const allGames = useMemo(() => {
    const played = new Set(gamesPlayed.map(g => g.name));
    const unplayed = Object.keys(GAME_THEMES)
      .filter(name => !played.has(name))
      .map(name => ({ name, count: 0, lastPlayed: "", theme: getGameTheme(name) }));
    return [...gamesPlayed, ...unplayed];
  }, [gamesPlayed]);

  if (selectedGame) {
    return (
      <GameDetailView
        gameName={selectedGame}
        players={players}
        sessions={sessions}
        onBack={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Games</h2>
        <p className="text-muted-foreground text-sm mt-1">Explore stats by game type</p>
      </div>

      {/* Games played */}
      {gamesPlayed.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4" style={{ color: "hsl(var(--game-orange))" }} />
            Your Games
          </h3>
          <div className="space-y-3">
            {gamesPlayed.map((game, i) => (
              <motion.button
                key={game.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedGame(game.name)}
                className="game-card w-full text-left !p-0 overflow-hidden"
              >
                <div className="flex items-stretch">
                  <div className="w-20 h-20 shrink-0 relative overflow-hidden">
                    <img src={game.theme.image} alt={game.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: game.theme.gradient, opacity: 0.3 }} />
                  </div>
                  <div className="flex-1 p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{game.theme.emoji}</span>
                        <span className="font-bold text-foreground">{game.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{game.count} session{game.count !== 1 ? "s" : ""}</span>
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: getCategoryColor(game.theme.category) + "22", color: getCategoryColor(game.theme.category) }}
                        >
                          {getCategoryEmoji(game.theme.category)} {game.theme.category}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Discover games */}
      <div>
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: "hsl(var(--game-purple))" }} />
          {gamesPlayed.length > 0 ? "Discover More" : "Popular Games"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {allGames.filter(g => g.count === 0).map((game, i) => (
            <motion.button
              key={game.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedGame(game.name)}
              className="game-card !p-0 overflow-hidden text-left"
            >
              <div className="relative h-24 overflow-hidden">
                <img src={game.theme.image} alt={game.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-bold text-foreground text-sm flex items-center gap-1">
                    {game.theme.emoji} {game.name}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🎮</div>
          <p className="text-muted-foreground font-semibold">Play some games to see detailed stats here!</p>
        </div>
      )}
    </div>
  );
}

// ─── Game Detail View ─────────────────────────────
function GameDetailView({
  gameName, players, sessions, onBack,
}: {
  gameName: string; players: Player[]; sessions: GameSession[]; onBack: () => void;
}) {
  const theme = getGameTheme(gameName);
  const gameSessions = sessions.filter(s => s.gameName === gameName);
  const gameStats = getPlayerStats(players, gameSessions);
  const activePlayers = gameStats.filter(s => s.gamesPlayed > 0);
  const [activeChart, setActiveChart] = useState<"wins" | "performance" | "radar" | "history">("wins");

  // Top player for this game
  const topPlayer = activePlayers.length > 0 ? activePlayers.reduce((a, b) => a.wins > b.wins ? a : b) : null;

  // Win distribution for pie chart
  const winDistribution = activePlayers
    .filter(s => s.wins > 0)
    .map(s => ({ name: s.player.name, value: s.wins, color: s.player.color }));

  // Score progression per session
  const scoreHistory = gameSessions.map((s, i) => {
    const entry: Record<string, any> = { session: `#${i + 1}`, name: s.name };
    s.results.forEach(r => {
      const p = players.find(pl => pl.id === r.playerId);
      if (p) entry[p.name] = r.score;
    });
    return entry;
  });

  // Radar chart data: normalize stats for comparison
  const radarData = useMemo(() => {
    if (activePlayers.length === 0) return [];
    const maxWins = Math.max(...activePlayers.map(s => s.wins), 1);
    const maxGames = Math.max(...activePlayers.map(s => s.gamesPlayed), 1);
    const maxPoints = Math.max(...activePlayers.map(s => s.totalPoints), 1);
    const maxWinRate = 100;

    return [
      { stat: "Wins", ...Object.fromEntries(activePlayers.map(s => [s.player.name, (s.wins / maxWins) * 100])) },
      { stat: "Games", ...Object.fromEntries(activePlayers.map(s => [s.player.name, (s.gamesPlayed / maxGames) * 100])) },
      { stat: "Points", ...Object.fromEntries(activePlayers.map(s => [s.player.name, (s.totalPoints / maxPoints) * 100])) },
      { stat: "Win Rate", ...Object.fromEntries(activePlayers.map(s => [s.player.name, s.winRate])) },
      { stat: "Avg Score", ...Object.fromEntries(activePlayers.map(s => [s.player.name, s.gamesPlayed > 0 ? ((s.totalPoints / s.gamesPlayed) / (maxPoints / maxGames)) * 100 : 0])) },
    ];
  }, [activePlayers]);

  // Average score per player for bar chart
  const performanceData = activePlayers.map(s => ({
    name: s.player.name,
    avgScore: s.gamesPlayed > 0 ? Math.round(s.totalPoints / s.gamesPlayed) : 0,
    color: s.player.color,
  })).sort((a, b) => b.avgScore - a.avgScore);

  const chartTabs = [
    { id: "wins" as const, label: "Wins", emoji: "🏆" },
    { id: "performance" as const, label: "Average", emoji: "📊" },
    { id: "radar" as const, label: "Radar", emoji: "🎯" },
    { id: "history" as const, label: "History", emoji: "📈" },
  ];

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <img src={theme.image} alt={theme.name} className="w-full h-44 object-cover" />
        <div className="absolute inset-0" style={{ background: `${theme.gradient}`, opacity: 0.5 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm rounded-xl p-2 text-foreground hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{theme.emoji}</span>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">{theme.name}</h2>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Calendar, label: "Sessions", value: gameSessions.length, color: theme.primaryColor },
          { icon: Users, label: "Players", value: activePlayers.length, color: theme.secondaryColor },
          { icon: Trophy, label: "Champion", value: topPlayer?.player.name || "—", color: theme.primaryColor },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="stat-card !p-3"
          >
            <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            <span className="text-lg font-extrabold text-foreground truncate max-w-full">{stat.value}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Game-Specific Stats Hints */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="game-card"
        style={{ borderColor: theme.primaryColor + "33" }}
      >
        <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> Track These Stats
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {theme.customStats.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2"
            >
              <span className="text-lg">{stat.emoji}</span>
              <span className="text-xs font-semibold text-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 space-y-1">
          {theme.tips.map((tip, i) => (
            <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
              <span>•</span> {tip}
            </p>
          ))}
        </div>
      </motion.div>

      {/* No data state */}
      {gameSessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="text-5xl mb-3">{theme.emoji}</div>
          <p className="text-muted-foreground font-semibold">No sessions recorded for {theme.name} yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create a session to see detailed charts!</p>
        </motion.div>
      ) : (
        <>
          {/* Interactive Chart Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {chartTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChart(tab.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeChart === tab.id
                      ? "text-primary-foreground shadow-md"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeChart === tab.id ? { background: theme.gradient } : {}}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeChart}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="game-card"
              >
                {activeChart === "wins" && (
                  <>
                    <h3 className="font-bold text-foreground mb-4 text-sm">🏆 Win Distribution</h3>
                    {winDistribution.length > 0 ? (
                      <div className="flex gap-4">
                        <ResponsiveContainer width="50%" height={180}>
                          <PieChart>
                            <Pie
                              data={winDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={800}
                            >
                              {winDistribution.map((entry, i) => (
                                <Cell key={i} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => [`${value} wins`, name]}
                              contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 flex flex-col justify-center space-y-2">
                          {winDistribution.map(entry => (
                            <div key={entry.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="text-xs font-semibold text-foreground flex-1">{entry.name}</span>
                              <span className="text-xs font-bold text-muted-foreground">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No winners recorded yet</p>
                    )}
                  </>
                )}

                {activeChart === "performance" && (
                  <>
                    <h3 className="font-bold text-foreground mb-4 text-sm">📊 Average Score</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                        <Bar dataKey="avgScore" radius={[8, 8, 0, 0]} animationDuration={800}>
                          {performanceData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {activeChart === "radar" && (
                  <>
                    <h3 className="font-bold text-foreground mb-4 text-sm">🎯 Player Comparison</h3>
                    {radarData.length > 0 && activePlayers.length <= 6 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={false} domain={[0, 100]} />
                          {activePlayers.map((s) => (
                            <Radar
                              key={s.player.id}
                              name={s.player.name}
                              dataKey={s.player.name}
                              stroke={s.player.color}
                              fill={s.player.color}
                              fillOpacity={0.15}
                              strokeWidth={2}
                              animationDuration={800}
                            />
                          ))}
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {activePlayers.length > 6 ? "Radar works best with 6 or fewer players" : "Play more to see radar charts"}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                      {activePlayers.map(s => (
                        <PlayerBadge key={s.player.id} player={s.player} size="sm" />
                      ))}
                    </div>
                  </>
                )}

                {activeChart === "history" && (
                  <>
                    <h3 className="font-bold text-foreground mb-4 text-sm">📈 Score History</h3>
                    {scoreHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={scoreHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="session" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                          {activePlayers.map((s) => (
                            <Area
                              key={s.player.id}
                              type="monotone"
                              dataKey={s.player.name}
                              stroke={s.player.color}
                              fill={s.player.color}
                              fillOpacity={0.1}
                              strokeWidth={2}
                              animationDuration={800}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">Record sessions to see score history</p>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Player Rankings for this game */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="game-card !p-0 overflow-hidden"
          >
            <div className="p-4 pb-2" style={{ background: theme.gradient, opacity: 0.9 }}>
              <h3 className="font-bold text-sm" style={{ color: "white" }}>
                🏅 {theme.name} Leaderboard
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Player</th>
                  <th className="text-right p-3">W</th>
                  <th className="text-right p-3">Win%</th>
                  <th className="text-right p-3">Pts</th>
                </tr>
              </thead>
              <tbody>
                {activePlayers
                  .sort((a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints)
                  .map((ps, i) => (
                    <tr key={ps.player.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 font-extrabold text-muted-foreground">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="p-3"><PlayerBadge player={ps.player} size="sm" /></td>
                      <td className="p-3 text-right font-bold">{ps.wins}</td>
                      <td className="p-3 text-right font-bold">{ps.winRate.toFixed(0)}%</td>
                      <td className="p-3 text-right font-bold">{ps.totalPoints}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </motion.div>

          {/* Session History for this game */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: theme.primaryColor }} />
              Session History
            </h3>
            <div className="space-y-2">
              {[...gameSessions].reverse().map(session => {
                const winner = session.results.find(r => r.isWinner);
                const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
                return (
                  <div key={session.id} className="game-card !p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-foreground">{session.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                      </div>
                      {winnerPlayer && (
                        <span className="text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"
                          style={{ backgroundColor: winnerPlayer.color + "22", color: winnerPlayer.color }}>
                          🏆 {winnerPlayer.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
