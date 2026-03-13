import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Gamepad2, Calendar, Plus, Trash2, Edit3, Check, X, Link, Unlink } from "lucide-react";
import { Player, GameSession, PlayerStats, PLAYER_COLORS, PLAYER_AVATARS, POPULAR_GAMES, PlayerResult } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { getGameTheme } from "@/lib/gameThemes";
import { PlayerBadge } from "@/components/PlayerBadge";
import { AvatarPicker } from "@/components/AvatarPicker";
import { isImageAvatar } from "@/lib/avatarOptions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

// ─── Dashboard Tab ────────────────────────────────
export function DashboardTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const { t } = useI18n();
  const stats = getPlayerStats(players, sessions);
  const topPlayer = stats.length > 0 ? stats.reduce((a, b) => a.wins > b.wins ? a : b) : null;
  const uniqueGames = new Set(sessions.map(s => s.gameName)).size;

  const statCards = [
    { icon: Calendar, label: t("dashboard.sessions"), value: sessions.length, colorClass: "text-primary" },
    { icon: Users, label: t("dashboard.players"), value: players.length, colorClass: "text-game-blue" },
    { icon: Gamepad2, label: t("dashboard.games"), value: uniqueGames, colorClass: "text-accent" },
    { icon: Trophy, label: t("dashboard.topWinner"), value: topPlayer?.player.name || "—", colorClass: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <stat.icon className={`w-5 h-5 ${stat.colorClass}`} />
            <span className="text-2xl font-display font-bold text-foreground">{stat.value}</span>
            <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {topPlayer && topPlayer.wins > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">👑</div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("dashboard.currentLeader")}</p>
              <div className="flex items-center gap-2 mt-1">
                <PlayerBadge player={topPlayer.player} size="md" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {topPlayer.wins} {t("dashboard.wins")} · {topPlayer.winRate.toFixed(0)}% {t("dashboard.winRate")}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {sessions.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">{t("dashboard.recentSessions")}</h3>
          <div className="space-y-2">
            {sessions.slice(-3).reverse().map(session => {
              const theme = getGameTheme(session.gameName);
              return (
                <motion.div key={session.id} className="game-card !p-3" whileTap={{ scale: 0.98 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{theme.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{session.name}</p>
                        <p className="text-xs text-muted-foreground">{session.gameName} · {new Date(session.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {session.results.slice(0, 4).map(r => {
                        const p = players.find(pl => pl.id === r.playerId);
                        return p ? (
                          <div
                            key={r.playerId}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 border-card overflow-hidden"
                            style={{ backgroundColor: p.color + "22" }}
                          >
                            {isImageAvatar(p.avatar) ? (
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            ) : p.avatar}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {sessions.length === 0 && players.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-5xl mb-3">🎲</div>
          <h3 className="text-lg font-display font-bold text-foreground">{t("dashboard.welcome")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.welcomeMsg")}</p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────
export function PlayersTab({
  players, sessions, onAddPlayer, onRemovePlayer, onUpdatePlayer, onRefetchPlayers,
}: {
  players: Player[]; sessions: GameSession[];
  onAddPlayer: (p: Omit<Player, "id" | "createdAt">) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onRefetchPlayers?: () => void;
}) {
  const { t } = useI18n();
  const { user, username } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PLAYER_COLORS[0].value);
  const [avatar, setAvatar] = useState(PLAYER_AVATARS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [linkingPlayerId, setLinkingPlayerId] = useState<string | null>(null);
  const stats = getPlayerStats(players, sessions);

  // Check if current user is already linked to a player in this group
  const userLinkedPlayer = players.find(p => p.linkedUserId === user?.id);

  const isDuplicateName = (checkName: string, excludeId?: string) =>
    players.some(p => p.name.toLowerCase() === checkName.trim().toLowerCase() && p.id !== excludeId);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddPlayer({ name: name.trim(), color, avatar });
    setName("");
    setColor(PLAYER_COLORS[(players.length + 1) % PLAYER_COLORS.length].value);
    setAvatar(PLAYER_AVATARS[(players.length + 1) % PLAYER_AVATARS.length]);
    setOpen(false);
  };

  const startEdit = (p: Player) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color);
    setEditAvatar(p.avatar);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdatePlayer(editingId, { name: editName.trim(), color: editColor, avatar: editAvatar });
      setEditingId(null);
    }
  };

  const handleLinkPlayer = async (playerId: string) => {
    if (!user) return;
    setLinkingPlayerId(playerId);
    const { error } = await supabase
      .from("players")
      .update({ linked_user_id: user.id })
      .eq("id", playerId)
      .is("linked_user_id", null);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🔗", description: t("players.linked") || "Player linked to your account" });
      onRefetchPlayers?.();
    }
    setLinkingPlayerId(null);
  };

  const handleUnlinkPlayer = async (playerId: string) => {
    if (!user) return;
    setLinkingPlayerId(playerId);
    const { error } = await supabase
      .from("players")
      .update({ linked_user_id: null })
      .eq("id", playerId)
      .eq("linked_user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🔓", description: t("players.unlinked") || "Player unlinked from your account" });
      onRefetchPlayers?.();
    }
    setLinkingPlayerId(null);
  };

  const getBadges = (ps: PlayerStats) => {
    const badges: string[] = [];
    if (ps.wins > 0 && stats.every(s => s.wins <= ps.wins)) badges.push(t("players.mostWins"));
    if (ps.gamesPlayed >= 5 && ps.winRate >= 60) badges.push(t("players.onFire"));
    if (ps.gamesPlayed >= 10) badges.push(t("players.veteran"));
    if (ps.totalPoints > 0 && stats.every(s => s.totalPoints <= ps.totalPoints)) badges.push(t("players.topScorer"));
    return badges;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">{t("players.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{players.length} {players.length !== 1 ? t("players.players") : t("players.player")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-lg gap-2 font-semibold h-10">
              <Plus className="w-4 h-4" /> {t("players.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle className="font-display font-bold">{t("players.newPlayer")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-medium text-xs">{t("players.name")}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("players.playerName")} className="rounded-lg mt-1 h-11" />
                {name.trim() && isDuplicateName(name) && (
                  <p className="text-xs text-warning mt-1 flex items-center gap-1">⚠️ {t("players.duplicateNameWarning") || "A player with this name already exists in this group"}</p>
                )}
              </div>
              <div>
                <Label className="font-medium text-xs">{t("players.avatar")}</Label>
                <div className="mt-1">
                  <AvatarPicker value={avatar} onChange={setAvatar} />
                </div>
              </div>
              <div>
                <Label className="font-medium text-xs">{t("players.color")}</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PLAYER_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-9 h-9 rounded-lg transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-foreground scale-105" : ""}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full rounded-lg font-semibold h-12" size="lg" disabled={!name.trim()}>
                {t("players.addPlayer")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {stats.map((ps, i) => {
            const isLinkedToMe = ps.player.linkedUserId === user?.id;
            const isLinkedToOther = !!ps.player.linkedUserId && !isLinkedToMe;
            const canLink = !ps.player.linkedUserId && !userLinkedPlayer;

            return (
            <motion.div
              key={ps.player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: i * 0.05 }}
              className="game-card !p-4"
              layout
            >
              {editingId === ps.player.id ? (
                <div className="space-y-3">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-lg h-10" />
                  <AvatarPicker value={editAvatar} onChange={setEditAvatar} size="sm" />
                  <div className="flex flex-wrap gap-1.5">
                    {PLAYER_COLORS.map(c => (
                      <button key={c.value} onClick={() => setEditColor(c.value)}
                        className={`w-8 h-8 rounded-lg ${editColor === c.value ? "ring-2 ring-offset-1 ring-foreground" : ""}`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm" className="rounded-lg flex-1 gap-1"><Check className="w-4 h-4" /> {t("players.save")}</Button>
                    <Button onClick={() => setEditingId(null)} size="sm" variant="outline" className="rounded-lg gap-1"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold overflow-hidden"
                      style={{ backgroundColor: ps.player.color + "15", border: `2px solid ${ps.player.color}` }}
                    >
                      {isImageAvatar(ps.player.avatar) ? (
                        <img src={ps.player.avatar} alt={ps.player.name} className="w-full h-full object-cover" />
                      ) : ps.player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm">{ps.player.name}</p>
                        {ps.player.linkedUserId ? (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Link className="w-2.5 h-2.5" />
                            {ps.player.linkedUsername || (ps.player.linkedUserId === user?.id ? (username || "You") : "User")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md italic">
                            {t("players.noUserLinked") || "No user linked"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{ps.gamesPlayed} {t("players.games")}</span>
                        <span>{ps.wins} {t("players.wins")}</span>
                        <span>{ps.winRate.toFixed(0)}%</span>
                        <span>{ps.totalPoints} {t("players.pts")}</span>
                      </div>
                      {getBadges(ps).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getBadges(ps).map(b => (
                            <span key={b} className="text-[10px] bg-secondary px-2 py-0.5 rounded-md font-semibold">{b}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 items-start">
                    {/* Link/Unlink button */}
                    {isLinkedToMe && (
                      <button
                        onClick={() => handleUnlinkPlayer(ps.player.id)}
                        disabled={linkingPlayerId === ps.player.id}
                        className="text-primary hover:text-destructive transition-colors p-1.5"
                        title={t("players.unlinkMe") || "Unlink from my account"}
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    )}
                    {canLink && (
                      <button
                        onClick={() => handleLinkPlayer(ps.player.id)}
                        disabled={linkingPlayerId === ps.player.id}
                        className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                        title={t("players.linkMe") || "Link to my account"}
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => startEdit(ps.player)} className="text-muted-foreground hover:text-primary transition-colors p-1.5">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onRemovePlayer(ps.player.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
          })}
        </AnimatePresence>
      </div>

      {players.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-muted-foreground font-medium text-sm">{t("players.noPlayers")}</p>
        </div>
      )}
    </div>
  );
}

// ─── Sessions Tab ─────────────────────────────────
export function SessionsTab({
  players, sessions, onAddSession, onRemoveSession, onUpdateSession,
}: {
  players: Player[]; sessions: GameSession[];
  onAddSession: (s: Omit<GameSession, "id" | "createdAt">) => void;
  onRemoveSession: (id: string) => void;
  onUpdateSession: (id: string, updates: Partial<GameSession>) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [gameName, setGameName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [winnerId, setWinnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [customStats, setCustomStats] = useState<Record<string, Record<string, string | number>>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const currentTheme = gameName ? getGameTheme(gameName) : null;

  const handleCustomStat = (playerId: string, statKey: string, value: string | number) => {
    setCustomStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [statKey]: value },
    }));
  };

  const handleAdd = () => {
    if (!sessionName.trim() || !gameName.trim() || selectedPlayerIds.length === 0) return;
    const results: PlayerResult[] = selectedPlayerIds.map(pid => ({
      playerId: pid,
      score: scores[pid] || 0,
      isWinner: pid === winnerId,
    }));
    onAddSession({
      name: sessionName.trim(),
      date,
      gameName: gameName.trim(),
      playerIds: selectedPlayerIds,
      results,
      notes: notes.trim(),
      customStats: Object.keys(customStats).length > 0 ? customStats : undefined,
    });
    if (winnerId) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    resetForm();
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
    setOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSessionId || !sessionName.trim() || !gameName.trim()) return;
    const results: PlayerResult[] = selectedPlayerIds.map(pid => ({
      playerId: pid,
      score: scores[pid] || 0,
      isWinner: pid === winnerId,
    }));
    onUpdateSession(editingSessionId, {
      name: sessionName.trim(),
      date,
      gameName: gameName.trim(),
      playerIds: selectedPlayerIds,
      results,
      notes: notes.trim(),
      customStats: Object.keys(customStats).length > 0 ? customStats : undefined,
    });
    resetForm();
  };

  const resetForm = () => {
    setSessionName(""); setGameName("");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedPlayerIds([]); setScores({}); setWinnerId("");
    setNotes(""); setCustomStats({}); setEditingSessionId(null); setOpen(false);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">{t("sessions.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{sessions.length} {sessions.length !== 1 ? t("sessions.sessionPlural") : t("sessions.session")}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="rounded-lg gap-2 font-semibold h-10" disabled={players.length < 2}>
              <Plus className="w-4 h-4" /> {t("sessions.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display font-bold">
                {editingSessionId ? t("sessions.editSession") : t("sessions.newSession")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-medium text-xs">{t("sessions.sessionName")}</Label>
                <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder={t("sessions.sessionNamePlaceholder")} className="rounded-lg mt-1 h-11" />
              </div>
              <div>
                <Label className="font-medium text-xs">{t("sessions.game")}</Label>
                <Select value={gameName} onValueChange={setGameName}>
                  <SelectTrigger className="rounded-lg mt-1 h-11">
                    <SelectValue placeholder={t("sessions.selectGame")} />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_GAMES.map(g => {
                      const gt = getGameTheme(g);
                      return <SelectItem key={g} value={g}>{gt.emoji} {g}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                <Input value={gameName} onChange={e => setGameName(e.target.value)} placeholder={t("sessions.customGame")} className="rounded-lg mt-2 h-11" />
              </div>
              {currentTheme && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-lg overflow-hidden">
                  <div className="h-16 relative">
                    <img src={currentTheme.image} alt={currentTheme.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: currentTheme.gradient, opacity: 0.4 }} />
                    <div className="absolute inset-0 flex items-center px-3 bg-gradient-to-r from-card/80 to-transparent">
                      <span className="text-xl mr-2">{currentTheme.emoji}</span>
                      <span className="font-semibold text-sm text-foreground">{currentTheme.name}</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div>
                <Label className="font-medium text-xs">{t("sessions.date")}</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-lg mt-1 h-11" />
              </div>
              <div>
                <Label className="font-medium text-xs">{t("sessions.players")}</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {players.map(p => (
                    <button key={p.id} onClick={() => togglePlayer(p.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedPlayerIds.includes(p.id) ? "ring-2 ring-offset-1" : "opacity-40"
                      }`}
                      style={{ backgroundColor: p.color + "15", color: p.color, ...(selectedPlayerIds.includes(p.id) ? { ringColor: p.color } : {}) }}
                    >
                      {p.avatar} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlayerIds.length > 0 && (
                <>
                  <div>
                    <Label className="font-medium text-xs">{t("sessions.scores")}</Label>
                    <div className="space-y-1.5 mt-1">
                      {selectedPlayerIds.map(pid => {
                        const p = players.find(pl => pl.id === pid)!;
                        return (
                          <div key={pid} className="flex items-center gap-2">
                            <PlayerBadge player={p} size="sm" />
                            <Input type="number" value={scores[pid] || ""} onChange={e => setScores(prev => ({ ...prev, [pid]: Number(e.target.value) }))} placeholder={t("sessions.score")} className="rounded-lg flex-1 h-10" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium text-xs">{t("sessions.winner")}</Label>
                    <Select value={winnerId} onValueChange={setWinnerId}>
                      <SelectTrigger className="rounded-lg mt-1 h-11"><SelectValue placeholder={t("sessions.selectWinner")} /></SelectTrigger>
                      <SelectContent>
                        {selectedPlayerIds.map(pid => { const p = players.find(pl => pl.id === pid)!; return <SelectItem key={pid} value={pid}>{p.avatar} {p.name}</SelectItem>; })}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentTheme && (
                    <div>
                      <Label className="font-medium text-xs flex items-center gap-1">
                        {currentTheme.emoji} {currentTheme.name} {t("sessions.stats")} <span className="text-muted-foreground">{t("sessions.optional")}</span>
                      </Label>
                      <div className="space-y-3 mt-2">
                        {selectedPlayerIds.map(pid => {
                          const p = players.find(pl => pl.id === pid)!;
                          return (
                            <div key={pid} className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
                              <PlayerBadge player={p} size="sm" />
                              <div className="grid grid-cols-2 gap-1.5">
                                {currentTheme.customStats.map(stat => (
                                  <div key={stat.key}>
                                    <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">{stat.emoji} {stat.label}</label>
                                    <Input value={customStats[pid]?.[stat.key] || ""} onChange={e => handleCustomStat(pid, stat.key, e.target.value)} placeholder="—" className="rounded-md h-8 text-xs mt-0.5" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <Label className="font-medium text-xs">{t("sessions.notes")}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("sessions.notesPlaceholder")} className="rounded-lg mt-1" />
              </div>

              <Button onClick={editingSessionId ? handleSaveEdit : handleAdd} className="w-full rounded-lg font-semibold h-12" size="lg"
                disabled={!sessionName.trim() || !gameName.trim() || selectedPlayerIds.length < 2}>
                {editingSessionId ? t("sessions.saveChanges") : t("sessions.record")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {players.length < 2 && (
        <div className="game-card bg-secondary/50 text-center !p-4">
          <p className="text-sm text-muted-foreground font-medium">{t("sessions.minPlayers")}</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {[...sessions].reverse().map((session, i) => {
            const isExpanded = expandedId === session.id;
            const winner = session.results.find(r => r.isWinner);
            const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;
            const theme = getGameTheme(session.gameName);
            return (
              <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="game-card cursor-pointer !p-4" onClick={() => setExpandedId(isExpanded ? null : session.id)} whileTap={{ scale: 0.98 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{theme.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{session.name}</p>
                      <p className="text-xs text-muted-foreground">{session.gameName} · {new Date(session.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {winnerPlayer && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-md font-semibold flex items-center gap-1">🏆 {winnerPlayer.name}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); startEditSession(session); }} className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onRemoveSession(session.id); }} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="space-y-1.5">
                          {session.results.sort((a, b) => b.score - a.score).map(r => {
                            const p = players.find(pl => pl.id === r.playerId);
                            return p ? (
                              <div key={r.playerId} className="flex items-center justify-between">
                                <PlayerBadge player={p} size="sm" />
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{r.score} pts</span>
                                  {r.isWinner && <span className="text-xs">🏆</span>}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {session.notes && <p className="text-xs text-muted-foreground mt-2 italic">{session.notes}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎮</div>
          <p className="text-muted-foreground font-medium text-sm">{t("sessions.noSessions")}</p>
        </div>
      )}
    </div>
  );
}
