import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Calendar, TrendingUp, Flame, Target, ChevronRight, BarChart3, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, Settings2, Crown, Crosshair, Medal, Lightbulb, Gamepad2 } from "lucide-react";
import { Player, GameSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme, GAME_THEMES, getCategoryColor, getCategoryEmoji } from "@/lib/gameThemes";
import { PlayerBadge } from "@/components/PlayerBadge";
import { useI18n } from "@/lib/i18n";
import { useGames, useStatDefinitions, useGameResultStats } from "@/lib/gameStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

interface GamesTabProps {
  players: Player[];
  sessions: GameSession[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-2.5 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export function GamesTab({ players, sessions }: GamesTabProps) {
  const { t } = useI18n();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-foreground">{t("games.title")}</h2>
        <p className="text-muted-foreground text-xs mt-0.5">{t("games.subtitle")}</p>
      </div>

      {gamesPlayed.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" style={{ color: "hsl(var(--game-orange))" }} />
            {t("games.yourGames")}
          </h3>
          <div className="space-y-2">
            {gamesPlayed.map((game, i) => (
              <motion.button
                key={game.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedGame(game.name)}
                className="game-card w-full text-left !p-0 overflow-hidden"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-stretch">
                  <div className="w-16 h-16 shrink-0 relative overflow-hidden">
                    <img src={game.theme.image} alt={game.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: game.theme.gradient, opacity: 0.3 }} />
                  </div>
                  <div className="flex-1 p-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{game.theme.emoji}</span>
                        <span className="font-bold text-sm text-foreground">{game.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{game.count} {game.count !== 1 ? t("sessions.sessionPlural") : t("sessions.session")}</span>
                        <span
                          className="px-1 py-px rounded-full font-bold"
                          style={{ backgroundColor: getCategoryColor(game.theme.category) + "22", color: getCategoryColor(game.theme.category) }}
                        >
                          {getCategoryEmoji(game.theme.category)} {game.theme.category}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" style={{ color: "hsl(var(--game-purple))" }} />
          {gamesPlayed.length > 0 ? t("games.discoverMore") : t("games.popularGames")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {allGames.filter(g => g.count === 0).map((game, i) => (
            <motion.button
              key={game.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedGame(game.name)}
              className="game-card !p-0 overflow-hidden text-left"
              whileTap={{ scale: 0.96 }}
            >
              <div className="relative h-20 overflow-hidden">
                <img src={game.theme.image} alt={game.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1">
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
          <div className="text-4xl mb-2">🎮</div>
          <p className="text-muted-foreground font-semibold text-sm">{t("games.noSessions")}</p>
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
  const { t } = useI18n();
  const theme = getGameTheme(gameName);
  const gameSessions = sessions.filter(s => s.gameName === gameName);
  const gameStats = getPlayerStats(players, gameSessions);
  const activePlayers = gameStats.filter(s => s.gamesPlayed > 0);
  const [activeChart, setActiveChart] = useState<"wins" | "performance" | "radar" | "history" | "custom" | "advanced">("wins");
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [statsManagementOpen, setStatsManagementOpen] = useState(false);

  // Stat definitions management
  const { games } = useGames();
  const gameRecord = games.find(g => g.name.toLowerCase() === gameName.toLowerCase());
  const gameId = gameRecord?.id || null;
  const { statDefs, addStatDefinition, updateStatDefinition, deleteStatDefinition } = useStatDefinitions(gameId);
  const sessionIds = gameSessions.map(s => s.id);
  const { data: advancedStats, loading: advancedLoading } = useGameResultStats(gameId, sessionIds);
  const hasAdvancedStats = advancedStats.length > 0;

  // New stat form
  const [showNewStat, setShowNewStat] = useState(false);
  const [newStatLabel, setNewStatLabel] = useState("");
  const [newStatType, setNewStatType] = useState("number");
  const [newStatOptions, setNewStatOptions] = useState("");
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const handleAddStat = async () => {
    if (!newStatLabel.trim()) return;
    const options = newStatType === "select" && newStatOptions.trim()
      ? newStatOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined;
    await addStatDefinition({
      statKey: newStatLabel.trim().toLowerCase().replace(/\s+/g, "_"),
      label: newStatLabel.trim(),
      type: newStatType,
      options,
    });
    setShowNewStat(false);
    setNewStatLabel("");
    setNewStatType("number");
    setNewStatOptions("");
  };

  const handleSaveEditStat = async (id: string) => {
    if (!editLabel.trim()) return;
    await updateStatDefinition(id, { label: editLabel.trim() });
    setEditingStatId(null);
    setEditLabel("");
  };

  const topPlayer = activePlayers.length > 0 ? activePlayers.reduce((a, b) => a.wins > b.wins ? a : b) : null;

  const winDistribution = activePlayers
    .filter(s => s.wins > 0)
    .map(s => ({ name: s.player.name, value: s.wins, color: s.player.color }));

  const scoreHistory = gameSessions.map((s, i) => {
    const entry: Record<string, any> = { session: `#${i + 1}`, name: s.name };
    s.results.forEach(r => {
      const p = players.find(pl => pl.id === r.playerId);
      if (p) entry[p.name] = r.score;
    });
    return entry;
  });

  const radarData = useMemo(() => {
    if (activePlayers.length === 0) return [];
    const maxWins = Math.max(...activePlayers.map(s => s.wins), 1);
    const maxGames = Math.max(...activePlayers.map(s => s.gamesPlayed), 1);
    const maxPoints = Math.max(...activePlayers.map(s => s.totalPoints), 1);

    return [
      { stat: t("stat.wins"), ...Object.fromEntries(activePlayers.map(s => [s.player.name, (s.wins / maxWins) * 100])) },
      { stat: t("stat.games"), ...Object.fromEntries(activePlayers.map(s => [s.player.name, (s.gamesPlayed / maxGames) * 100])) },
      { stat: t("stat.points"), ...Object.fromEntries(activePlayers.map(s => [s.player.name, (s.totalPoints / maxPoints) * 100])) },
      { stat: t("stat.winRate"), ...Object.fromEntries(activePlayers.map(s => [s.player.name, s.winRate])) },
      { stat: t("stat.avgScore"), ...Object.fromEntries(activePlayers.map(s => [s.player.name, s.gamesPlayed > 0 ? ((s.totalPoints / s.gamesPlayed) / (maxPoints / maxGames)) * 100 : 0])) },
    ];
  }, [activePlayers, t]);

  const performanceData = activePlayers.map(s => ({
    name: s.player.name,
    avgScore: s.gamesPlayed > 0 ? Math.round(s.totalPoints / s.gamesPlayed) : 0,
    color: s.player.color,
  })).sort((a, b) => b.avgScore - a.avgScore);

  const aggregatedCustomStats = useMemo(() => {
    const result: Record<string, Record<string, { total: number; count: number; values: string[] }>> = {};
    gameSessions.forEach(s => {
      if (!s.customStats) return;
      Object.entries(s.customStats).forEach(([pid, stats]) => {
        if (!result[pid]) result[pid] = {};
        Object.entries(stats).forEach(([key, value]) => {
          if (!result[pid][key]) result[pid][key] = { total: 0, count: 0, values: [] };
          const numVal = Number(value);
          if (!isNaN(numVal) && value !== "") {
            result[pid][key].total += numVal;
            result[pid][key].count++;
          } else if (typeof value === "string" && value) {
            result[pid][key].values.push(value);
          }
        });
      });
    });
    return result;
  }, [gameSessions]);

  const hasCustomStats = Object.keys(aggregatedCustomStats).length > 0;

  const chartTabs = [
    { id: "wins" as const, label: t("chart.wins"), emoji: "🏆" },
    { id: "performance" as const, label: t("chart.avg"), emoji: "📊" },
    { id: "radar" as const, label: t("chart.radar"), emoji: "🎯" },
    { id: "history" as const, label: t("chart.history"), emoji: "📈" },
    ...(hasCustomStats ? [{ id: "custom" as const, label: t("chart.stats"), emoji: theme.emoji }] : []),
    ...(hasAdvancedStats ? [{ id: "advanced" as const, label: t("chart.advanced"), emoji: "📋" }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <img src={theme.image} alt={theme.name} className="w-full h-36 object-cover" />
        <div className="absolute inset-0" style={{ background: `${theme.gradient}`, opacity: 0.5 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-2.5 left-2.5 bg-card/80 backdrop-blur-sm rounded-xl p-1.5 text-foreground active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2.5 left-3 right-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.emoji}</span>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">{theme.name}</h2>
              <p className="text-[10px] text-muted-foreground">{theme.description}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Calendar, label: t("dashboard.sessions"), value: gameSessions.length, color: theme.primaryColor },
          { icon: Users, label: t("dashboard.players"), value: activePlayers.length, color: theme.secondaryColor },
          { icon: Trophy, label: "Champion", value: topPlayer?.player.name || "—", color: theme.primaryColor },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="stat-card !p-2.5"
          >
            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            <span className="text-base font-extrabold text-foreground truncate max-w-full">{stat.value}</span>
            <span className="text-[9px] font-semibold text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Stat Definitions Management */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Collapsible open={statsManagementOpen} onOpenChange={setStatsManagementOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors">
              <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                {t("sessions.advancedStats")}
              </span>
              {statsManagementOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
              {/* Theme hints */}
              {theme.customStats.length > 0 && (
                <div className="game-card !p-3" style={{ borderColor: theme.primaryColor + "33" }}>
                  <h4 className="font-bold text-foreground text-[10px] mb-1.5 flex items-center gap-1">
                    <span>💡</span> {t("games.trackStats")}
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {theme.customStats.map(stat => (
                      <div key={stat.key} className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1">
                        <span className="text-sm">{stat.emoji}</span>
                        <span className="text-[10px] font-semibold text-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing stat definitions */}
              {statDefs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t("games.customStats")}
                  </p>
                  {statDefs.map(sd => (
                    <div key={sd.id} className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
                      {editingStatId === sd.id ? (
                        <>
                          <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="rounded-lg h-7 text-xs flex-1" />
                          <button onClick={() => handleSaveEditStat(sd.id)} className="text-primary p-1 active:scale-90"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingStatId(null)} className="text-muted-foreground p-1 active:scale-90"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-foreground">{sd.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-1.5">({sd.type})</span>
                          </div>
                          <button onClick={() => { setEditingStatId(sd.id); setEditLabel(sd.label); }} className="text-muted-foreground hover:text-primary p-1 active:scale-90"><Edit3 className="w-3 h-3" /></button>
                          <button onClick={() => deleteStatDefinition(sd.id)} className="text-muted-foreground hover:text-destructive p-1 active:scale-90"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new stat */}
              {gameId && (
                <div className="border-t border-border pt-2">
                  {!showNewStat ? (
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs w-full" onClick={() => setShowNewStat(true)}>
                      <Plus className="w-3 h-3" /> {t("sessions.addCustomStat")}
                    </Button>
                  ) : (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                      <Input value={newStatLabel} onChange={e => setNewStatLabel(e.target.value)} placeholder="Label (e.g. Blue Shells)" className="rounded-lg h-8 text-xs" />
                      <Select value={newStatType} onValueChange={setNewStatType}>
                        <SelectTrigger className="rounded-lg h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                      {newStatType === "select" && (
                        <Input value={newStatOptions} onChange={e => setNewStatOptions(e.target.value)} placeholder="Options (comma separated)" className="rounded-lg h-8 text-xs" />
                      )}
                      <div className="flex gap-1.5">
                        <Button size="sm" className="rounded-lg h-8 text-xs flex-1" onClick={handleAddStat} disabled={!newStatLabel.trim()}>
                          <Check className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" onClick={() => setShowNewStat(false)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {!gameId && (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  Play a session of this game first to add custom stats.
                </p>
              )}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Charts */}
      {gameSessions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
          <div className="text-4xl mb-2">{theme.emoji}</div>
          <p className="text-muted-foreground font-semibold text-sm">{t("games.noSessionsYet")} {theme.name}.</p>
          <p className="text-[10px] text-muted-foreground mt-1">{t("games.createSession")}</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-1 mb-3 overflow-x-auto pb-0.5 scrollbar-hide">
              {chartTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChart(tab.id)}
                  className={`flex items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap active:scale-95 ${
                    activeChart === tab.id
                      ? "text-primary-foreground shadow-md"
                      : "bg-secondary text-muted-foreground"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="game-card !p-3"
              >
                {activeChart === "wins" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs">🏆 {t("games.winDistribution")}</h3>
                    {winDistribution.length > 0 ? (
                      <div className="flex gap-3">
                        <ResponsiveContainer width="50%" height={160}>
                          <PieChart>
                            <Pie
                              data={winDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={4}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={800}
                              onMouseEnter={(_, i) => setHoveredPlayer(winDistribution[i]?.name)}
                              onMouseLeave={() => setHoveredPlayer(null)}
                            >
                              {winDistribution.map((entry, i) => (
                                <Cell
                                  key={i}
                                  fill={entry.color}
                                  stroke="hsl(var(--card))"
                                  strokeWidth={2}
                                  opacity={hoveredPlayer && hoveredPlayer !== entry.name ? 0.4 : 1}
                                  style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 flex flex-col justify-center space-y-1.5">
                          {winDistribution.map(entry => (
                            <motion.div
                              key={entry.name}
                              className="flex items-center gap-1.5 cursor-pointer rounded-lg px-1.5 py-0.5"
                              onHoverStart={() => setHoveredPlayer(entry.name)}
                              onHoverEnd={() => setHoveredPlayer(null)}
                              animate={{ opacity: hoveredPlayer && hoveredPlayer !== entry.name ? 0.4 : 1 }}
                            >
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="text-[10px] font-semibold text-foreground flex-1">{entry.name}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">{entry.value}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">{t("common.noWinnersYet")}</p>
                    )}
                  </>
                )}

                {activeChart === "performance" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs">📊 {t("games.avgScore")}</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} animationDuration={800}
                          onMouseEnter={(data) => setHoveredPlayer(data.name)}
                          onMouseLeave={() => setHoveredPlayer(null)}
                        >
                          {performanceData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.color}
                              opacity={hoveredPlayer && hoveredPlayer !== entry.name ? 0.4 : 1}
                              style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {activeChart === "radar" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs">🎯 {t("games.playerComparison")}</h3>
                    {radarData.length > 0 && activePlayers.length <= 6 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={false} domain={[0, 100]} />
                          {activePlayers.map((s) => (
                            <Radar
                              key={s.player.id}
                              name={s.player.name}
                              dataKey={s.player.name}
                              stroke={s.player.color}
                              fill={s.player.color}
                              fillOpacity={hoveredPlayer === s.player.name ? 0.35 : 0.12}
                              strokeWidth={hoveredPlayer === s.player.name ? 3 : 1.5}
                              animationDuration={800}
                              style={{ transition: "all 0.2s" }}
                            />
                          ))}
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {activePlayers.length > 6 ? t("common.radarTooMany") : t("common.playMore")}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5 justify-center">
                      {activePlayers.map(s => (
                        <motion.div
                          key={s.player.id}
                          onHoverStart={() => setHoveredPlayer(s.player.name)}
                          onHoverEnd={() => setHoveredPlayer(null)}
                          className="cursor-pointer"
                        >
                          <PlayerBadge player={s.player} size="sm" />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {activeChart === "history" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs">📈 {t("games.scoreHistory")}</h3>
                    {scoreHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={scoreHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="session" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          {activePlayers.map((s) => (
                            <Area
                              key={s.player.id}
                              type="monotone"
                              dataKey={s.player.name}
                              stroke={s.player.color}
                              fill={s.player.color}
                              fillOpacity={hoveredPlayer === s.player.name ? 0.3 : 0.08}
                              strokeWidth={hoveredPlayer === s.player.name ? 3 : 1.5}
                              animationDuration={800}
                              style={{ transition: "all 0.2s" }}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">{t("common.recordSessions")}</p>
                    )}
                  </>
                )}

                {activeChart === "custom" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs">{theme.emoji} {theme.name} {t("games.customStats")}</h3>
                    <div className="space-y-2.5">
                      {Object.entries(aggregatedCustomStats).map(([pid, stats]) => {
                        const p = players.find(pl => pl.id === pid);
                        if (!p) return null;
                        const entries = Object.entries(stats).filter(([, v]) => v.count > 0 || v.values.length > 0);
                        if (entries.length === 0) return null;
                        return (
                          <motion.div
                            key={pid}
                            className="bg-secondary/50 rounded-xl p-2.5"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <PlayerBadge player={p} size="sm" />
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              {entries.map(([key, data]) => {
                                const statDef = theme.customStats.find(s => s.key === key);
                                return (
                                  <div key={key} className="text-[10px]">
                                    <span className="text-muted-foreground">{statDef?.emoji} {statDef?.label}</span>
                                    <p className="font-bold text-foreground">
                                      {data.count > 0 ? `Total: ${data.total}` : data.values.join(", ")}
                                      {data.count > 1 && <span className="text-muted-foreground font-normal"> (avg: {(data.total / data.count).toFixed(1)})</span>}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeChart === "advanced" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-primary" />
                      {t("chart.advancedTitle")}
                    </h3>
                    {advancedLoading ? (
                      <p className="text-xs text-muted-foreground text-center py-4">{t("common.loading")}</p>
                    ) : (
                      <div className="space-y-3">
                        {advancedStats.map(({ playerId, stats: pStats }) => {
                          const p = players.find(pl => pl.id === playerId);
                          if (!p || pStats.length === 0) return null;
                          return (
                            <motion.div
                              key={playerId}
                              className="bg-secondary/50 rounded-xl p-2.5"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <PlayerBadge player={p} size="sm" />
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                                {pStats.map(st => (
                                  <div key={st.statKey} className="text-[10px]">
                                    <span className="text-muted-foreground font-medium">{st.label}</span>
                                    {st.textValues.length > 0 ? (
                                      <p className="font-bold text-foreground truncate">{st.textValues.join(", ")}</p>
                                    ) : st.type === "boolean" ? (
                                      <p className="font-bold text-foreground">
                                        {st.total}/{st.count} ✓
                                        <span className="text-muted-foreground font-normal ml-1">({(st.avg * 100).toFixed(0)}%)</span>
                                      </p>
                                    ) : (
                                      <p className="font-bold text-foreground">
                                        {t("chart.total")}: {Number.isInteger(st.total) ? st.total : st.total.toFixed(1)}
                                        {st.count > 1 && (
                                          <span className="text-muted-foreground font-normal ml-1">
                                            ({t("chart.avg")}: {st.avg.toFixed(1)})
                                          </span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="game-card !p-0 overflow-hidden"
          >
            <div className="p-3 pb-1.5" style={{ background: theme.gradient, opacity: 0.9 }}>
              <h3 className="font-bold text-xs" style={{ color: "white" }}>
                🏅 {theme.name} {t("games.leaderboard")}
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-[10px] border-b border-border">
                  <th className="text-left p-2.5">#</th>
                  <th className="text-left p-2.5">{t("ranking.player")}</th>
                  <th className="text-right p-2.5">W</th>
                  <th className="text-right p-2.5">L</th>
                  <th className="text-right p-2.5">Win%</th>
                  <th className="text-right p-2.5">🏅</th>
                </tr>
              </thead>
              <tbody>
                {activePlayers
                  .sort((a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints)
                  .map((ps, i) => (
                    <tr key={ps.player.id} className="border-b border-border/50 last:border-0">
                      <td className="p-2.5 font-extrabold text-muted-foreground text-[10px]">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="p-2.5"><PlayerBadge player={ps.player} size="sm" /></td>
                      <td className="p-2.5 text-right font-bold">{ps.wins}</td>
                      <td className="p-2.5 text-right font-bold text-muted-foreground">{ps.losses}</td>
                      <td className="p-2.5 text-right font-bold">{ps.winRate.toFixed(0)}%</td>
                      <td className="p-2.5 text-right font-bold">{ps.podiums}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </motion.div>

          {/* Session History */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-bold text-foreground mb-2 text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
              {t("games.sessionHistory")}
            </h3>
            <div className="space-y-1.5">
              {[...gameSessions].reverse().map(session => {
                const winner = session.results.find(r => r.isWinner);
                const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
                return (
                  <motion.div key={session.id} className="game-card !p-2.5" whileTap={{ scale: 0.98 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-foreground">{session.name}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                      </div>
                      {winnerPlayer && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                          style={{ backgroundColor: winnerPlayer.color + "22", color: winnerPlayer.color }}>
                          🏆 {winnerPlayer.name}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
