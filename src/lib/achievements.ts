import { Dice5, Gamepad2, Trophy, Users, PartyPopper, Target, FolderOpen, Crown, Gem, Flame, Eye, Sparkles, Swords, Shield, Skull, Heart, Zap, Star, BookOpen, Map, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Player, GameSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";

// ─── Rarity ───
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_CONFIG: Record<AchievementRarity, { label: Record<string, string>; hsl: string; bg: string }> = {
  common:    { label: { es: "Común", en: "Common", fr: "Commun" },       hsl: "var(--muted-foreground)", bg: "var(--secondary)" },
  rare:      { label: { es: "Raro", en: "Rare", fr: "Rare" },           hsl: "var(--game-blue)",        bg: "var(--game-blue)" },
  epic:      { label: { es: "Épico", en: "Epic", fr: "Épique" },        hsl: "var(--game-purple)",      bg: "var(--game-purple)" },
  legendary: { label: { es: "Legendario", en: "Legendary", fr: "Légendaire" }, hsl: "var(--gold)",      bg: "var(--gold)" },
};

// ─── Categories ───
export type AchievementCategory = "progress" | "competition" | "social" | "game_specific";

export const CATEGORY_CONFIG: Record<AchievementCategory, { label: Record<string, string>; icon: LucideIcon }> = {
  progress:      { label: { es: "Progreso", en: "Progress", fr: "Progrès" },          icon: BookOpen },
  competition:   { label: { es: "Competición", en: "Competition", fr: "Compétition" }, icon: Swords },
  social:        { label: { es: "Social", en: "Social", fr: "Social" },                icon: Users },
  game_specific: { label: { es: "Juego", en: "Game-specific", fr: "Jeu" },            icon: Map },
};

// ─── Scope ───
export type AchievementScope = "global" | "group";

// ─── Titles ───
export interface PlayerTitle {
  id: string;
  label: Record<string, string>;
  achievementId: string;
}

export const PLAYER_TITLES: PlayerTitle[] = [
  { id: "the_veteran",    label: { es: "El Veterano", en: "The Veteran", fr: "Le Vétéran" },          achievementId: "ten_sessions" },
  { id: "the_champion",   label: { es: "El Campeón", en: "The Champion", fr: "Le Champion" },         achievementId: "dominator" },
  { id: "the_strategist", label: { es: "El Estratega", en: "The Strategist", fr: "Le Stratège" },     achievementId: "perfectionist" },
  { id: "the_collector",  label: { es: "El Coleccionista", en: "The Collector", fr: "Le Collectionneur" }, achievementId: "collector" },
  { id: "the_socialite",  label: { es: "El Sociable", en: "The Socialite", fr: "Le Sociable" },       achievementId: "big_party" },
  { id: "the_legend",     label: { es: "La Leyenda", en: "The Legend", fr: "La Légende" },            achievementId: "legend" },
  { id: "the_unstoppable",label: { es: "El Imparable", en: "The Unstoppable", fr: "L'Inarrêtable" }, achievementId: "streak_master" },
  { id: "the_scorer",     label: { es: "El Goleador", en: "The Scorer", fr: "Le Marqueur" },          achievementId: "mega_scorer" },
];

// ─── Achievement definition ───
export interface Achievement {
  id: string;
  icon: LucideIcon;
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  xp: number;
  rarity: AchievementRarity;
  category: AchievementCategory;
  scope: AchievementScope;
  hidden: boolean;
  condition: (players: Player[], sessions: GameSession[]) => boolean;
  progress: (players: Player[], sessions: GameSession[]) => number;
}

const pct = (cur: number, goal: number) => Math.min((cur / goal) * 100, 100);

// ─── GLOBAL ACHIEVEMENTS (user profile, across all groups) ───
export const GLOBAL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_session", icon: Dice5, xp: 50, rarity: "common", category: "progress", scope: "global", hidden: false,
    titles: { es: "Primera Noche", en: "First Night", fr: "Première Soirée" },
    descriptions: { es: "Registra tu primera sesión", en: "Record your first session", fr: "Enregistrez votre première session" },
    condition: (_, s) => s.length >= 1, progress: (_, s) => pct(s.length, 1) },

  { id: "five_sessions", icon: Gamepad2, xp: 100, rarity: "common", category: "progress", scope: "global", hidden: false,
    titles: { es: "Entusiasta", en: "Enthusiast", fr: "Enthousiaste" },
    descriptions: { es: "Juega 5 sesiones", en: "Play 5 sessions", fr: "Jouez 5 sessions" },
    condition: (_, s) => s.length >= 5, progress: (_, s) => pct(s.length, 5) },

  { id: "ten_sessions", icon: Trophy, xp: 200, rarity: "rare", category: "progress", scope: "global", hidden: false,
    titles: { es: "Veterano", en: "Veteran", fr: "Vétéran" },
    descriptions: { es: "Juega 10 sesiones", en: "Play 10 sessions", fr: "Jouez 10 sessions" },
    condition: (_, s) => s.length >= 10, progress: (_, s) => pct(s.length, 10) },

  { id: "night_owl", icon: Eye, xp: 350, rarity: "epic", category: "progress", scope: "global", hidden: false,
    titles: { es: "Noctámbulo", en: "Night Owl", fr: "Noctambule" },
    descriptions: { es: "Registra 20 sesiones", en: "Record 20 sessions", fr: "Enregistrez 20 sessions" },
    condition: (_, s) => s.length >= 20, progress: (_, s) => pct(s.length, 20) },

  { id: "legend", icon: Star, xp: 1000, rarity: "legendary", category: "progress", scope: "global", hidden: true,
    titles: { es: "Leyenda", en: "Legend", fr: "Légende" },
    descriptions: { es: "Registra 50 sesiones", en: "Record 50 sessions", fr: "Enregistrez 50 sessions" },
    condition: (_, s) => s.length >= 50, progress: (_, s) => pct(s.length, 50) },

  { id: "variety", icon: Target, xp: 150, rarity: "rare", category: "game_specific", scope: "global", hidden: false,
    titles: { es: "Variedad", en: "Variety", fr: "Variété" },
    descriptions: { es: "Juega 3 juegos diferentes", en: "Play 3 different games", fr: "Jouez à 3 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 3, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 3) },

  { id: "collector", icon: FolderOpen, xp: 300, rarity: "epic", category: "game_specific", scope: "global", hidden: false,
    titles: { es: "Coleccionista", en: "Collector", fr: "Collectionneur" },
    descriptions: { es: "Juega 6 juegos diferentes", en: "Play 6 different games", fr: "Jouez à 6 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 6, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 6) },

  { id: "game_master", icon: Map, xp: 500, rarity: "legendary", category: "game_specific", scope: "global", hidden: true,
    titles: { es: "Maestro de Juegos", en: "Game Master", fr: "Maître du Jeu" },
    descriptions: { es: "Juega 12 juegos diferentes", en: "Play 12 different games", fr: "Jouez à 12 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 12, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 12) },

  { id: "dominator", icon: Crown, xp: 300, rarity: "epic", category: "competition", scope: "global", hidden: false,
    titles: { es: "Dominador", en: "Dominator", fr: "Dominateur" },
    descriptions: { es: "Gana 5+ veces en total", en: "Win 5+ times total", fr: "Gagnez 5+ fois au total" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 5),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 5); } },

  { id: "high_scorer", icon: Gem, xp: 200, rarity: "rare", category: "competition", scope: "global", hidden: false,
    titles: { es: "Gran Anotador", en: "High Scorer", fr: "Grand Scoreur" },
    descriptions: { es: "Acumula 100+ puntos totales", en: "Accumulate 100+ total points", fr: "Accumulez 100+ points" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.totalPoints >= 100),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.totalPoints), 0); return pct(m, 100); } },

  { id: "mega_scorer", icon: Zap, xp: 500, rarity: "legendary", category: "competition", scope: "global", hidden: true,
    titles: { es: "Mega Anotador", en: "Mega Scorer", fr: "Mega Scoreur" },
    descriptions: { es: "Acumula 500+ puntos totales", en: "Accumulate 500+ total points", fr: "Accumulez 500+ points" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.totalPoints >= 500),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.totalPoints), 0); return pct(m, 500); } },

  { id: "perfectionist", icon: Sparkles, xp: 500, rarity: "legendary", category: "competition", scope: "global", hidden: false,
    titles: { es: "Perfeccionista", en: "Perfectionist", fr: "Perfectionniste" },
    descriptions: { es: "Un jugador con 80%+ de victorias (min 5 partidas)", en: "A player with 80%+ win rate (min 5 games)", fr: "Un joueur avec 80%+ de victoires (min 5 parties)" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.gamesPlayed >= 5 && st.winRate >= 80),
    progress: (p, s) => { const best = getPlayerStats(p, s).filter(st => st.gamesPlayed >= 5); if (!best.length) return 0; return pct(Math.max(...best.map(st => st.winRate), 0), 80); } },

  { id: "ruthless", icon: Skull, xp: 750, rarity: "legendary", category: "competition", scope: "global", hidden: true,
    titles: { es: "Despiadado", en: "Ruthless", fr: "Impitoyable" },
    descriptions: { es: "Gana 10+ veces en total", en: "Win 10+ times total", fr: "Gagnez 10+ fois au total" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 10),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 10); } },
];

// ─── GROUP ACHIEVEMENTS (specific to a group) ───
export const GROUP_ACHIEVEMENTS: Achievement[] = [
  { id: "group_first", icon: Dice5, xp: 50, rarity: "common", category: "progress", scope: "group", hidden: false,
    titles: { es: "Primer Juego del Grupo", en: "Group First Game", fr: "Premier Jeu du Groupe" },
    descriptions: { es: "Registra la primera sesión del grupo", en: "Record the group's first session", fr: "Enregistrez la première session du groupe" },
    condition: (_, s) => s.length >= 1, progress: (_, s) => pct(s.length, 1) },

  { id: "group_ten", icon: Trophy, xp: 200, rarity: "rare", category: "progress", scope: "group", hidden: false,
    titles: { es: "10 Noches de Juego", en: "10 Game Nights", fr: "10 Soirées Jeu" },
    descriptions: { es: "Juega 10 sesiones en este grupo", en: "Play 10 sessions in this group", fr: "Jouez 10 sessions dans ce groupe" },
    condition: (_, s) => s.length >= 10, progress: (_, s) => pct(s.length, 10) },

  { id: "group_champion", icon: Crown, xp: 300, rarity: "epic", category: "competition", scope: "group", hidden: false,
    titles: { es: "Campeón del Grupo", en: "Group Champion", fr: "Champion du Groupe" },
    descriptions: { es: "Un jugador gana 5+ veces en este grupo", en: "A player wins 5+ times in this group", fr: "Un joueur gagne 5+ fois dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 5),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 5); } },

  { id: "group_squad", icon: Users, xp: 100, rarity: "common", category: "social", scope: "group", hidden: false,
    titles: { es: "El Escuadrón", en: "The Squad", fr: "L'Escouade" },
    descriptions: { es: "4 jugadores en este grupo", en: "4 players in this group", fr: "4 joueurs dans ce groupe" },
    condition: (p) => p.length >= 4, progress: (p) => pct(p.length, 4) },

  { id: "group_big_party", icon: PartyPopper, xp: 250, rarity: "rare", category: "social", scope: "group", hidden: false,
    titles: { es: "Gran Fiesta del Grupo", en: "Group Big Party", fr: "Grande Fête du Groupe" },
    descriptions: { es: "8 jugadores en este grupo", en: "8 players in this group", fr: "8 joueurs dans ce groupe" },
    condition: (p) => p.length >= 8, progress: (p) => pct(p.length, 8) },

  { id: "group_streak", icon: Flame, xp: 400, rarity: "epic", category: "competition", scope: "group", hidden: false,
    titles: { es: "Racha del Grupo", en: "Group Win Streak", fr: "Série du Groupe" },
    descriptions: { es: "Un jugador gana 3 sesiones seguidas", en: "A player wins 3 sessions in a row", fr: "Un joueur gagne 3 sessions d'affilée" },
    condition: (p, s) => { for (const player of p) { let streak = 0; for (const session of s) { const r = session.results.find(r => r.playerId === player.id); if (r?.isWinner) { streak++; if (streak >= 3) return true; } else if (r) { streak = 0; } } } return false; },
    progress: (p, s) => { let max = 0; for (const player of p) { let streak = 0; for (const session of s) { const r = session.results.find(r => r.playerId === player.id); if (r?.isWinner) { streak++; max = Math.max(max, streak); } else if (r) { streak = 0; } } } return pct(max, 3); } },

  { id: "group_variety", icon: Target, xp: 150, rarity: "rare", category: "game_specific", scope: "group", hidden: false,
    titles: { es: "Variedad del Grupo", en: "Group Variety", fr: "Variété du Groupe" },
    descriptions: { es: "Juega 5 juegos diferentes en este grupo", en: "Play 5 different games in this group", fr: "Jouez à 5 jeux différents dans ce groupe" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 5, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 5) },

  { id: "group_heart", icon: Heart, xp: 150, rarity: "rare", category: "competition", scope: "group", hidden: false,
    titles: { es: "Corazón del Grupo", en: "Group Heart", fr: "Cœur du Groupe" },
    descriptions: { es: "Un jugador juega 10+ partidas en este grupo", en: "A player plays 10+ games in this group", fr: "Un joueur joue 10+ parties dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.gamesPlayed >= 10),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.gamesPlayed), 0); return pct(m, 10); } },

  { id: "group_legend", icon: Award, xp: 800, rarity: "legendary", category: "competition", scope: "group", hidden: true,
    titles: { es: "Leyenda del Grupo", en: "Group Legend", fr: "Légende du Groupe" },
    descriptions: { es: "Un jugador gana 10+ veces en este grupo", en: "A player wins 10+ times in this group", fr: "Un joueur gagne 10+ fois dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 10),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 10); } },

  { id: "group_army", icon: Shield, xp: 500, rarity: "epic", category: "social", scope: "group", hidden: true,
    titles: { es: "Ejército del Grupo", en: "Group Army", fr: "Armée du Groupe" },
    descriptions: { es: "16 jugadores en este grupo", en: "16 players in this group", fr: "16 joueurs dans ce groupe" },
    condition: (p) => p.length >= 16, progress: (p) => pct(p.length, 16) },
];

// Combined for backward compat
export const ACHIEVEMENTS: Achievement[] = [...GLOBAL_ACHIEVEMENTS, ...GROUP_ACHIEVEMENTS];

// ─── Level system ───
export interface LevelInfo {
  level: number;
  title: Record<string, string>;
  minXp: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  title: { es: "Novato", en: "Rookie", fr: "Débutant" },             minXp: 0 },
  { level: 2,  title: { es: "Aprendiz", en: "Apprentice", fr: "Apprenti" },       minXp: 200 },
  { level: 3,  title: { es: "Jugador", en: "Player", fr: "Joueur" },              minXp: 500 },
  { level: 4,  title: { es: "Hábil", en: "Skilled", fr: "Habile" },               minXp: 1000 },
  { level: 5,  title: { es: "Experto", en: "Expert", fr: "Expert" },              minXp: 1800 },
  { level: 6,  title: { es: "Maestro", en: "Master", fr: "Maître" },              minXp: 2800 },
  { level: 7,  title: { es: "Gran Maestro", en: "Grand Master", fr: "Grand Maître" }, minXp: 4000 },
  { level: 8,  title: { es: "Leyenda", en: "Legend", fr: "Légende" },             minXp: 5500 },
  { level: 9,  title: { es: "Mítico", en: "Mythic", fr: "Mythique" },             minXp: 7500 },
  { level: 10, title: { es: "Inmortal", en: "Immortal", fr: "Immortel" },         minXp: 10000 },
];

export function calculateXP(players: Player[], sessions: GameSession[]): number {
  return GLOBAL_ACHIEVEMENTS
    .filter(a => a.condition(players, sessions))
    .reduce((sum, a) => sum + a.xp, 0);
}

export function calculateGroupXP(players: Player[], sessions: GameSession[]): number {
  return GROUP_ACHIEVEMENTS
    .filter(a => a.condition(players, sessions))
    .reduce((sum, a) => sum + a.xp, 0);
}

export function calculateTotalXP(
  globalPlayers: Player[], globalSessions: GameSession[],
  groupPlayers: Player[], groupSessions: GameSession[]
): number {
  return calculateXP(globalPlayers, globalSessions) + calculateGroupXP(groupPlayers, groupSessions);
}

export function getLevel(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXPProgress(xp: number): { current: number; nextLevel: number; progress: number } {
  const currentLevel = getLevel(xp);
  const currentIdx = LEVELS.indexOf(currentLevel);
  const nextLevel = LEVELS[currentIdx + 1];
  if (!nextLevel) return { current: xp, nextLevel: currentLevel.minXp, progress: 100 };
  const inLevel = xp - currentLevel.minXp;
  const needed = nextLevel.minXp - currentLevel.minXp;
  return { current: inLevel, nextLevel: needed, progress: (inLevel / needed) * 100 };
}

export function getUnlockedTitles(players: Player[], sessions: GameSession[]): PlayerTitle[] {
  const unlocked = new Set(
    GLOBAL_ACHIEVEMENTS.filter(a => a.condition(players, sessions)).map(a => a.id)
  );
  return PLAYER_TITLES.filter(t => unlocked.has(t.achievementId));
}

/** Sort achievements: visible unlocked first, visible locked next, hidden at bottom */
export function sortAchievements(
  list: Achievement[],
  unlockedIds: Set<string>
): Achievement[] {
  const rarityOrder: Record<AchievementRarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };
  return [...list].sort((a, b) => {
    // Hidden locked always at bottom
    const aHiddenLocked = a.hidden && !unlockedIds.has(a.id) ? 1 : 0;
    const bHiddenLocked = b.hidden && !unlockedIds.has(b.id) ? 1 : 0;
    if (aHiddenLocked !== bHiddenLocked) return aHiddenLocked - bHiddenLocked;

    // Unlocked first
    const aU = unlockedIds.has(a.id) ? 1 : 0;
    const bU = unlockedIds.has(b.id) ? 1 : 0;
    if (aU !== bU) return bU - aU;

    // Then by rarity
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });
}
