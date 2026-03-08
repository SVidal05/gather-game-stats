import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Users, Gamepad2, Calendar, ArrowLeft, Copy, Check, Share2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface SharePlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

interface ShareSession {
  id: string;
  name: string;
  date: string;
  game_name: string;
}

interface ShareResult {
  session_id: string;
  player_id: string;
  score: number;
  is_winner: boolean;
}

interface ShareData {
  group: { id: string; name: string } | null;
  players: SharePlayer[];
  sessions: ShareSession[];
  results: ShareResult[];
}

export default function SharePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const fetchData = async () => {
      const { data: result, error } = await supabase.rpc("get_group_share_data", { _group_id: groupId });
      if (!error && result) {
        setData(result as any);
      }
      setLoading(false);
    };
    fetchData();
  }, [groupId]);

  const stats = useMemo(() => {
    if (!data) return [];
    return data.players.map(player => {
      const playerResults = data.results.filter(r => r.player_id === player.id);
      const wins = playerResults.filter(r => r.is_winner).length;
      const totalPoints = playerResults.reduce((sum, r) => sum + r.score, 0);
      const gamesPlayed = new Set(playerResults.map(r => r.session_id)).size;
      return {
        player,
        gamesPlayed,
        wins,
        winRate: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
        totalPoints,
      };
    }).sort((a, b) => b.wins - a.wins);
  }, [data]);

  const uniqueGames = useMemo(() => {
    if (!data) return 0;
    return new Set(data.sessions.map(s => s.game_name)).size;
  }, [data]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `${data?.group?.name} - GameNight Leaderboard`,
        url: window.location.href,
      });
    } else {
      copyLink();
    }
  };

  const exportAsImage = () => {
    const el = document.getElementById("share-leaderboard");
    if (!el) return;
    // Use html2canvas-like approach with SVG foreignObject
    toast({ title: "📸", description: "Take a screenshot of this page to share!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-foreground">Group not found</h1>
          <Link to="/" className="text-primary text-sm font-bold hover:underline mt-3 block">← Back to GameNight</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GameNight" className="w-7 h-7" />
            <h1 className="text-lg font-extrabold text-foreground">GameNight</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs" onClick={copyLink}>
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied!" : "Copy link"}
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5 text-xs" onClick={shareNative}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-6" id="share-leaderboard">
        {/* Group Name */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold text-foreground">{data.group.name}</h2>
          <p className="text-muted-foreground text-xs mt-1">GameNight Leaderboard</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-2 mb-5">
          {[
            { icon: "🎮", value: data.sessions.length, label: "Sessions" },
            { icon: "👥", value: data.players.length, label: "Players" },
            { icon: "🎲", value: uniqueGames, label: "Games" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xl font-extrabold text-foreground">{stat.value}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" /> Leaderboard
          </h3>
          <div className="game-card overflow-hidden !p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-[10px] border-b border-border bg-secondary/30">
                  <th className="text-left p-2.5">#</th>
                  <th className="text-left p-2.5">Player</th>
                  <th className="text-right p-2.5">Games</th>
                  <th className="text-right p-2.5">Wins</th>
                  <th className="text-right p-2.5">Win%</th>
                  <th className="text-right p-2.5">Pts</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((ps, i) => (
                  <motion.tr
                    key={ps.player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="p-2.5 font-extrabold text-muted-foreground text-[10px]">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{ps.player.avatar}</span>
                        <span className="font-bold text-foreground">{ps.player.name}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-bold">{ps.gamesPlayed}</td>
                    <td className="p-2.5 text-right font-bold">{ps.wins}</td>
                    <td className="p-2.5 text-right font-bold">{ps.winRate.toFixed(0)}%</td>
                    <td className="p-2.5 text-right font-bold">{ps.totalPoints}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Sessions */}
        {data.sessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5">
            <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Recent Sessions
            </h3>
            <div className="space-y-2">
              {data.sessions.slice(0, 5).map(session => {
                const sessionResults = data.results.filter(r => r.session_id === session.id);
                const winner = sessionResults.find(r => r.is_winner);
                const winnerPlayer = winner ? data.players.find(p => p.id === winner.player_id) : null;
                return (
                  <div key={session.id} className="game-card !p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-foreground">{session.name}</p>
                        <p className="text-[10px] text-muted-foreground">{session.game_name} · {new Date(session.date).toLocaleDateString()}</p>
                      </div>
                      {winnerPlayer && (
                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                          🏆 {winnerPlayer.avatar} {winnerPlayer.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px]">
            <img src={logo} alt="" className="w-4 h-4 opacity-50" />
            <span>Powered by GameNight Tracker</span>
          </div>
        </div>
      </main>
    </div>
  );
}
