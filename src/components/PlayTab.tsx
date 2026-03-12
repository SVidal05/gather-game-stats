import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Calendar, TrendingUp, Flame, Target, ChevronRight, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, Settings2, Crown, BarChart3, Crosshair, FileText, Gamepad2, Medal, User } from "lucide-react";
import { Player, GameSession, PlayerResult, POPULAR_GAMES, KNOWN_GAMES } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme, GAME_THEMES, getCategoryColor, getCategoryEmoji } from "@/lib/gameThemes";
import { PlayerBadge } from "@/components/PlayerBadge";
import { isImageAvatar } from "@/lib/avatarOptions";
import { useI18n } from "@/lib/i18n";
import { useGames, useStatDefinitions, saveResultStats, useGameResultStats, GameMode, searchGameArtwork } from "@/lib/gameStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import confetti from "canvas-confetti";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

interface PlayTabProps {
  players: Player[];
  sessions: GameSession[];
  onAddSession: (s: Omit<GameSession, "id" | "createdAt">) => Promise<{ sessionId: string; resultIds: Record<string, string> } | null>;
  onRemoveSession: (id: string) => void;
  onUpdateSession: (id: string, updates: Partial<GameSession>) => void;
}

function PlayerAvatar({ player, className = "" }: { player: Player; className?: string }) {
  const isImage = isImageAvatar(player.avatar);
  return isImage ? (
    <img src={player.avatar} alt={player.name} className={`object-cover rounded-lg ${className}`} />
  ) : (
    <span>{player.avatar}</span>
  );
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

type View = "catalog" | "detail" | "history";

export function PlayTab({ players, sessions, onAddSession, onRemoveSession, onUpdateSession }: PlayTabProps) {
  const { t } = useI18n();
  const [view, setView] = useState<View>("catalog");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [preselectedGame, setPreselectedGame] = useState("");

  // Session form state
  const [sessionName, setSessionName] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("multiplayer");
  const [gameInputFocused, setGameInputFocused] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [winnerId, setWinnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [customStats, setCustomStats] = useState<Record<string, Record<string, string | number>>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isSolo = gameMode === "solo";

  // Games & stat definitions integration
  const { games, findOrCreateGame } = useGames();
  const [artworkPreviewByName, setArtworkPreviewByName] = useState<Record<string, { backgroundImage: string | null; coverImage: string | null }>>({});

  const selectedGameDef = useMemo(() => {
    const found = games.find(g => g.name.toLowerCase() === gameName.toLowerCase());
    return found || null;
  }, [games, gameName]);

  const gameSuggestions = useMemo(() => {
    const query = gameName.toLowerCase().trim();
    const allNames = new Map<string, string>();

    games.forEach(g => allNames.set(g.name.toLowerCase(), g.name));
    POPULAR_GAMES.forEach(g => {
      if (!allNames.has(g.toLowerCase())) allNames.set(g.toLowerCase(), g);
    });
    KNOWN_GAMES.forEach(g => {
      if (!allNames.has(g.toLowerCase())) allNames.set(g.toLowerCase(), g);
    });

    return Array.from(allNames.values())
      .filter(name => {
        if (query.length === 0) return true;
        return name.toLowerCase().includes(query) && name.toLowerCase() !== query;
      })
      .slice(0, 8);
  }, [games, gameName]);

  // Auto-set game mode from DB game when selecting an existing game
  useEffect(() => {
    if (selectedGameDef) {
      setGameMode(selectedGameDef.gameMode);
    }
  }, [selectedGameDef]);

  // Fetch artwork preview for typed game names that are not yet in DB
  useEffect(() => {
    const trimmedName = gameName.trim();
    if (!trimmedName) return;

    const key = trimmedName.toLowerCase();
    const dbGame = games.find(g => g.name.toLowerCase() === key);
    if (dbGame?.backgroundImage || dbGame?.coverImage || artworkPreviewByName[key]) return;

    let cancelled = false;
    searchGameArtwork(trimmedName).then((artwork) => {
      if (cancelled || (!artwork.backgroundImage && !artwork.coverImage)) return;
      setArtworkPreviewByName(prev => (prev[key] ? prev : { ...prev, [key]: artwork }));
    });

    return () => {
      cancelled = true;
    };
  }, [gameName, games, artworkPreviewByName]);

  // Prefetch artwork for visible suggestions to show artwork before first save
  useEffect(() => {
    if (!gameInputFocused || gameSuggestions.length === 0) return;

    const toPrefetch = gameSuggestions.filter(name => {
      const key = name.toLowerCase();
      const dbGame = games.find(g => g.name.toLowerCase() === key);
      return !dbGame?.backgroundImage && !dbGame?.coverImage && !artworkPreviewByName[key];
    });

    if (toPrefetch.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const suggestionName of toPrefetch) {
        const artwork = await searchGameArtwork(suggestionName);
        if (cancelled) return;
        if (!artwork.backgroundImage && !artwork.coverImage) continue;

        const key = suggestionName.toLowerCase();
        setArtworkPreviewByName(prev => (prev[key] ? prev : { ...prev, [key]: artwork }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameInputFocused, gameSuggestions, games, artworkPreviewByName]);

  const { statDefs, addStatDefinition } = useStatDefinitions(selectedGameDef?.id || null);

  // Advanced stat values: playerId -> statDefId -> value
  const [advancedStats, setAdvancedStats] = useState<Record<string, Record<string, any>>>({});

  // New custom stat creation
  const [showNewStat, setShowNewStat] = useState(false);
  const [newStatKey, setNewStatKey] = useState("");
  const [newStatLabel, setNewStatLabel] = useState("");
  const [newStatType, setNewStatType] = useState("number");
  const [newStatOptions, setNewStatOptions] = useState("");

  const currentTheme = gameName ? getGameTheme(gameName) : null;

  // Reset advanced stats when game or players change
  useEffect(() => {
    setAdvancedStats({});
  }, [gameName, selectedPlayerIds.length]);

  const gamesPlayed = useMemo(() => {
    const gameMap = new Map<string, { count: number; lastPlayed: string }>();
    sessions.forEach(s => {
      const existing = gameMap.get(s.gameName);
      if (!existing || s.date > existing.lastPlayed) {
        gameMap.set(s.gameName, { count: (existing?.count || 0) + 1, lastPlayed: s.date });
      }
    });
    return Array.from(gameMap.entries())
      .map(([name, data]) => {
        const dbGame = games.find(g => g.name.toLowerCase() === name.toLowerCase());
        return { name, ...data, theme: getGameTheme(name), dbGame };
      })
      .sort((a, b) => b.count - a.count);
  }, [sessions, games]);

  const allGames = useMemo(() => {
    const played = new Set(gamesPlayed.map(g => g.name));
    const unplayed = Object.keys(GAME_THEMES)
      .filter(name => !played.has(name))
      .map(name => ({
        name,
        count: 0,
        lastPlayed: "",
        theme: getGameTheme(name),
        dbGame: games.find(g => g.name.toLowerCase() === name.toLowerCase()) || null,
      }));
    return [...gamesPlayed, ...unplayed];
  }, [gamesPlayed, games]);

  const openNewSession = (game?: string) => {
    resetForm();
    if (game) {
      setGameName(game);
      setPreselectedGame(game);
    }
    setSessionDialogOpen(true);
  };

  const openGameDetail = (game: string) => {
    setSelectedGame(game);
    setView("detail");
  };

  const handleAdvancedStat = (playerId: string, statDefId: string, value: any) => {
    setAdvancedStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [statDefId]: value },
    }));
  };

  const handleCustomStat = (playerId: string, statKey: string, value: string | number) => {
    setCustomStats(prev => ({ ...prev, [playerId]: { ...(prev[playerId] || {}), [statKey]: value } }));
  };

  const handleAdd = async () => {
    if (!sessionName.trim() || !gameName.trim()) return;
    if (isSolo && selectedPlayerIds.length !== 1) return;
    if (!isSolo && selectedPlayerIds.length < 2) return;

    // Find or create game in DB with mode
    const gameId = await findOrCreateGame(gameName.trim(), gameMode);

    const results: PlayerResult[] = selectedPlayerIds.map(pid => ({
      playerId: pid,
      score: isSolo ? 0 : (scores[pid] || 0),
      isWinner: isSolo ? false : pid === winnerId,
    }));

    const result = await onAddSession({
      name: sessionName.trim(), date, gameName: gameName.trim(),
      gameId: gameId || undefined,
      playerIds: selectedPlayerIds, results, notes: notes.trim(),
      customStats: Object.keys(customStats).length > 0 ? customStats : undefined,
    });

    // Save advanced stats to result_stats
    if (result && Object.keys(advancedStats).length > 0) {
      for (const [playerId, statsMap] of Object.entries(advancedStats)) {
        const resultId = result.resultIds[playerId];
        if (!resultId) continue;
        const statsToSave = Object.entries(statsMap)
          .filter(([, v]) => v !== "" && v !== undefined && v !== null)
          .map(([statDefId, value]) => ({ statDefinitionId: statDefId, value }));
        await saveResultStats(resultId, statsToSave);
      }
    }

    if (!isSolo && winnerId) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    resetForm();
    setSessionDialogOpen(false);
  };

  const startEditSession = (session: GameSession) => {
    setEditingSessionId(session.id);
    setSessionName(session.name);
    setGameName(session.gameName);
    setDate(session.date);
    setSelectedPlayerIds(session.playerIds);
    setScores(Object.fromEntries(session.results.map(r => [r.playerId, r.score])));
    setWinnerId(session.results.find(r => r.isWinner)?.playerId || "");
    setNotes(session.notes);
    setCustomStats(session.customStats || {});
    setSessionDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSessionId || !sessionName.trim() || !gameName.trim()) return;
    const results: PlayerResult[] = selectedPlayerIds.map(pid => ({
      playerId: pid, score: scores[pid] || 0, isWinner: pid === winnerId,
    }));
    onUpdateSession(editingSessionId, {
      name: sessionName.trim(), date, gameName: gameName.trim(),
      playerIds: selectedPlayerIds, results, notes: notes.trim(),
      customStats: Object.keys(customStats).length > 0 ? customStats : undefined,
    });
    resetForm();
    setSessionDialogOpen(false);
  };

  const resetForm = () => {
    setSessionName(""); setGameName(""); setPreselectedGame("");
    setGameMode("multiplayer");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedPlayerIds([]); setScores({}); setWinnerId("");
    setNotes(""); setCustomStats({}); setEditingSessionId(null);
    setAdvancedStats({}); setAdvancedOpen(false);
    setShowNewStat(false); setNewStatKey(""); setNewStatLabel("");
    setNewStatType("number"); setNewStatOptions("");
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleAddNewStat = async () => {
    if (!newStatKey.trim() || !newStatLabel.trim()) return;
    const options = newStatType === "select" && newStatOptions.trim()
      ? newStatOptions.split(",").map(o => o.trim()).filter(Boolean)
      : undefined;
    await addStatDefinition({
      statKey: newStatKey.trim().toLowerCase().replace(/\s+/g, "_"),
      label: newStatLabel.trim(),
      type: newStatType,
      options,
    });
    setShowNewStat(false);
    setNewStatKey("");
    setNewStatLabel("");
    setNewStatType("number");
    setNewStatOptions("");
  };

  // Render stat input based on type
  const renderStatInput = (statDef: { id: string; type: string; label: string; options: string[] | null }, playerId: string) => {
    const val = advancedStats[playerId]?.[statDef.id] ?? "";

    if (statDef.type === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground font-semibold">{statDef.label}</label>
          <Switch
            checked={!!val}
            onCheckedChange={(v) => handleAdvancedStat(playerId, statDef.id, v)}
          />
        </div>
      );
    }

    if (statDef.type === "select" && statDef.options) {
      return (
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold">{statDef.label}</label>
          <Select value={String(val)} onValueChange={(v) => handleAdvancedStat(playerId, statDef.id, v)}>
            <SelectTrigger className="rounded-lg h-8 text-xs mt-0.5">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {statDef.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold">{statDef.label}</label>
        <Input
          type={statDef.type === "number" ? "number" : "text"}
          value={val}
          onChange={e => handleAdvancedStat(playerId, statDef.id, statDef.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder="—"
          className="rounded-lg h-8 text-xs mt-0.5"
        />
      </div>
    );
  };

  // ─── Session Form Dialog ───
  const hasStatDefs = statDefs.length > 0;
  const hasThemeStats = currentTheme && currentTheme.customStats.length > 0;
  const showAdvancedSection = selectedPlayerIds.length > 0 && (hasStatDefs || hasThemeStats || gameName.trim());

  const sessionFormDialog = (
    <Dialog open={sessionDialogOpen} onOpenChange={(v) => { if (!v) { resetForm(); setSessionDialogOpen(false); } }}>
      <DialogContent className="rounded-3xl mx-4 max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {editingSessionId ? t("sessions.editSession") : t("sessions.newSession")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 1. Session Name */}
          <div>
            <Label className="font-semibold text-xs">{t("sessions.sessionName")}</Label>
            <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder={t("sessions.sessionNamePlaceholder")} className="rounded-xl mt-1 h-11" />
          </div>

          {/* 2. Game Selector with Autocomplete */}
          <div className="relative">
            <Label className="font-semibold text-xs">{t("sessions.game")}</Label>
            <Input
              value={gameName}
              onChange={e => { setGameName(e.target.value); setGameInputFocused(true); }}
              onFocus={() => setGameInputFocused(true)}
              onBlur={() => setTimeout(() => setGameInputFocused(false), 200)}
              placeholder={t("sessions.selectGame")}
              className="rounded-xl mt-1 h-11"
              autoComplete="off"
            />
            {gameInputFocused && gameSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {gameSuggestions.map(name => {
                  const key = name.toLowerCase();
                  const gt = getGameTheme(name);
                  const dbGame = games.find(g => g.name.toLowerCase() === key);
                  const previewArtwork = artworkPreviewByName[key];
                  const suggestionImage =
                    dbGame?.coverImage ||
                    dbGame?.backgroundImage ||
                    previewArtwork?.coverImage ||
                    previewArtwork?.backgroundImage ||
                    gt.image;

                  return (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setGameName(name); setGameInputFocused(false); }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors text-sm"
                    >
                      <div className="w-6 h-6 rounded overflow-hidden relative shrink-0">
                        <img src={suggestionImage} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium text-foreground">{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {gameName.trim() && (() => {
            const key = gameName.toLowerCase().trim();
            const dbGame = games.find(g => g.name.toLowerCase() === key);
            const previewArtwork = artworkPreviewByName[key];
            const bannerImg =
              dbGame?.backgroundImage ||
              dbGame?.coverImage ||
              previewArtwork?.backgroundImage ||
              previewArtwork?.coverImage ||
              getGameTheme(gameName).image;

            if (!bannerImg) return null;
            return (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl overflow-hidden">
                <div className="h-16 relative">
                  <img src={bannerImg} alt={gameName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.1))' }} />
                  <div className="absolute inset-0 flex items-center px-3 bg-gradient-to-r from-card/80 to-transparent">
                    <Gamepad2 className="w-5 h-5 mr-2 text-foreground" />
                    <span className="font-bold text-sm text-foreground">{gameName}</span>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Game Mode Selector */}
          {gameName.trim() && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <Label className="font-semibold text-xs">Game Mode</Label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setGameMode("multiplayer"); setSelectedPlayerIds([]); setWinnerId(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    gameMode === "multiplayer"
                      ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/30"
                      : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Multiplayer
                </button>
                <button
                  type="button"
                  onClick={() => { setGameMode("solo"); setSelectedPlayerIds([]); setWinnerId(""); setScores({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    gameMode === "solo"
                      ? "bg-accent/10 border-accent text-accent ring-1 ring-accent/30"
                      : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Solo
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. Date */}
          <div>
            <Label className="font-semibold text-xs">{t("sessions.date")}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl mt-1 h-11" />
          </div>

          {/* 4. Players */}
          <div>
            <Label className="font-semibold text-xs">
              {isSolo ? "Player" : t("sessions.players")}
            </Label>
            {isSolo && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Select a player for this solo session</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {players.map(p => {
                const isSelected = selectedPlayerIds.includes(p.id);
                const isDisabled = isSolo && selectedPlayerIds.length >= 1 && !isSelected;
                return (
                  <button key={p.id} onClick={() => {
                    if (isSolo) {
                      // In solo mode, only one player at a time
                      setSelectedPlayerIds(isSelected ? [] : [p.id]);
                    } else {
                      togglePlayer(p.id);
                    }
                  }}
                    disabled={isDisabled}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      isSelected ? "ring-2 ring-offset-1" : isDisabled ? "opacity-20 cursor-not-allowed" : "opacity-40"
                    }`}
                    style={{ backgroundColor: p.color + "22", color: p.color, ...(isSelected ? { ringColor: p.color } : {}) }}
                  >
                    <span className="w-5 h-5 rounded-md overflow-hidden inline-flex items-center justify-center shrink-0" style={{ backgroundColor: p.color + "15" }}>
                      {isImageAvatar(p.avatar) ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs">{p.avatar}</span>
                      )}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPlayerIds.length > 0 && !isSolo && (
            <>
              {/* 5. Scores */}
              <div>
                <Label className="font-semibold text-xs">{t("sessions.scores")}</Label>
                <div className="space-y-1.5 mt-1">
                  {selectedPlayerIds.map(pid => {
                    const p = players.find(pl => pl.id === pid)!;
                    return (
                      <div key={pid} className="flex items-center gap-2">
                        <PlayerBadge player={p} size="sm" />
                        <Input type="number" value={scores[pid] || ""} onChange={e => setScores(prev => ({ ...prev, [pid]: Number(e.target.value) }))} placeholder={t("sessions.score")} className="rounded-xl flex-1 h-10" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Winner */}
              <div>
                <Label className="font-semibold text-xs">{t("sessions.winner")}</Label>
                <Select value={winnerId} onValueChange={setWinnerId}>
                  <SelectTrigger className="rounded-xl mt-1 h-11"><SelectValue placeholder={t("sessions.selectWinner")} /></SelectTrigger>
                  <SelectContent>
                    {selectedPlayerIds.map(pid => {
                      const p = players.find(pl => pl.id === pid)!;
                      return (
                        <SelectItem key={pid} value={pid}>
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded overflow-hidden inline-flex items-center justify-center shrink-0">
                              {isImageAvatar(p.avatar) ? (
                                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs">{p.avatar}</span>
                              )}
                            </span>
                            {p.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* 7. Advanced Statistics (collapsible) */}
          {showAdvancedSection && (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors">
                  <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {t("sessions.advancedStats") || "Advanced Statistics"}
                  </span>
                  {advancedOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3">
                  {/* DB stat definitions grouped by player */}
                  {statDefs.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {selectedGameDef?.name || gameName} Stats
                      </p>
                      {selectedPlayerIds.map(pid => {
                        const p = players.find(pl => pl.id === pid)!;
                        return (
                          <div key={pid} className="bg-secondary/50 rounded-xl p-2.5 space-y-1.5">
                            <PlayerBadge player={p} size="sm" />
                            <div className="grid grid-cols-2 gap-1.5">
                              {statDefs.map(sd => (
                                <div key={sd.id}>
                                  {renderStatInput(sd, pid)}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Theme-based custom stats (legacy) */}
                  {hasThemeStats && statDefs.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {currentTheme!.emoji} {currentTheme!.name} {t("sessions.stats")} {t("sessions.optional")}
                      </p>
                      {selectedPlayerIds.map(pid => {
                        const p = players.find(pl => pl.id === pid)!;
                        return (
                          <div key={pid} className="bg-secondary/50 rounded-xl p-2.5 space-y-1.5">
                            <PlayerBadge player={p} size="sm" />
                            <div className="grid grid-cols-2 gap-1.5">
                              {currentTheme!.customStats.map(stat => (
                                <div key={stat.key}>
                                  <label className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">{stat.emoji} {stat.label}</label>
                                  <Input value={customStats[pid]?.[stat.key] || ""} onChange={e => handleCustomStat(pid, stat.key, e.target.value)} placeholder="—" className="rounded-lg h-8 text-xs mt-0.5" />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new stat definition */}
                  {gameName.trim() && (
                    <div className="border-t border-border pt-3">
                      {!showNewStat ? (
                        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs w-full" onClick={() => setShowNewStat(true)}>
                          <Plus className="w-3 h-3" /> {t("sessions.addCustomStat") || "Add Custom Stat"}
                        </Button>
                      ) : (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Stat Definition</p>
                          <Input value={newStatLabel} onChange={e => {
                            setNewStatLabel(e.target.value);
                            setNewStatKey(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                          }} placeholder="Label (e.g. Blue Shells)" className="rounded-lg h-8 text-xs" />
                          <Select value={newStatType} onValueChange={setNewStatType}>
                            <SelectTrigger className="rounded-lg h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
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
                            <Button size="sm" className="rounded-lg h-8 text-xs flex-1" onClick={handleAddNewStat} disabled={!newStatLabel.trim()}>
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
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* 8. Notes */}
          <div>
            <Label className="font-semibold text-xs">{t("sessions.notes")}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("sessions.notesPlaceholder")} className="rounded-xl mt-1" />
          </div>

          {/* 9. Submit */}
          <Button onClick={editingSessionId ? handleSaveEdit : handleAdd} className="w-full rounded-2xl font-bold h-12" size="lg"
            disabled={!sessionName.trim() || !gameName.trim() || (isSolo ? selectedPlayerIds.length !== 1 : selectedPlayerIds.length < 2)}>
            {editingSessionId ? t("sessions.saveChanges") : t("sessions.record")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ─── Game Detail View ───
  if (view === "detail" && selectedGame) {
    return (
      <>
        {sessionFormDialog}
        <GameDetailView
          gameName={selectedGame}
          players={players}
          sessions={sessions}
          onBack={() => { setView("catalog"); setSelectedGame(null); }}
          onStartSession={() => openNewSession(selectedGame)}
        />
      </>
    );
  }

  // ─── Session History View ───
  if (view === "history") {
    return (
      <>
        {sessionFormDialog}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setView("catalog")} className="p-1.5 rounded-xl bg-secondary text-foreground active:scale-90 transition-transform">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-foreground">{t("sessions.title")}</h2>
              <p className="text-muted-foreground text-xs">{sessions.length} {sessions.length !== 1 ? t("sessions.sessionPlural") : t("sessions.session")}</p>
            </div>
            <Button size="lg" className="rounded-2xl gap-2 font-bold h-11 text-sm" disabled={players.length < 1} onClick={() => openNewSession()}>
              <Plus className="w-4 h-4" /> {t("sessions.new")}
            </Button>
          </div>

          {players.length < 1 && (
            <div className="game-card bg-secondary/50 text-center !p-3">
              <p className="text-xs text-muted-foreground font-semibold">{t("sessions.minPlayers")}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <AnimatePresence>
              {[...sessions].reverse().map((session, i) => {
                const isExpanded = expandedId === session.id;
                const winner = session.results.find(r => r.isWinner);
                const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
                const theme = getGameTheme(session.gameName);
                const sessionGame = games.find(g => g.name.toLowerCase() === session.gameName.toLowerCase());
                const isSessionSolo = sessionGame?.gameMode === "solo" || (session.results.length === 1 && !session.results[0]?.isWinner);
                return (
                  <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="game-card cursor-pointer !p-3" onClick={() => setExpandedId(isExpanded ? null : session.id)} whileTap={{ scale: 0.98 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{theme.emoji}</span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{session.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {session.gameName} · {new Date(session.date).toLocaleDateString()}
                            {isSessionSolo && <span className="ml-1 text-accent font-bold">Solo</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSessionSolo ? (
                          <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <User className="w-3 h-3" /> {players.find(p => p.id === session.results[0]?.playerId)?.name || "—"}
                          </span>
                        ) : winnerPlayer && (
                          <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Crown className="w-3 h-3" /> {winnerPlayer.name}</span>
                        )}
                        <button onClick={e => { e.stopPropagation(); startEditSession(session); }} className="text-muted-foreground hover:text-primary transition-colors p-1 active:scale-90">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); onRemoveSession(session.id); }} className="text-muted-foreground hover:text-destructive transition-colors p-1 active:scale-90">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-3 pt-3 border-t border-border">
                            {isSessionSolo ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <User className="w-3.5 h-3.5 text-accent" />
                                  <span className="font-bold text-foreground">Sesión personal</span>
                                </div>
                                {session.results[0] && (() => {
                                  const p = players.find(pl => pl.id === session.results[0].playerId);
                                  return p ? <PlayerBadge player={p} size="sm" /> : null;
                                })()}
                              </div>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-muted-foreground text-[10px]">
                                    <th className="text-left pb-1.5">{t("ranking.player")}</th>
                                    <th className="text-right pb-1.5">{t("sessions.score")}</th>
                                    <th className="text-right pb-1.5">{t("sessions.result")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {session.results.sort((a, b) => b.score - a.score).map(r => {
                                    const p = players.find(pl => pl.id === r.playerId);
                                    if (!p) return null;
                                    return (
                                      <tr key={r.playerId} className="border-t border-border/50">
                                        <td className="py-1.5"><PlayerBadge player={p} size="sm" /></td>
                                        <td className="text-right font-bold">{r.score}</td>
                                        <td className="text-right">{r.isWinner ? <Crown className="w-3 h-3 text-[hsl(var(--gold))] inline" /> : ""}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                            {session.customStats && Object.keys(session.customStats).length > 0 && (
                              <div className="mt-3 pt-2 border-t border-border/50">
                                <p className="text-[10px] font-bold text-muted-foreground mb-1.5">{theme.emoji} {t("sessions.gameStats")}</p>
                                <div className="space-y-1.5">
                                  {Object.entries(session.customStats).map(([pid, cstats]) => {
                                    const p = players.find(pl => pl.id === pid);
                                    if (!p) return null;
                                    const filledStats = Object.entries(cstats).filter(([, v]) => v !== "" && v !== 0);
                                    if (filledStats.length === 0) return null;
                                    return (
                                      <div key={pid} className="bg-secondary/50 rounded-lg px-2 py-1.5">
                                        <PlayerBadge player={p} size="sm" />
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {filledStats.map(([key, value]) => {
                                            const statDef = theme.customStats.find(s => s.key === key);
                                            return <span key={key} className="text-[10px] text-foreground">{statDef?.emoji} {statDef?.label || key}: <strong>{String(value)}</strong></span>;
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {session.notes && <p className="text-[10px] text-muted-foreground mt-2 italic flex items-center gap-1"><FileText className="w-3 h-3" /> {session.notes}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {sessions.length === 0 && players.length >= 2 && (
            <div className="text-center py-10">
              <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-semibold text-sm">{t("sessions.noSessions")}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─── Main Catalog View ───
  return (
    <>
      {sessionFormDialog}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">{t("play.title")}</h2>
            <p className="text-muted-foreground text-xs mt-0.5">{t("play.subtitle")}</p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="rounded-2xl gap-1.5 font-bold text-xs h-9" onClick={() => setView("history")}>
              <Calendar className="w-3.5 h-3.5" /> {t("play.history")}
            </Button>
            <Button size="sm" className="rounded-2xl gap-1.5 font-bold text-xs h-9" disabled={players.length < 1} onClick={() => openNewSession()}>
              <Plus className="w-3.5 h-3.5" /> {t("play.newGame")}
            </Button>
          </div>
        </div>

        {/* Your Games (played) */}
        {gamesPlayed.length > 0 && (
          <div>
            <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" style={{ color: "hsl(var(--game-orange))" }} />
              {t("games.yourGames")}
            </h3>
            <div className="space-y-2">
              {gamesPlayed.map((game, i) => (
                <motion.div key={game.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="game-card w-full !p-0 overflow-hidden">
                  <div className="flex items-stretch">
                    <button onClick={() => openGameDetail(game.name)} className="w-16 h-16 shrink-0 relative overflow-hidden">
                      <img src={game.theme.image} alt={game.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: game.theme.gradient, opacity: 0.3 }} />
                    </button>
                    <div className="flex-1 p-2.5 flex items-center justify-between">
                      <button onClick={() => openGameDetail(game.name)} className="text-left flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{game.theme.emoji}</span>
                          <span className="font-bold text-sm text-foreground">{game.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{game.count} {game.count !== 1 ? t("sessions.sessionPlural") : t("sessions.session")}</span>
                          <span className="px-1 py-px rounded-full font-bold"
                            style={{ backgroundColor: getCategoryColor(game.theme.category) + "22", color: getCategoryColor(game.theme.category) }}>
                            {getCategoryEmoji(game.theme.category)} {game.theme.category}
                          </span>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="rounded-xl h-8 px-2 text-xs font-bold gap-1" onClick={() => openNewSession(game.name)} disabled={players.length < 1}>
                          <Plus className="w-3 h-3" /> {t("play.play")}
                        </Button>
                        <button onClick={() => openGameDetail(game.name)} className="text-muted-foreground p-1">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Discover / All Games */}
        <div>
          <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" style={{ color: "hsl(var(--game-purple))" }} />
            {gamesPlayed.length > 0 ? t("games.discoverMore") : t("games.popularGames")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {allGames.filter(g => g.count === 0).map((game, i) => (
              <motion.div key={game.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className="game-card !p-0 overflow-hidden text-left">
                <div className="relative h-20 overflow-hidden">
                  <img src={game.theme.image} alt={game.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between">
                    <button onClick={() => openGameDetail(game.name)} className="font-bold text-foreground text-xs flex items-center gap-1">
                      {game.theme.emoji} {game.name}
                    </button>
                    <Button size="sm" variant="secondary" className="rounded-lg h-6 px-2 text-[9px] font-bold gap-0.5" onClick={() => openNewSession(game.name)} disabled={players.length < 1}>
                      <Plus className="w-2.5 h-2.5" /> {t("play.play")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8">
            <Gamepad2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground font-semibold text-sm">{t("games.noSessions")}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Game Detail View ─────────────────────────────
function GameDetailView({
  gameName, players, sessions, onBack, onStartSession,
}: {
  gameName: string; players: Player[]; sessions: GameSession[]; onBack: () => void; onStartSession: () => void;
}) {
  const { t } = useI18n();
  const theme = getGameTheme(gameName);
  const gameSessions = sessions.filter(s => s.gameName === gameName);
  const gameStats = getPlayerStats(players, gameSessions);
  const activePlayers = gameStats.filter(s => s.gamesPlayed > 0);
  const [activeChart, setActiveChart] = useState<"wins" | "performance" | "radar" | "history" | "custom" | "advanced">("wins");
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  // Advanced stats from DB
  const { games: gamesForDetail } = useGames();
  const gameRecordForDetail = gamesForDetail.find(g => g.name.toLowerCase() === gameName.toLowerCase());
  const gameIdForDetail = gameRecordForDetail?.id || null;
  const sessionIdsForDetail = gameSessions.map(s => s.id);
  const { data: advancedStatsData, loading: advancedStatsLoading } = useGameResultStats(gameIdForDetail, sessionIdsForDetail);
  const hasAdvancedStatsData = advancedStatsData.length > 0;

  const topPlayer = activePlayers.length > 0 ? activePlayers.reduce((a, b) => a.wins > b.wins ? a : b) : null;

  const winDistribution = activePlayers.filter(s => s.wins > 0).map(s => ({ name: s.player.name, value: s.wins, color: s.player.color }));

  const scoreHistory = gameSessions.map((s, i) => {
    const entry: Record<string, any> = { session: `#${i + 1}`, name: s.name };
    s.results.forEach(r => { const p = players.find(pl => pl.id === r.playerId); if (p) entry[p.name] = r.score; });
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
    name: s.player.name, avgScore: s.gamesPlayed > 0 ? Math.round(s.totalPoints / s.gamesPlayed) : 0, color: s.player.color,
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
          if (!isNaN(numVal) && value !== "") { result[pid][key].total += numVal; result[pid][key].count++; }
          else if (typeof value === "string" && value) { result[pid][key].values.push(value); }
        });
      });
    });
    return result;
  }, [gameSessions]);

  const hasCustomStats = Object.keys(aggregatedCustomStats).length > 0;

  const chartTabs = [
    { id: "wins" as const, label: t("chart.wins"), icon: Trophy },
    { id: "performance" as const, label: t("chart.avg"), icon: BarChart3 },
    { id: "radar" as const, label: t("chart.radar"), icon: Crosshair },
    { id: "history" as const, label: t("chart.history"), icon: TrendingUp },
    ...(hasCustomStats ? [{ id: "custom" as const, label: t("chart.stats"), icon: Target }] : []),
    ...(hasAdvancedStatsData ? [{ id: "advanced" as const, label: t("chart.advanced"), icon: Medal }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden">
        <img src={theme.image} alt={theme.name} className="w-full h-36 object-cover" />
        <div className="absolute inset-0" style={{ background: `${theme.gradient}`, opacity: 0.5 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <button onClick={onBack} className="absolute top-2.5 left-2.5 bg-card/80 backdrop-blur-sm rounded-xl p-1.5 text-foreground active:scale-90 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.emoji}</span>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">{theme.name}</h2>
              <p className="text-[10px] text-muted-foreground">{theme.description}</p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5 font-bold text-xs h-9" onClick={onStartSession}>
            <Plus className="w-3.5 h-3.5" /> {t("play.play")}
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Calendar, label: t("dashboard.sessions"), value: gameSessions.length, color: theme.primaryColor },
          { icon: Users, label: t("dashboard.players"), value: activePlayers.length, color: theme.secondaryColor },
          { icon: Trophy, label: "Champion", value: topPlayer?.player.name || "—", color: theme.primaryColor },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="stat-card !p-2.5">
            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            <span className="text-base font-extrabold text-foreground truncate max-w-full">{stat.value}</span>
            <span className="text-[9px] font-semibold text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Track Stats Hints */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="game-card !p-3" style={{ borderColor: theme.primaryColor + "33" }}>
        <h3 className="font-bold text-foreground text-xs mb-2 flex items-center gap-1.5">
          <span className="text-base">💡</span> {t("games.trackStats")}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {theme.customStats.map((stat, i) => (
            <motion.div key={stat.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.04 }}
              className="flex items-center gap-1.5 bg-secondary/50 rounded-xl px-2.5 py-1.5">
              <span className="text-base">{stat.emoji}</span>
              <span className="text-[10px] font-semibold text-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
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
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex gap-1 mb-3 overflow-x-auto pb-0.5 scrollbar-hide">
              {chartTabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveChart(tab.id)}
                  className={`flex items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap active:scale-95 ${
                    activeChart === tab.id ? "text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
                  }`}
                  style={activeChart === tab.id ? { background: theme.gradient } : {}}>
                  {tab.icon && <tab.icon className="w-3 h-3" />} {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeChart} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="game-card !p-3">
                {activeChart === "wins" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> {t("games.winDistribution")}</h3>
                    {winDistribution.length > 0 ? (
                      <div className="flex gap-3">
                        <ResponsiveContainer width="50%" height={160}>
                          <PieChart>
                            <Pie data={winDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value" animationBegin={0} animationDuration={800}
                              onMouseEnter={(_, i) => setHoveredPlayer(winDistribution[i]?.name)} onMouseLeave={() => setHoveredPlayer(null)}>
                              {winDistribution.map((entry, i) => (
                                <Cell key={i} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2}
                                  opacity={hoveredPlayer && hoveredPlayer !== entry.name ? 0.4 : 1} style={{ transition: "opacity 0.2s", cursor: "pointer" }} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 flex flex-col justify-center space-y-1.5">
                          {winDistribution.map(entry => (
                            <motion.div key={entry.name} className="flex items-center gap-1.5 cursor-pointer rounded-lg px-1.5 py-0.5"
                              onHoverStart={() => setHoveredPlayer(entry.name)} onHoverEnd={() => setHoveredPlayer(null)}
                              animate={{ opacity: hoveredPlayer && hoveredPlayer !== entry.name ? 0.4 : 1 }}>
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
                    <h3 className="font-bold text-foreground mb-3 text-xs flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-primary" /> {t("games.avgScore")}</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} animationDuration={800}
                          onMouseEnter={(data) => setHoveredPlayer(data.name)} onMouseLeave={() => setHoveredPlayer(null)}>
                          {performanceData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} opacity={hoveredPlayer && hoveredPlayer !== entry.name ? 0.4 : 1}
                              style={{ transition: "opacity 0.2s", cursor: "pointer" }} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {activeChart === "radar" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs flex items-center gap-1.5"><Crosshair className="w-3.5 h-3.5 text-primary" /> {t("games.playerComparison")}</h3>
                    {radarData.length > 0 && activePlayers.length <= 6 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={false} domain={[0, 100]} />
                          {activePlayers.map(s => (
                            <Radar key={s.player.id} name={s.player.name} dataKey={s.player.name} stroke={s.player.color} fill={s.player.color}
                              fillOpacity={hoveredPlayer === s.player.name ? 0.35 : 0.12} strokeWidth={hoveredPlayer === s.player.name ? 3 : 1.5}
                              animationDuration={800} style={{ transition: "all 0.2s" }} />
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
                        <motion.div key={s.player.id} onHoverStart={() => setHoveredPlayer(s.player.name)} onHoverEnd={() => setHoveredPlayer(null)} className="cursor-pointer">
                          <PlayerBadge player={s.player} size="sm" />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {activeChart === "history" && (
                  <>
                    <h3 className="font-bold text-foreground mb-3 text-xs flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-primary" /> {t("games.scoreHistory")}</h3>
                    {scoreHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={scoreHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="session" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          {activePlayers.map(s => (
                            <Area key={s.player.id} type="monotone" dataKey={s.player.name} stroke={s.player.color} fill={s.player.color}
                              fillOpacity={hoveredPlayer === s.player.name ? 0.3 : 0.08} strokeWidth={hoveredPlayer === s.player.name ? 3 : 1.5}
                              animationDuration={800} style={{ transition: "all 0.2s" }} />
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
                          <motion.div key={pid} className="bg-secondary/50 rounded-xl p-2.5" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                            <PlayerBadge player={p} size="sm" />
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              {entries.map(([key, data]) => {
                                const statDef = theme.customStats.find(s => s.key === key);
                                return (
                                  <div key={key} className="text-[10px]">
                                    <span className="text-muted-foreground">{statDef?.emoji} {statDef?.label || key}</span>
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
                      <Medal className="w-3.5 h-3.5 text-primary" /> {t("chart.advancedTitle")}
                    </h3>
                    {advancedStatsLoading ? (
                      <p className="text-xs text-muted-foreground text-center py-4">{t("common.loading")}</p>
                    ) : (
                      <div className="space-y-3">
                        {advancedStatsData.map(({ playerId, stats: pStats }) => {
                          const p = players.find(pl => pl.id === playerId);
                          if (!p || pStats.length === 0) return null;
                          return (
                            <motion.div key={playerId} className="bg-secondary/50 rounded-xl p-2.5" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
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
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="game-card !p-0 overflow-hidden">
            <div className="p-3 pb-1.5" style={{ background: theme.gradient, opacity: 0.9 }}>
              <h3 className="font-bold text-xs" style={{ color: "white" }}>🏅 {theme.name} {t("games.leaderboard")}</h3>
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
                {activePlayers.sort((a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints).map((ps, i) => (
                  <tr key={ps.player.id} className="border-b border-border/50 last:border-0">
                    <td className="p-2.5 font-extrabold text-muted-foreground text-[10px]">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
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
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
