import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Swords, Crown, Check, X, Trash2, ChevronRight } from "lucide-react";
import { Player, POPULAR_GAMES } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerBadge } from "@/components/PlayerBadge";
import { getGameTheme } from "@/lib/gameThemes";

interface Tournament {
  id: string;
  groupId: string;
  name: string;
  gameName: string;
  status: "active" | "completed";
  createdBy: string;
  createdAt: string;
}

interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchOrder: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  player1Score: number;
  player2Score: number;
  completed: boolean;
}

interface TournamentTabProps {
  groupId: string;
  players: Player[];
}

export function TournamentTab({ groupId, players }: TournamentTabProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGame, setNewGame] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const fetchTournaments = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (data) {
      setTournaments(data.map((t: any) => ({
        id: t.id, groupId: t.group_id, name: t.name, gameName: t.game_name,
        status: t.status, createdBy: t.created_by, createdAt: t.created_at,
      })));
    }
    setLoading(false);
  }, [groupId]);

  const fetchMatches = useCallback(async (tournamentId: string) => {
    const { data } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true })
      .order("match_order", { ascending: true });
    if (data) {
      setMatches(data.map((m: any) => ({
        id: m.id, tournamentId: m.tournament_id, round: m.round, matchOrder: m.match_order,
        player1Id: m.player1_id, player2Id: m.player2_id, winnerId: m.winner_id,
        player1Score: m.player1_score, player2Score: m.player2_score, completed: m.completed,
      })));
    }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const generateBracket = (playerIds: string[]): { round: number; matchOrder: number; player1Id: string | null; player2Id: string | null }[] => {
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
    const padded = [...shuffled, ...Array(bracketSize - shuffled.length).fill(null)];
    const matchesList: { round: number; matchOrder: number; player1Id: string | null; player2Id: string | null }[] = [];
    
    for (let i = 0; i < padded.length; i += 2) {
      matchesList.push({ round: 1, matchOrder: i / 2, player1Id: padded[i], player2Id: padded[i + 1] });
    }

    const totalRounds = Math.ceil(Math.log2(bracketSize));
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let j = 0; j < matchesInRound; j++) {
        matchesList.push({ round, matchOrder: j, player1Id: null, player2Id: null });
      }
    }
    return matchesList;
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newGame.trim() || selectedPlayerIds.length < 2 || !user) return;
    const { data: t } = await supabase
      .from("tournaments")
      .insert({ group_id: groupId, name: newName.trim(), game_name: newGame.trim(), created_by: user.id })
      .select().single();
    if (!t) return;

    const bracket = generateBracket(selectedPlayerIds);
    const matchInserts = bracket.map(m => ({
      tournament_id: t.id, round: m.round, match_order: m.matchOrder,
      player1_id: m.player1Id, player2_id: m.player2Id,
      completed: !m.player1Id || !m.player2Id,
      winner_id: !m.player2Id && m.player1Id ? m.player1Id : !m.player1Id && m.player2Id ? m.player2Id : null,
    }));
    await supabase.from("tournament_matches").insert(matchInserts);

    setCreateOpen(false);
    setNewName(""); setNewGame(""); setSelectedPlayerIds([]);
    fetchTournaments();
  };

  const openMatch = (match: TournamentMatch) => {
    if (match.completed || !match.player1Id || !match.player2Id) return;
    setEditingMatch(match);
    setP1Score(match.player1Score);
    setP2Score(match.player2Score);
    setMatchDialogOpen(true);
  };

  const saveMatchResult = async (winnerId: string) => {
    if (!editingMatch) return;
    await supabase.from("tournament_matches")
      .update({ winner_id: winnerId, player1_score: p1Score, player2_score: p2Score, completed: true })
      .eq("id", editingMatch.id);

    // Advance winner to next round
    const nextRound = editingMatch.round + 1;
    const nextMatchOrder = Math.floor(editingMatch.matchOrder / 2);
    const isFirstInPair = editingMatch.matchOrder % 2 === 0;

    const nextMatch = matches.find(m => m.round === nextRound && m.matchOrder === nextMatchOrder);
    if (nextMatch) {
      const update = isFirstInPair ? { player1_id: winnerId } : { player2_id: winnerId };
      await supabase.from("tournament_matches").update(update).eq("id", nextMatch.id);
    }

    setMatchDialogOpen(false);
    setEditingMatch(null);
    if (selectedTournament) fetchMatches(selectedTournament.id);
  };

  const completeTournament = async (tournamentId: string) => {
    await supabase.from("tournaments").update({ status: "completed" }).eq("id", tournamentId);
    fetchTournaments();
  };

  const getPlayer = (id: string | null) => players.find(p => p.id === id);

  // Tournament Detail View
  if (selectedTournament) {
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
    const champion = matches.length > 0
      ? matches.filter(m => m.round === Math.max(...matches.map(mm => mm.round)) && m.completed)[0]?.winnerId
      : null;
    const championPlayer = champion ? getPlayer(champion) : null;
    const allCompleted = matches.every(m => m.completed);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedTournament(null)} className="p-1.5 rounded-xl bg-secondary text-foreground active:scale-90">
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-foreground">{selectedTournament.name}</h2>
            <p className="text-muted-foreground text-xs">{getGameTheme(selectedTournament.gameName).emoji} {selectedTournament.gameName}</p>
          </div>
          {allCompleted && selectedTournament.status === "active" && (
            <Button size="sm" className="rounded-xl" onClick={() => completeTournament(selectedTournament.id)}>
              <Crown className="w-3.5 h-3.5 mr-1" /> Finish
            </Button>
          )}
        </div>

        {/* Champion */}
        {championPlayer && allCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="game-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 text-center !py-5">
            <div className="text-4xl mb-2">👑</div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Champion</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-2xl">{championPlayer.avatar}</span>
              <span className="text-lg font-extrabold text-foreground">{championPlayer.name}</span>
            </div>
          </motion.div>
        )}

        {/* Bracket */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {rounds.map(round => {
              const roundMatches = matches.filter(m => m.round === round);
              return (
                <div key={round} className="flex flex-col gap-2 min-w-[160px]">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase text-center">
                    {round === Math.max(...rounds) ? "Final" : round === Math.max(...rounds) - 1 ? "Semifinal" : `Round ${round}`}
                  </h4>
                  {roundMatches.map((match, i) => {
                    const p1 = getPlayer(match.player1Id);
                    const p2 = getPlayer(match.player2Id);
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`game-card !p-2 cursor-pointer ${!match.completed && match.player1Id && match.player2Id ? "hover:ring-2 hover:ring-primary/50" : ""}`}
                        onClick={() => openMatch(match)}
                      >
                        <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg ${match.winnerId === match.player1Id ? "bg-accent/10" : ""}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{p1?.avatar || "—"}</span>
                            <span className="text-[11px] font-bold text-foreground">{p1?.name || "TBD"}</span>
                          </div>
                          {match.completed && <span className="text-[10px] font-bold text-foreground">{match.player1Score}</span>}
                        </div>
                        <div className="border-t border-border/50 my-0.5" />
                        <div className={`flex items-center justify-between py-1 px-1.5 rounded-lg ${match.winnerId === match.player2Id ? "bg-accent/10" : ""}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{p2?.avatar || "—"}</span>
                            <span className="text-[11px] font-bold text-foreground">{p2?.name || "TBD"}</span>
                          </div>
                          {match.completed && <span className="text-[10px] font-bold text-foreground">{match.player2Score}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Match Result Dialog */}
        <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
          <DialogContent className="rounded-3xl mx-4 max-w-[calc(100vw-2rem)]">
            <DialogHeader><DialogTitle className="font-extrabold">Match Result</DialogTitle></DialogHeader>
            {editingMatch && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[{ id: editingMatch.player1Id, score: p1Score, setScore: setP1Score },
                    { id: editingMatch.player2Id, score: p2Score, setScore: setP2Score }].map((side, i) => {
                    const p = getPlayer(side.id);
                    return (
                      <div key={i} className="text-center space-y-2">
                        <div className="text-2xl">{p?.avatar}</div>
                        <p className="font-bold text-sm text-foreground">{p?.name}</p>
                        <Input type="number" value={side.score} onChange={e => side.setScore(Number(e.target.value))} className="rounded-xl text-center h-12 text-lg font-bold" />
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-xs">Select Winner</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[editingMatch.player1Id, editingMatch.player2Id].filter(Boolean).map(id => {
                      const p = getPlayer(id!);
                      return (
                        <Button key={id} variant="outline" className="rounded-xl h-12 gap-2 font-bold"
                          onClick={() => saveMatchResult(id!)}>
                          <Crown className="w-4 h-4" /> {p?.avatar} {p?.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Tournament List
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">🏟️ Tournaments</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{tournaments.length} tournaments</p>
        </div>
        <Button className="rounded-2xl gap-2 font-bold h-11 text-sm" onClick={() => setCreateOpen(true)} disabled={players.length < 2}>
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>

      {/* Active */}
      {tournaments.filter(t => t.status === "active").map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="game-card !p-3 cursor-pointer" onClick={() => { setSelectedTournament(t); fetchMatches(t.id); }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Swords className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{getGameTheme(t.gameName).emoji} {t.gameName} · Active</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
      ))}

      {/* Completed */}
      {tournaments.filter(t => t.status === "completed").length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground mb-2">Completed</h3>
          {tournaments.filter(t => t.status === "completed").map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card !p-3 opacity-70 cursor-pointer mb-2"
              onClick={() => { setSelectedTournament(t); fetchMatches(t.id); }}>
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.gameName}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="text-center py-10">
          <div className="text-4xl mb-2">⚔️</div>
          <p className="text-muted-foreground font-semibold text-sm">No tournaments yet</p>
          <p className="text-muted-foreground text-xs mt-1">Create one to start competing!</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-extrabold">New Tournament</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-semibold text-xs">Tournament Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Championship 2026" className="rounded-xl mt-1 h-11" />
            </div>
            <div>
              <Label className="font-semibold text-xs">Game</Label>
              <Select value={newGame} onValueChange={setNewGame}>
                <SelectTrigger className="rounded-xl mt-1 h-11"><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>
                  {POPULAR_GAMES.map(g => <SelectItem key={g} value={g}>{getGameTheme(g).emoji} {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-xs">Players (min 2)</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {players.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlayerIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      selectedPlayerIds.includes(p.id) ? "ring-2 ring-offset-1" : "opacity-40"
                    }`}
                    style={{ backgroundColor: p.color + "22", color: p.color }}>
                    {p.avatar} {p.name}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full rounded-2xl h-12 font-bold" disabled={!newName.trim() || !newGame || selectedPlayerIds.length < 2}>
              <Swords className="w-4 h-4 mr-2" /> Create Tournament
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
