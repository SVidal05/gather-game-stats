import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, Gamepad2, Users, Dice5, ChevronRight, Lock, Sparkles, Shield } from "lucide-react";
import { Player, GameSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCountUp } from "@/hooks/useCountUp";
import {
  ACHIEVEMENTS, Achievement, AchievementCategory, AchievementRarity,
  RARITY_CONFIG, CATEGORY_CONFIG, PLAYER_TITLES,
  calculateXP, getLevel, getXPProgress, getUnlockedTitles,
} from "@/lib/achievements";

interface ProfileTabProps {
  players: Player[];
  sessions: GameSession[];
  isDark: boolean;
  onToggleDark: () => void;
}

// ─── Small components ───

function RarityBadge({ rarity, lang }: { rarity: AchievementRarity; lang: string }) {
  const cfg = RARITY_CONFIG[rarity];
  return (
    <span
      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
      style={{
        color: `hsl(${cfg.hsl})`,
        background: `hsl(${cfg.bg} / 0.12)`,
      }}
    >
      {cfg.label[lang] || cfg.label.en}
    </span>
  );
}

function XPBadge({ xp }: { xp: number }) {
  return (
    <span className="text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-md">
      +{xp} XP
    </span>
  );
}

// ─── Main component ───

export function ProfileTab({ players, sessions }: ProfileTabProps) {
  const { lang, t } = useI18n();
  const { username } = useAuth();

  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const totalXP = useMemo(() => calculateXP(players, sessions), [players, sessions]);
  const levelInfo = useMemo(() => getLevel(totalXP), [totalXP]);
  const xpProgress = useMemo(() => getXPProgress(totalXP), [totalXP]);
  const unlockedTitles = useMemo(() => getUnlockedTitles(players, sessions), [players, sessions]);
  const unlockedIds = useMemo(() => new Set(ACHIEVEMENTS.filter(a => a.condition(players, sessions)).map(a => a.id)), [players, sessions]);

  const animatedXP = useCountUp(totalXP, 1500);
  const animatedLevel = useCountUp(levelInfo.level, 800);

  const uniqueGames = new Set(sessions.map(s => s.gameName)).size;

  const filteredAchievements = useMemo(() => {
    const list = activeCategory === "all" ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === activeCategory);
    // Sort: unlocked first, then by rarity (legendary > epic > rare > common)
    const rarityOrder: Record<AchievementRarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };
    return [...list].sort((a, b) => {
      const aU = unlockedIds.has(a.id) ? 1 : 0;
      const bU = unlockedIds.has(b.id) ? 1 : 0;
      if (aU !== bU) return bU - aU;
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });
  }, [activeCategory, unlockedIds]);

  const getStreakInfo = () => {
    let bestPlayer: Player | null = null;
    let bestStreak = 0;
    for (const player of players) {
      let streak = 0;
      let maxStreak = 0;
      for (const session of sessions) {
        const result = session.results.find(r => r.playerId === player.id);
        if (result?.isWinner) { streak++; maxStreak = Math.max(maxStreak, streak); } else if (result) { streak = 0; }
      }
      if (maxStreak > bestStreak) { bestStreak = maxStreak; bestPlayer = player; }
    }
    return { bestPlayer, bestStreak };
  };
  const streakInfo = getStreakInfo();

  const activeTitle = unlockedTitles.find(t => t.id === selectedTitle) || unlockedTitles[0];

  return (
    <div className="space-y-6">
      {/* ── Header with Level ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 opacity-20" style={{
          background: `radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.4), transparent 60%),
                       radial-gradient(ellipse at 80% 80%, hsl(var(--gold) / 0.3), transparent 50%)`,
        }} />

        <div className="relative flex items-center gap-4">
          {/* Level circle */}
          <div className="relative shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
              <motion.circle
                cx="36" cy="36" r="30" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 30}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - xpProgress.progress / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-display font-black text-foreground">{animatedLevel}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-foreground truncate">
              {username || t("profile.title")}
            </h2>
            {activeTitle && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: "hsl(var(--gold))" }}>
                ✦ {activeTitle.label[lang] || activeTitle.label.en}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {levelInfo.title[lang] || levelInfo.title.en} · Lv.{levelInfo.level}
            </p>

            {/* XP bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                {animatedXP} XP
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {xpProgress.progress < 100
                ? `${xpProgress.current} / ${xpProgress.nextLevel} XP`
                : (lang === "es" ? "¡Nivel máximo!" : lang === "fr" ? "Niveau max !" : "Max level!")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Titles selector ── */}
      {unlockedTitles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="game-card">
          <h3 className="text-sm font-display font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning" />
            {lang === "es" ? "Títulos" : lang === "fr" ? "Titres" : "Titles"}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {unlockedTitles.map(title => (
              <button
                key={title.id}
                onClick={() => setSelectedTitle(title.id)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  activeTitle?.id === title.id
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                ✦ {title.label[lang] || title.label.en}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── General Stats ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="game-card">
        <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" />
          {t("profile.stats")}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("profile.totalSessions"), value: sessions.length, icon: Gamepad2, color: "text-primary" },
            { label: t("profile.totalPlayers"), value: players.length, icon: Users, color: "text-[hsl(var(--game-blue))]" },
            { label: t("profile.totalGames"), value: uniqueGames, icon: Dice5, color: "text-[hsl(var(--game-purple))]" },
          ].map((item, i) => (
            <div key={i} className="text-center bg-secondary rounded-lg p-3">
              <item.icon className={`w-5 h-5 mx-auto ${item.color}`} />
              <div className="text-xl font-display font-bold text-foreground mt-1">{item.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{item.label}</div>
            </div>
          ))}
        </div>

        {streakInfo.bestPlayer && streakInfo.bestStreak > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-secondary rounded-lg p-3">
            <Flame className="w-5 h-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {lang === "es" ? "Mejor racha" : lang === "fr" ? "Meilleure série" : "Best streak"}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {streakInfo.bestPlayer.name} — {streakInfo.bestStreak} {t("dashboard.wins")}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Achievement Categories ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          {t("profile.achievements")}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-1 font-semibold">
            {unlockedIds.size}/{ACHIEVEMENTS.length}
          </span>
          <span className="text-[10px] font-bold text-warning ml-auto">{totalXP} XP</span>
        </h3>

        {/* Category filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang === "es" ? "Todos" : lang === "fr" ? "Tous" : "All"}
          </button>
          {(Object.keys(CATEGORY_CONFIG) as AchievementCategory[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const CatIcon = cfg.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <CatIcon className="w-3 h-3" />
                {cfg.label[lang] || cfg.label.en}
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filteredAchievements.map((achievement, i) => {
              const unlocked = unlockedIds.has(achievement.id);
              const isHidden = achievement.hidden && !unlocked;
              const progress = achievement.progress(players, sessions);
              const Icon = achievement.icon;
              const rarityColor = RARITY_CONFIG[achievement.rarity].hsl;

              return (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  className={`game-card !p-4 ${!unlocked ? "opacity-60" : ""}`}
                  style={unlocked ? {
                    borderLeft: `3px solid hsl(${rarityColor})`,
                  } : undefined}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: unlocked
                          ? `hsl(${rarityColor} / 0.12)`
                          : undefined,
                      }}
                    >
                      {isHidden ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Icon
                          className="w-5 h-5"
                          style={{ color: unlocked ? `hsl(${rarityColor})` : undefined }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {isHidden
                            ? (lang === "es" ? "??? Oculto" : lang === "fr" ? "??? Caché" : "??? Hidden")
                            : (achievement.titles[lang] || achievement.titles.en)}
                        </p>
                        <RarityBadge rarity={achievement.rarity} lang={lang} />
                        <XPBadge xp={achievement.xp} />
                        {unlocked && (
                          <Sparkles className="w-3 h-3 text-warning shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isHidden
                          ? (lang === "es" ? "Desbloquéalo para descubrirlo" : lang === "fr" ? "Débloquez-le pour le découvrir" : "Unlock to discover")
                          : (achievement.descriptions[lang] || achievement.descriptions.en)}
                      </p>
                      {/* Progress bar */}
                      {!isHidden && (
                        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + i * 0.02 }}
                            className="h-full rounded-full"
                            style={{
                              background: unlocked
                                ? `linear-gradient(90deg, hsl(${rarityColor}), hsl(${rarityColor} / 0.6))`
                                : "hsl(var(--muted-foreground) / 0.4)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
