import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, Gamepad2, Users, Dice5, Lock, Sparkles, Shield, Globe, UsersRound, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Player, GameSession } from "@/lib/types";
import { isImageAvatar } from "@/lib/avatarOptions";
import { getPlayerStats } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Achievement, AchievementCategory, AchievementRarity, AchievementScope,
  GLOBAL_ACHIEVEMENTS, GROUP_ACHIEVEMENTS,
  RARITY_CONFIG, CATEGORY_CONFIG, PLAYER_TITLES,
  calculateXP, calculateGroupXP, getLevel, getXPProgress, getUnlockedTitles,
  sortAchievements, evaluateGroupAchievement, evaluateGroupAchievementProgress,
} from "@/lib/achievements";

interface ProfileTabProps {
  players: Player[];        // current group players
  sessions: GameSession[];  // current group sessions
  globalPlayers: Player[];  // all players across groups
  globalSessions: GameSession[]; // all sessions across groups
  isDark: boolean;
  onToggleDark: () => void;
}

function RarityBadge({ rarity, lang }: { rarity: AchievementRarity; lang: string }) {
  const cfg = RARITY_CONFIG[rarity];
  return (
    <span
      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
      style={{ color: `hsl(${cfg.hsl})`, background: `hsl(${cfg.bg} / 0.12)` }}
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

function ScopeBadge({ scope, lang }: { scope: AchievementScope; lang: string }) {
  const isGlobal = scope === "global";
  return (
    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
      isGlobal ? "text-[hsl(var(--game-cyan))] bg-[hsl(var(--game-cyan))]/10" : "text-[hsl(var(--game-orange))] bg-[hsl(var(--game-orange))]/10"
    }`}>
      {isGlobal
        ? (lang === "es" ? "Global" : "Global")
        : (lang === "es" ? "Grupo" : lang === "fr" ? "Groupe" : "Group")}
    </span>
  );
}

function AchievementCard({ achievement, unlocked, players, sessions, lang, index, linkedPlayer }: {
  achievement: Achievement; unlocked: boolean; players: Player[]; sessions: GameSession[]; lang: string; index: number; linkedPlayer?: Player | null;
}) {
  const isHidden = achievement.hidden && !unlocked;
  
  // For individual/competitive group achievements, show progress for the linked player only
  const isPerPlayer = achievement.scope === "group" && (achievement.groupType === "individual" || achievement.groupType === "competitive");
  let progress: number;
  if (isPerPlayer && linkedPlayer) {
    progress = evaluateGroupAchievementProgress(achievement, players, sessions, linkedPlayer);
  } else if (isPerPlayer && !linkedPlayer) {
    progress = 0;
  } else {
    progress = achievement.progress(players, sessions);
  }
  
  const Icon = achievement.icon;
  const rarityColor = RARITY_CONFIG[achievement.rarity].hsl;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.45, delay: Math.min(index * 0.04, 0.4) }}
      className={`game-card !p-4 ${!unlocked ? "opacity-60" : ""}`}
      style={unlocked ? { borderLeft: `3px solid hsl(${rarityColor})` } : undefined}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: unlocked ? `hsl(${rarityColor} / 0.12)` : undefined }}
        >
          {isHidden ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Icon className="w-5 h-5" style={{ color: unlocked ? `hsl(${rarityColor})` : undefined }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm text-foreground truncate">
              {isHidden ? "???" : (achievement.titles[lang] || achievement.titles.en)}
            </p>
            <RarityBadge rarity={achievement.rarity} lang={lang} />
            <XPBadge xp={achievement.xp} />
            <ScopeBadge scope={achievement.scope} lang={lang} />
            {isPerPlayer && (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md text-[hsl(var(--game-purple))] bg-[hsl(var(--game-purple))]/10">
                {lang === "es" ? "Individual" : "Individual"}
              </span>
            )}
            {unlocked && <Sparkles className="w-3 h-3 text-warning shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHidden
              ? (lang === "es" ? "Desbloquéalo para descubrirlo" : lang === "fr" ? "Débloquez-le pour le découvrir" : "Unlock to discover")
              : (achievement.descriptions[lang] || achievement.descriptions.en)}
          </p>
          {!isHidden && (
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.02 }}
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
}

export function ProfileTab({ players, sessions, globalPlayers, globalSessions }: ProfileTabProps) {
  const { lang, t } = useI18n();
  const { user, username } = useAuth();

  // Find the user's linked player in the current group
  const linkedPlayer = useMemo(() => 
    user ? players.find(p => p.linkedUserId === user.id) || null : null,
    [players, user]
  );

  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<AchievementScope | "all">("all");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const [titleLoaded, setTitleLoaded] = useState(false);

  // Load persisted title from DB
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("selected_title").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.selected_title) setSelectedTitle(data.selected_title);
        setTitleLoaded(true);
      });
  }, [user]);

  // Save title when changed
  const handleSelectTitle = useCallback((titleId: string) => {
    setSelectedTitle(titleId);
    if (!user) return;
    supabase.from("profiles").update({ selected_title: titleId } as any).eq("user_id", user.id).then();
  }, [user]);

  // Global XP from global achievements
  const globalXP = useMemo(() => calculateXP(globalPlayers, globalSessions), [globalPlayers, globalSessions]);
  // Group XP from group achievements (per-player for individual achievements)
  const groupXP = useMemo(() => calculateGroupXP(players, sessions, linkedPlayer), [players, sessions, linkedPlayer]);
  const totalXP = globalXP + groupXP;

  const levelInfo = useMemo(() => getLevel(totalXP), [totalXP]);
  const xpProgress = useMemo(() => getXPProgress(totalXP), [totalXP]);
  const unlockedTitles = useMemo(() => getUnlockedTitles(globalPlayers, globalSessions), [globalPlayers, globalSessions]);

  const globalUnlockedIds = useMemo(() =>
    new Set(GLOBAL_ACHIEVEMENTS.filter(a => a.condition(globalPlayers, globalSessions)).map(a => a.id)),
    [globalPlayers, globalSessions]
  );
  const groupUnlockedIds = useMemo(() =>
    new Set(GROUP_ACHIEVEMENTS.filter(a => evaluateGroupAchievement(a, players, sessions, linkedPlayer)).map(a => a.id)),
    [players, sessions, linkedPlayer]
  );
  const allUnlockedIds = useMemo(() => new Set([...globalUnlockedIds, ...groupUnlockedIds]), [globalUnlockedIds, groupUnlockedIds]);

  const animatedXP = useCountUp(totalXP, 1500);
  const animatedLevel = useCountUp(levelInfo.level, 800);
  const uniqueGames = new Set(globalSessions.map(s => s.gameName)).size;

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let list: Achievement[] = [];
    if (scopeFilter === "global" || scopeFilter === "all") list.push(...GLOBAL_ACHIEVEMENTS);
    if (scopeFilter === "group" || scopeFilter === "all") list.push(...GROUP_ACHIEVEMENTS);
    if (activeCategory !== "all") list = list.filter(a => a.category === activeCategory);
    return sortAchievements(list, allUnlockedIds);
  }, [activeCategory, scopeFilter, allUnlockedIds]);

  // Group XP leaderboard — per-player XP
  const leaderboardData = useMemo(() => {
    const stats = getPlayerStats(players, sessions);
    return stats
      .map(ps => {
        const playerGroupXP = calculateGroupXP(players, sessions, ps.player);
        // Only add globalXP if this player is linked to the current user
        const playerGlobalXP = ps.player.linkedUserId === user?.id ? globalXP : 0;
        const playerTotalXP = playerGlobalXP + playerGroupXP;
        const playerLevel = getLevel(playerTotalXP);
        return {
          player: ps.player,
          wins: ps.wins,
          gamesPlayed: ps.gamesPlayed,
          totalXP: playerTotalXP,
          level: playerLevel,
        };
      })
      .sort((a, b) => b.totalXP - a.totalXP || b.wins - a.wins);
  }, [players, sessions, globalXP, user]);

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

  const totalAchievements = GLOBAL_ACHIEVEMENTS.length + GROUP_ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      {/* ── Header with Level ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          background: `radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.4), transparent 60%),
                       radial-gradient(ellipse at 80% 80%, hsl(var(--gold) / 0.3), transparent 50%)`,
        }} />
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
              <motion.circle
                cx="36" cy="36" r="30" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4" strokeLinecap="round"
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
              <span className="text-[10px] font-bold text-muted-foreground shrink-0">{animatedXP} XP</span>
            </div>
            <div className="flex gap-3 mt-1">
              <p className="text-[9px] text-muted-foreground">
                {xpProgress.progress < 100
                  ? `${xpProgress.current} / ${xpProgress.nextLevel} XP`
                  : (lang === "es" ? "¡Nivel máximo!" : "Max level!")}
              </p>
              <p className="text-[9px] text-[hsl(var(--game-cyan))]">
                <Globe className="w-2.5 h-2.5 inline mr-0.5" />{globalXP} XP
              </p>
              <p className="text-[9px] text-[hsl(var(--game-orange))]">
                <UsersRound className="w-2.5 h-2.5 inline mr-0.5" />{groupXP} XP
              </p>
            </div>
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
              <button key={title.id} onClick={() => handleSelectTitle(title.id)}
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
            { label: t("profile.totalSessions"), value: globalSessions.length, icon: Gamepad2, color: "text-primary" },
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

      {/* ── Group XP Leaderboard ── */}
      {leaderboardData.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card">
          <button
            onClick={() => setLeaderboardOpen(!leaderboardOpen)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
              {lang === "es" ? "Leaderboard del Grupo" : lang === "fr" ? "Classement du Groupe" : "Group Leaderboard"}
            </h3>
            {leaderboardOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {leaderboardOpen && (
            <div className="mt-3 space-y-1.5">
              {leaderboardData.map((entry, i) => (
                  <div key={entry.player.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      i === 0 ? "bg-[hsl(var(--gold))]/8 border border-[hsl(var(--gold))]/20" :
                      i === 1 ? "bg-[hsl(var(--silver))]/8 border border-[hsl(var(--silver))]/20" :
                      i === 2 ? "bg-[hsl(var(--bronze))]/8 border border-[hsl(var(--bronze))]/20" :
                      "bg-secondary/50"
                    }`}
                  >
                    <span className="text-xs font-black text-muted-foreground w-5 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm overflow-hidden" style={{ backgroundColor: entry.player.color + "22", border: `2px solid ${entry.player.color}` }}>
                      {isImageAvatar(entry.player.avatar) ? (
                        <img src={entry.player.avatar} alt={entry.player.name} className="w-full h-full object-cover" />
                      ) : (
                        entry.player.avatar
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground truncate">{entry.player.name}</p>
                        {entry.player.linkedUsername ? (
                          <span className="text-[8px] font-semibold text-primary bg-primary/10 px-1 py-0.5 rounded shrink-0">
                            🔗 {entry.player.linkedUsername}
                          </span>
                        ) : (
                          <span className="text-[8px] text-muted-foreground italic shrink-0">
                            —
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        Lv.{entry.level.level} · {entry.wins}W · {entry.gamesPlayed}G
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">{entry.totalXP} XP</p>
                      <p className="text-[9px] text-muted-foreground">{entry.level.title[lang] || entry.level.title.en}</p>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Achievements ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          {t("profile.achievements")}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-1 font-semibold">
            {allUnlockedIds.size}/{totalAchievements}
          </span>
          <span className="text-[10px] font-bold text-warning ml-auto">{totalXP} XP</span>
        </h3>

        {/* Scope filter */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide pb-1">
          {([
            { key: "all" as const, label: { es: "Todos", en: "All", fr: "Tous" } },
            { key: "global" as const, label: { es: "Global", en: "Global", fr: "Global" } },
            { key: "group" as const, label: { es: "Grupo", en: "Group", fr: "Groupe" } },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => setScopeFilter(key)}
              className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                scopeFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "global" && <Globe className="w-3 h-3" />}
              {key === "group" && <UsersRound className="w-3 h-3" />}
              {label[lang as keyof typeof label] || label.en}
            </button>
          ))}
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setActiveCategory("all")}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all ${
              activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang === "es" ? "Todos" : lang === "fr" ? "Tous" : "All"}
          </button>
          {(Object.keys(CATEGORY_CONFIG) as AchievementCategory[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const CatIcon = cfg.icon;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                  activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
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
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredAchievements.map((achievement, i) => {
              const unlocked = allUnlockedIds.has(achievement.id);
              const achPlayers = achievement.scope === "global" ? globalPlayers : players;
              const achSessions = achievement.scope === "global" ? globalSessions : sessions;
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlocked}
                  players={achPlayers}
                  sessions={achSessions}
                  lang={lang}
                  index={i}
                  linkedPlayer={achievement.scope === "group" ? linkedPlayer : undefined}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
