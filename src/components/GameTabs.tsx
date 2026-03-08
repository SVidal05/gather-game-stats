import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Gamepad2, Calendar, Plus, Trash2 } from "lucide-react";
import { Player, GameSession, PlayerStats, PLAYER_COLORS, PLAYER_AVATARS, POPULAR_GAMES, PlayerResult } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { PlayerBadge } from "@/components/PlayerBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import confetti from "canvas-confetti";

// ─── Dashboard Tab ────────────────────────────────
export function DashboardTab({ players, sessions }: { players: Player[]; sessions: GameSession[] }) {
  const stats = getPlayerStats(players, sessions);
  const topPlayer = stats.length > 0 ? stats.reduce((a, b) => a.wins > b.wins ? a : b) : null;
  const uniqueGames = new Set(sessions.map(s => s.gameName)).size;

  const statCards = [
    { icon: Calendar, label: "Sessions", value: sessions.length, color: "var(--game-purple)" },
    { icon: Users, label: "Players", value: players.length, color: "var(--game-blue)" },
    { icon: Gamepad2, label: "Games", value: uniqueGames, color: "var(--game-green)" },
    { icon: Trophy, label: "Top Winner", value: topPlayer?.player.name || "—", color: "var(--game-orange)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Your group's game night stats</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <stat.icon className="w-6 h-6" style={{ color: `hsl(${stat.color})` }} />
            <span className="text-2xl font-extrabold text-foreground">{stat.value}</span>
            <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {topPlayer && topPlayer.wins > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">👑</div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Leader</p>
              <div className="flex items-center gap-2 mt-1">
                <PlayerBadge player={topPlayer.player} size="md" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {topPlayer.wins} wins · {topPlayer.winRate.toFixed(0)}% win rate
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {sessions.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {sessions.slice(-3).reverse().map(session => (
              <div key={session.id} className="game-card !p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-foreground">{session.name}</p>
                    <p className="text-xs text-muted-foreground">{session.gameName} · {new Date(session.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex -space-x-2">
                    {session.results.slice(0, 4).map(r => {
                      const p = players.find(pl => pl.id === r.playerId);
                      return p ? (
                        <div
                          key={r.playerId}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 border-card"
                          style={{ backgroundColor: p.color + "33" }}
                        >
                          {p.avatar}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && players.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-6xl mb-4">🎲</div>
          <h3 className="text-lg font-bold text-foreground">Welcome to GameNight!</h3>
          <p className="text-sm text-muted-foreground mt-1">Start by adding players, then create your first session.</p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────
export function PlayersTab({
  players, sessions, onAddPlayer, onRemovePlayer,
}: {
  players: Player[]; sessions: GameSession[];
  onAddPlayer: (p: Omit<Player, "id" | "createdAt">) => void;
  onRemovePlayer: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PLAYER_COLORS[0].value);
  const [avatar, setAvatar] = useState(PLAYER_AVATARS[0]);
  const stats = getPlayerStats(players, sessions);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddPlayer({ name: name.trim(), color, avatar });
    setName("");
    setColor(PLAYER_COLORS[(players.length + 1) % PLAYER_COLORS.length].value);
    setAvatar(PLAYER_AVATARS[(players.length + 1) % PLAYER_AVATARS.length]);
    setOpen(false);
  };

  // Badges
  const getBadges = (ps: PlayerStats) => {
    const badges: string[] = [];
    if (ps.wins > 0 && stats.every(s => s.wins <= ps.wins)) badges.push("👑 Most Wins");
    if (ps.gamesPlayed >= 5 && ps.winRate >= 60) badges.push("🔥 On Fire");
    if (ps.gamesPlayed >= 10) badges.push("🎖️ Veteran");
    if (ps.totalPoints > 0 && stats.every(s => s.totalPoints <= ps.totalPoints)) badges.push("💎 Top Scorer");
    return badges;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Players</h2>
          <p className="text-muted-foreground text-sm mt-1">{players.length} player{players.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl gap-2 font-bold">
              <Plus className="w-5 h-5" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-extrabold">New Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Player name" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Avatar</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PLAYER_AVATARS.map(a => (
                    <button
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${avatar === a ? "ring-2 ring-primary bg-primary/10 scale-110" : "bg-secondary hover:bg-secondary/80"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-semibold">Color</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PLAYER_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-10 h-10 rounded-xl transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl font-bold" size="lg" disabled={!name.trim()}>
                Add Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {stats.map((ps, i) => (
            <motion.div
              key={ps.player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: i * 0.05 }}
              className="game-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: ps.player.color + "22", border: `2px solid ${ps.player.color}` }}
                  >
                    {ps.player.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{ps.player.name}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{ps.gamesPlayed} games</span>
                      <span>{ps.wins} wins</span>
                      <span>{ps.winRate.toFixed(0)}%</span>
                      <span>{ps.totalPoints} pts</span>
                    </div>
                    {getBadges(ps).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {getBadges(ps).map(b => (
                          <span key={b} className="text-xs bg-secondary px-2 py-0.5 rounded-full font-semibold">{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => onRemovePlayer(ps.player.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {players.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-muted-foreground font-semibold">No players yet. Add your first player!</p>
        </div>
      )}
    </div>
  );
}

// ─── Sessions Tab ─────────────────────────────────
export function SessionsTab({
  players, sessions, onAddSession, onRemoveSession,
}: {
  players: Player[]; sessions: GameSession[];
  onAddSession: (s: Omit<GameSession, "id" | "createdAt">) => void;
  onRemoveSession: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [gameName, setGameName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [winnerId, setWinnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    });

    // Confetti!
    if (winnerId) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    setSessionName("");
    setGameName("");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedPlayerIds([]);
    setScores({});
    setWinnerId("");
    setNotes("");
    setOpen(false);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Sessions</h2>
          <p className="text-muted-foreground text-sm mt-1">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl gap-2 font-bold" disabled={players.length < 2}>
              <Plus className="w-5 h-5" /> New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-extrabold">New Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Session Name</Label>
                <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Friday Night Showdown" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Game</Label>
                <Select value={gameName} onValueChange={setGameName}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_GAMES.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={gameName} onChange={e => setGameName(e.target.value)} placeholder="Or type a custom game" className="rounded-xl mt-2" />
              </div>
              <div>
                <Label className="font-semibold">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="font-semibold">Players</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {players.map(p => (
                    <button
                      key={p.id}
                      onClick={() => togglePlayer(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                        selectedPlayerIds.includes(p.id) ? "ring-2 ring-offset-1" : "opacity-50"
                      }`}
                      style={{
                        backgroundColor: p.color + "22",
                        color: p.color,
                        ...(selectedPlayerIds.includes(p.id) ? { ringColor: p.color } : {}),
                      }}
                    >
                      {p.avatar} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlayerIds.length > 0 && (
                <>
                  <div>
                    <Label className="font-semibold">Scores</Label>
                    <div className="space-y-2 mt-1">
                      {selectedPlayerIds.map(pid => {
                        const p = players.find(pl => pl.id === pid)!;
                        return (
                          <div key={pid} className="flex items-center gap-2">
                            <PlayerBadge player={p} size="sm" />
                            <Input
                              type="number"
                              value={scores[pid] || ""}
                              onChange={e => setScores(prev => ({ ...prev, [pid]: Number(e.target.value) }))}
                              placeholder="Score"
                              className="rounded-xl flex-1"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Winner</Label>
                    <Select value={winnerId} onValueChange={setWinnerId}>
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue placeholder="Select winner" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPlayerIds.map(pid => {
                          const p = players.find(pl => pl.id === pid)!;
                          return (
                            <SelectItem key={pid} value={pid}>{p.avatar} {p.name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label className="font-semibold">Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any memorable moments?" className="rounded-xl mt-1" />
              </div>

              <Button onClick={handleAdd} className="w-full rounded-xl font-bold" size="lg"
                disabled={!sessionName.trim() || !gameName.trim() || selectedPlayerIds.length < 2}>
                🎉 Record Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {players.length < 2 && (
        <div className="game-card bg-secondary/50 text-center">
          <p className="text-sm text-muted-foreground font-semibold">Add at least 2 players to create a session.</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {[...sessions].reverse().map((session, i) => {
            const isExpanded = expandedId === session.id;
            const winner = session.results.find(r => r.isWinner);
            const winnerPlayer = winner ? players.find(p => p.id === winner.playerId) : null;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="game-card cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{session.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.gameName} · {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {winnerPlayer && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        🏆 {winnerPlayer.name}
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); onRemoveSession(session.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground text-xs">
                              <th className="text-left pb-2">Player</th>
                              <th className="text-right pb-2">Score</th>
                              <th className="text-right pb-2">Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.results.sort((a, b) => b.score - a.score).map(r => {
                              const p = players.find(pl => pl.id === r.playerId);
                              if (!p) return null;
                              return (
                                <tr key={r.playerId} className="border-t border-border/50">
                                  <td className="py-2"><PlayerBadge player={p} size="sm" /></td>
                                  <td className="text-right font-bold">{r.score}</td>
                                  <td className="text-right">{r.isWinner ? "🏆" : ""}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {session.notes && (
                          <p className="text-xs text-muted-foreground mt-3 italic">📝 {session.notes}</p>
                        )}
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
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎮</div>
          <p className="text-muted-foreground font-semibold">No sessions yet. Start a game night!</p>
        </div>
      )}
    </div>
  );
}
