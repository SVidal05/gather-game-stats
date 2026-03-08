import { motion } from "framer-motion";
import { Trophy, Star, Flame } from "lucide-react";
import { Player, GameSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

interface ProfileTabProps {
  players: Player[];
  sessions: GameSession[];
  isDark: boolean;
  onToggleDark: () => void;
}

interface Achievement {
  id: string;
  icon: string;
  titleKey: string;
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  condition: (players: Player[], sessions: GameSession[]) => boolean;
  progress: (players: Player[], sessions: GameSession[]) => number; // 0-100
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_session",
    icon: "🎲",
    titleKey: "first_session",
    titles: { es: "Primera Noche", en: "First Night", fr: "Première Soirée" },
    descriptions: { es: "Registra tu primera sesión", en: "Record your first session", fr: "Enregistrez votre première session" },
    condition: (_, s) => s.length >= 1,
    progress: (_, s) => Math.min(s.length / 1 * 100, 100),
  },
  {
    id: "five_sessions",
    icon: "🎮",
    titleKey: "five_sessions",
    titles: { es: "Entusiasta", en: "Enthusiast", fr: "Enthousiaste" },
    descriptions: { es: "Juega 5 sesiones", en: "Play 5 sessions", fr: "Jouez 5 sessions" },
    condition: (_, s) => s.length >= 5,
    progress: (_, s) => Math.min(s.length / 5 * 100, 100),
  },
  {
    id: "ten_sessions",
    icon: "🏆",
    titleKey: "ten_sessions",
    titles: { es: "Veterano", en: "Veteran", fr: "Vétéran" },
    descriptions: { es: "Juega 10 sesiones", en: "Play 10 sessions", fr: "Jouez 10 sessions" },
    condition: (_, s) => s.length >= 10,
    progress: (_, s) => Math.min(s.length / 10 * 100, 100),
  },
  {
    id: "squad",
    icon: "👥",
    titleKey: "squad",
    titles: { es: "El Escuadrón", en: "The Squad", fr: "L'Escouade" },
    descriptions: { es: "Agrega 4 jugadores", en: "Add 4 players", fr: "Ajoutez 4 joueurs" },
    condition: (p) => p.length >= 4,
    progress: (p) => Math.min(p.length / 4 * 100, 100),
  },
  {
    id: "big_party",
    icon: "🎉",
    titleKey: "big_party",
    titles: { es: "Gran Fiesta", en: "Big Party", fr: "Grande Fête" },
    descriptions: { es: "Agrega 8 jugadores", en: "Add 8 players", fr: "Ajoutez 8 joueurs" },
    condition: (p) => p.length >= 8,
    progress: (p) => Math.min(p.length / 8 * 100, 100),
  },
  {
    id: "variety",
    icon: "🎯",
    titleKey: "variety",
    titles: { es: "Variedad", en: "Variety", fr: "Variété" },
    descriptions: { es: "Juega 3 juegos diferentes", en: "Play 3 different games", fr: "Jouez à 3 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 3,
    progress: (_, s) => Math.min(new Set(s.map(x => x.gameName)).size / 3 * 100, 100),
  },
  {
    id: "collector",
    icon: "🗂️",
    titleKey: "collector",
    titles: { es: "Coleccionista", en: "Collector", fr: "Collectionneur" },
    descriptions: { es: "Juega 6 juegos diferentes", en: "Play 6 different games", fr: "Jouez à 6 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 6,
    progress: (_, s) => Math.min(new Set(s.map(x => x.gameName)).size / 6 * 100, 100),
  },
  {
    id: "dominator",
    icon: "👑",
    titleKey: "dominator",
    titles: { es: "Dominador", en: "Dominator", fr: "Dominateur" },
    descriptions: { es: "Un jugador gana 5+ veces", en: "One player wins 5+ times", fr: "Un joueur gagne 5+ fois" },
    condition: (p, s) => {
      const stats = getPlayerStats(p, s);
      return stats.some(st => st.wins >= 5);
    },
    progress: (p, s) => {
      const stats = getPlayerStats(p, s);
      const maxWins = Math.max(...stats.map(st => st.wins), 0);
      return Math.min(maxWins / 5 * 100, 100);
    },
  },
  {
    id: "high_scorer",
    icon: "💎",
    titleKey: "high_scorer",
    titles: { es: "Gran Anotador", en: "High Scorer", fr: "Grand Scoreur" },
    descriptions: { es: "Acumula 100+ puntos totales", en: "Accumulate 100+ total points", fr: "Accumulez 100+ points" },
    condition: (p, s) => {
      const stats = getPlayerStats(p, s);
      return stats.some(st => st.totalPoints >= 100);
    },
    progress: (p, s) => {
      const stats = getPlayerStats(p, s);
      const maxPts = Math.max(...stats.map(st => st.totalPoints), 0);
      return Math.min(maxPts / 100 * 100, 100);
    },
  },
  {
    id: "streak_master",
    icon: "🔥",
    titleKey: "streak_master",
    titles: { es: "Maestro de Rachas", en: "Streak Master", fr: "Maître des Séries" },
    descriptions: { es: "Un jugador gana 3 sesiones seguidas", en: "A player wins 3 sessions in a row", fr: "Un joueur gagne 3 sessions d'affilée" },
    condition: (p, s) => {
      for (const player of p) {
        let streak = 0;
        for (const session of s) {
          const result = session.results.find(r => r.playerId === player.id);
          if (result?.isWinner) {
            streak++;
            if (streak >= 3) return true;
          } else if (result) {
            streak = 0;
          }
        }
      }
      return false;
    },
    progress: (p, s) => {
      let maxStreak = 0;
      for (const player of p) {
        let streak = 0;
        for (const session of s) {
          const result = session.results.find(r => r.playerId === player.id);
          if (result?.isWinner) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
          } else if (result) {
            streak = 0;
          }
        }
      }
      return Math.min(maxStreak / 3 * 100, 100);
    },
  },
  {
    id: "night_owl",
    icon: "🦉",
    titleKey: "night_owl",
    titles: { es: "Noctámbulo", en: "Night Owl", fr: "Noctambule" },
    descriptions: { es: "Registra 20 sesiones", en: "Record 20 sessions", fr: "Enregistrez 20 sessions" },
    condition: (_, s) => s.length >= 20,
    progress: (_, s) => Math.min(s.length / 20 * 100, 100),
  },
  {
    id: "perfectionist",
    icon: "✨",
    titleKey: "perfectionist",
    titles: { es: "Perfeccionista", en: "Perfectionist", fr: "Perfectionniste" },
    descriptions: { es: "Un jugador con 80%+ de victorias (min 5 partidas)", en: "A player with 80%+ win rate (min 5 games)", fr: "Un joueur avec 80%+ de victoires (min 5 parties)" },
    condition: (p, s) => {
      const stats = getPlayerStats(p, s);
      return stats.some(st => st.gamesPlayed >= 5 && st.winRate >= 80);
    },
    progress: (p, s) => {
      const stats = getPlayerStats(p, s);
      const best = stats.filter(st => st.gamesPlayed >= 5);
      if (best.length === 0) return 0;
      const maxRate = Math.max(...best.map(st => st.winRate), 0);
      return Math.min(maxRate / 80 * 100, 100);
    },
  },
];

export function ProfileTab({ players, sessions, isDark, onToggleDark }: ProfileTabProps) {
  const { lang, setLang, t } = useI18n();
  const uniqueGames = new Set(sessions.map(s => s.gameName)).size;
  const unlockedCount = ACHIEVEMENTS.filter(a => a.condition(players, sessions)).length;

  // Find longest win streak per player
  const getStreakInfo = () => {
    let bestPlayer: Player | null = null;
    let bestStreak = 0;
    for (const player of players) {
      let streak = 0;
      let maxStreak = 0;
      for (const session of sessions) {
        const result = session.results.find(r => r.playerId === player.id);
        if (result?.isWinner) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else if (result) {
          streak = 0;
        }
      }
      if (maxStreak > bestStreak) {
        bestStreak = maxStreak;
        bestPlayer = player;
      }
    }
    return { bestPlayer, bestStreak };
  };

  const streakInfo = getStreakInfo();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-foreground">{t("profile.title")}</h2>
        <p className="text-muted-foreground text-xs mt-0.5">{t("profile.settings")}</p>
      </div>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card space-y-4"
      >
        {/* Language */}
        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-primary" />
            {t("profile.language")}
          </label>
          <div className="flex gap-1.5">
            {LANGUAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  lang === opt.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <span className="text-base">{opt.flag}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
            {isDark ? <Moon className="w-3.5 h-3.5 text-primary" /> : <Sun className="w-3.5 h-3.5 text-primary" />}
            {t("profile.theme")}
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => isDark && onToggleDark()}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                !isDark ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Sun className="w-4 h-4" />
              {t("profile.light")}
            </button>
            <button
              onClick={() => !isDark && onToggleDark()}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isDark ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Moon className="w-4 h-4" />
              {t("profile.dark")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* General Stats */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="game-card"
      >
        <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" style={{ color: "hsl(var(--game-yellow))" }} />
          {t("profile.stats")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("profile.totalSessions"), value: sessions.length, emoji: "🎮" },
            { label: t("profile.totalPlayers"), value: players.length, emoji: "👥" },
            { label: t("profile.totalGames"), value: uniqueGames, emoji: "🎲" },
          ].map((item, i) => (
            <div key={i} className="text-center bg-secondary/50 rounded-xl p-2.5">
              <div className="text-lg">{item.emoji}</div>
              <div className="text-lg font-extrabold text-foreground">{item.value}</div>
              <div className="text-[9px] text-muted-foreground font-semibold">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Best streak */}
        {streakInfo.bestPlayer && streakInfo.bestStreak > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-secondary/50 rounded-xl p-2.5">
            <Flame className="w-5 h-5" style={{ color: "hsl(var(--game-orange))" }} />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {lang === "es" ? "Mejor racha" : lang === "fr" ? "Meilleure série" : "Best streak"}
              </p>
              <p className="text-xs font-bold text-foreground">
                {streakInfo.bestPlayer.avatar} {streakInfo.bestPlayer.name} — {streakInfo.bestStreak} {t("dashboard.wins")}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" style={{ color: "hsl(var(--game-purple))" }} />
          {t("profile.achievements")}
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </h3>
        <div className="grid gap-2">
          {ACHIEVEMENTS.map((achievement, i) => {
            const unlocked = achievement.condition(players, sessions);
            const progress = achievement.progress(players, sessions);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.03 }}
                className={`game-card !p-3 ${!unlocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                    unlocked ? "bg-primary/15" : "bg-secondary"
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-foreground truncate">
                        {achievement.titles[lang] || achievement.titles["en"]}
                      </p>
                      {unlocked && (
                        <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold shrink-0">
                          ✓ {t("profile.unlocked")}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {achievement.descriptions[lang] || achievement.descriptions["en"]}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.03 }}
                        className="h-full rounded-full"
                        style={{
                          background: unlocked
                            ? "linear-gradient(90deg, hsl(var(--game-green)), hsl(var(--accent)))"
                            : "hsl(var(--muted-foreground))",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
