import { Dice5, Gamepad2, Trophy, Users, PartyPopper, Target, FolderOpen, Crown, Gem, Flame, Eye, Sparkles, Swords, Shield, Skull, Heart, Zap, Star, BookOpen, Map as MapIcon, Award, UserPlus, Medal, Crosshair, Activity, Route, LayoutGrid, Globe, Handshake, MessageCircle, Gift, Repeat, Beef, Pizza, Puzzle, Layers, TreePine, Palette, CircleDot } from "lucide-react";
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
export type AchievementCategory = "progress" | "competition" | "social" | "game_specific" | "rivalry" | "cooperative";

export const CATEGORY_CONFIG: Record<AchievementCategory, { label: Record<string, string>; icon: LucideIcon }> = {
  progress:      { label: { es: "Progreso", en: "Progress", fr: "Progrès" },          icon: BookOpen },
  competition:   { label: { es: "Competición", en: "Competition", fr: "Compétition" }, icon: Swords },
  social:        { label: { es: "Social", en: "Social", fr: "Social" },                icon: Users },
  game_specific: { label: { es: "Juego", en: "Game-specific", fr: "Jeu" },            icon: MapIcon },
  rivalry:       { label: { es: "Rivalidad", en: "Rivalry", fr: "Rivalité" },          icon: Crosshair },
  cooperative:   { label: { es: "Cooperativo", en: "Cooperative", fr: "Coopératif" },  icon: Heart },
};

// ─── Scope ───
export type AchievementScope = "global" | "group";

// ─── Group achievement subcategory ───
export type GroupAchievementType = "individual" | "competitive" | "rivalry" | "cooperative";

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
  { id: "the_rival",      label: { es: "El Rival", en: "The Rival", fr: "Le Rival" },                achievementId: "nemesis" },
  { id: "the_creator",    label: { es: "El Creador", en: "The Creator", fr: "Le Créateur" },          achievementId: "group_creator" },
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
  groupType?: GroupAchievementType;
  hidden: boolean;
  condition: (players: Player[], sessions: GameSession[]) => boolean;
  progress: (players: Player[], sessions: GameSession[]) => number;
}

const pct = (cur: number, goal: number) => Math.min((cur / goal) * 100, 100);

// ─── Helper: get head-to-head stats between players ───
function getHeadToHead(players: Player[], sessions: GameSession[]) {
  const h2h = new Map<string, Map<string, number>>(); // playerId -> (opponentId -> wins against)
  for (const session of sessions) {
    const winners = session.results.filter(r => r.isWinner).map(r => r.playerId);
    const losers = session.results.filter(r => !r.isWinner).map(r => r.playerId);
    for (const winner of winners) {
      if (!h2h.has(winner)) h2h.set(winner, new Map());
      for (const loser of losers) {
        const m = h2h.get(winner)!;
        m.set(loser, (m.get(loser) || 0) + 1);
      }
    }
  }
  return h2h;
}

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

  { id: "five_games", icon: Globe, xp: 200, rarity: "rare", category: "game_specific", scope: "global", hidden: false,
    titles: { es: "Explorador", en: "Explorer", fr: "Explorateur" },
    descriptions: { es: "Juega 5 juegos diferentes", en: "Play 5 different games", fr: "Jouez à 5 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 5, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 5) },

  { id: "collector", icon: FolderOpen, xp: 300, rarity: "epic", category: "game_specific", scope: "global", hidden: false,
    titles: { es: "Coleccionista", en: "Collector", fr: "Collectionneur" },
    descriptions: { es: "Juega 6 juegos diferentes", en: "Play 6 different games", fr: "Jouez à 6 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 6, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 6) },

  { id: "game_master", icon: MapIcon, xp: 500, rarity: "legendary", category: "game_specific", scope: "global", hidden: true,
    titles: { es: "Maestro de Juegos", en: "Game Master", fr: "Maître du Jeu" },
    descriptions: { es: "Juega 12 juegos diferentes", en: "Play 12 different games", fr: "Jouez à 12 jeux différents" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 12, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 12) },

  { id: "first_win", icon: Medal, xp: 75, rarity: "common", category: "competition", scope: "global", hidden: false,
    titles: { es: "Primera Victoria", en: "First Victory", fr: "Première Victoire" },
    descriptions: { es: "Gana tu primera partida", en: "Win your first match", fr: "Gagnez votre premier match" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 1),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 1); } },

  { id: "dominator", icon: Crown, xp: 300, rarity: "epic", category: "competition", scope: "global", hidden: false,
    titles: { es: "Dominador", en: "Dominator", fr: "Dominateur" },
    descriptions: { es: "Gana 5+ veces en total", en: "Win 5+ times total", fr: "Gagnez 5+ fois au total" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 5),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 5); } },

  { id: "twenty_wins", icon: Swords, xp: 500, rarity: "epic", category: "competition", scope: "global", hidden: false,
    titles: { es: "Conquistador", en: "Conqueror", fr: "Conquérant" },
    descriptions: { es: "Gana 20 partidas en total", en: "Win 20 matches total", fr: "Gagnez 20 matchs au total" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 20),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 20); } },

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

  { id: "group_creator", icon: UserPlus, xp: 100, rarity: "common", category: "social", scope: "global", hidden: false,
    titles: { es: "Fundador", en: "Founder", fr: "Fondateur" },
    descriptions: { es: "Crea tu primer grupo", en: "Create your first group", fr: "Créez votre premier groupe" },
    condition: (_, s) => s.length >= 1, progress: (_, s) => pct(s.length, 1) },

  { id: "big_party", icon: PartyPopper, xp: 200, rarity: "rare", category: "social", scope: "global", hidden: false,
    titles: { es: "Fiestero", en: "Party Goer", fr: "Fêtard" },
    descriptions: { es: "Participa en sesiones con 4+ jugadores", en: "Play sessions with 4+ players", fr: "Jouez des sessions avec 4+ joueurs" },
    condition: (_, s) => s.some(sess => sess.results.length >= 4),
    progress: (_, s) => { const max = Math.max(...s.map(sess => sess.results.length), 0); return pct(max, 4); } },

  { id: "social_butterfly", icon: MessageCircle, xp: 150, rarity: "rare", category: "social", scope: "global", hidden: false,
    titles: { es: "Mariposa Social", en: "Social Butterfly", fr: "Papillon Social" },
    descriptions: { es: "Juega con 10+ jugadores diferentes", en: "Play with 10+ different players", fr: "Jouez avec 10+ joueurs différents" },
    condition: (_, s) => { const ids = new Set<string>(); s.forEach(sess => sess.results.forEach(r => ids.add(r.playerId))); return ids.size >= 10; },
    progress: (_, s) => { const ids = new Set<string>(); s.forEach(sess => sess.results.forEach(r => ids.add(r.playerId))); return pct(ids.size, 10); } },

  // ── Global Rivalry ──
  { id: "global_nemesis", icon: Crosshair, xp: 250, rarity: "epic", category: "rivalry", scope: "global", hidden: false,
    titles: { es: "Rival Frecuente", en: "Frequent Rival", fr: "Rival Fréquent" },
    descriptions: { es: "Juega 5+ veces contra el mismo oponente", en: "Play 5+ times against the same opponent", fr: "Jouez 5+ fois contre le même adversaire" },
    condition: (p, s) => { const enc = new Map<string, number>(); for (const sess of s) { const pids = sess.results.map(r => r.playerId); for (let i = 0; i < pids.length; i++) for (let j = i+1; j < pids.length; j++) { const k = [pids[i],pids[j]].sort().join("-"); enc.set(k, (enc.get(k)||0)+1); } } for (const v of enc.values()) if (v >= 5) return true; return false; },
    progress: (p, s) => { let max = 0; const enc = new Map<string, number>(); for (const sess of s) { const pids = sess.results.map(r => r.playerId); for (let i = 0; i < pids.length; i++) for (let j = i+1; j < pids.length; j++) { const k = [pids[i],pids[j]].sort().join("-"); enc.set(k, (enc.get(k)||0)+1); max = Math.max(max, enc.get(k)!); } } return pct(max, 5); } },

  { id: "global_dominator_rival", icon: Swords, xp: 400, rarity: "epic", category: "rivalry", scope: "global", hidden: false,
    titles: { es: "Dominación Total", en: "Total Domination", fr: "Domination Totale" },
    descriptions: { es: "Gana 5 veces contra el mismo rival", en: "Win 5 times against the same rival", fr: "Gagnez 5 fois contre le même rival" },
    condition: (p, s) => { const h2h = getHeadToHead(p, s); for (const [, opps] of h2h) for (const [, w] of opps) if (w >= 5) return true; return false; },
    progress: (p, s) => { const h2h = getHeadToHead(p, s); let max = 0; for (const [, opps] of h2h) for (const [, w] of opps) max = Math.max(max, w); return pct(max, 5); } },

  { id: "global_revenge", icon: Repeat, xp: 500, rarity: "legendary", category: "rivalry", scope: "global", hidden: true,
    titles: { es: "Venganza", en: "Revenge", fr: "Vengeance" },
    descriptions: { es: "Gana 10 veces contra el mismo rival en total", en: "Win 10 times against the same rival overall", fr: "Gagnez 10 fois contre le même rival au total" },
    condition: (p, s) => { const h2h = getHeadToHead(p, s); for (const [, opps] of h2h) for (const [, w] of opps) if (w >= 10) return true; return false; },
    progress: (p, s) => { const h2h = getHeadToHead(p, s); let max = 0; for (const [, opps] of h2h) for (const [, w] of opps) max = Math.max(max, w); return pct(max, 10); } },

  // ── Global Cooperative ──
  { id: "global_team_spirit", icon: Heart, xp: 100, rarity: "common", category: "cooperative", scope: "global", hidden: false,
    titles: { es: "Espíritu de Equipo", en: "Team Spirit", fr: "Esprit d'Équipe" },
    descriptions: { es: "Juega tu primera sesión multijugador", en: "Play your first multiplayer session", fr: "Jouez votre première session multijoueur" },
    condition: (_, s) => s.some(sess => sess.results.length >= 2), progress: (_, s) => pct(s.filter(sess => sess.results.length >= 2).length, 1) },

  { id: "global_crowd", icon: Users, xp: 300, rarity: "epic", category: "cooperative", scope: "global", hidden: false,
    titles: { es: "Multitud", en: "The Crowd", fr: "La Foule" },
    descriptions: { es: "Sesión con 6+ jugadores", en: "Session with 6+ players", fr: "Session avec 6+ joueurs" },
    condition: (_, s) => s.some(sess => sess.results.length >= 6), progress: (_, s) => { const max = Math.max(...s.map(sess => sess.results.length), 0); return pct(max, 6); } },

  { id: "global_marathon", icon: Route, xp: 500, rarity: "legendary", category: "cooperative", scope: "global", hidden: false,
    titles: { es: "Maratón Global", en: "Global Marathon", fr: "Marathon Global" },
    descriptions: { es: "50 sesiones multijugador en total", en: "50 multiplayer sessions total", fr: "50 sessions multijoueur au total" },
    condition: (_, s) => s.filter(sess => sess.results.length >= 2).length >= 50, progress: (_, s) => pct(s.filter(sess => sess.results.length >= 2).length, 50) },
];

// ─── GROUP ACHIEVEMENTS (specific to a group) ───
export const GROUP_ACHIEVEMENTS: Achievement[] = [
  // ── Individual achievements ──
  { id: "group_first", icon: Dice5, xp: 50, rarity: "common", category: "progress", scope: "group", groupType: "individual", hidden: false,
    titles: { es: "Primer Juego del Grupo", en: "Group First Game", fr: "Premier Jeu du Groupe" },
    descriptions: { es: "Registra la primera sesión del grupo", en: "Record the group's first session", fr: "Enregistrez la première session du groupe" },
    condition: (_, s) => s.length >= 1, progress: (_, s) => pct(s.length, 1) },

  { id: "group_five", icon: Gamepad2, xp: 100, rarity: "common", category: "progress", scope: "group", groupType: "individual", hidden: false,
    titles: { es: "5 Noches", en: "5 Nights", fr: "5 Soirées" },
    descriptions: { es: "Juega 5 sesiones en este grupo", en: "Play 5 sessions in this group", fr: "Jouez 5 sessions dans ce groupe" },
    condition: (_, s) => s.length >= 5, progress: (_, s) => pct(s.length, 5) },

  { id: "group_ten", icon: Trophy, xp: 200, rarity: "rare", category: "progress", scope: "group", groupType: "individual", hidden: false,
    titles: { es: "10 Noches de Juego", en: "10 Game Nights", fr: "10 Soirées Jeu" },
    descriptions: { es: "Juega 10 sesiones en este grupo", en: "Play 10 sessions in this group", fr: "Jouez 10 sessions dans ce groupe" },
    condition: (_, s) => s.length >= 10, progress: (_, s) => pct(s.length, 10) },

  { id: "group_first_win", icon: Medal, xp: 75, rarity: "common", category: "competition", scope: "group", groupType: "individual", hidden: false,
    titles: { es: "Primera Victoria del Grupo", en: "First Group Win", fr: "Première Victoire du Groupe" },
    descriptions: { es: "Gana tu primera partida en este grupo", en: "Win your first match in this group", fr: "Gagnez votre premier match dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 1),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 1); } },

  { id: "group_three_wins", icon: Flame, xp: 150, rarity: "rare", category: "competition", scope: "group", groupType: "individual", hidden: false,
    titles: { es: "Tripleta", en: "Triple Win", fr: "Triple Victoire" },
    descriptions: { es: "Gana 3 partidas en este grupo", en: "Win 3 matches in this group", fr: "Gagnez 3 matchs dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 3),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 3); } },

  { id: "group_heart", icon: Heart, xp: 150, rarity: "rare", category: "progress", scope: "group", groupType: "individual", hidden: false,
    titles: { es: "Corazón del Grupo", en: "Group Heart", fr: "Cœur du Groupe" },
    descriptions: { es: "Un jugador juega 10+ partidas en este grupo", en: "A player plays 10+ games in this group", fr: "Un joueur joue 10+ parties dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.gamesPlayed >= 10),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.gamesPlayed), 0); return pct(m, 10); } },

  // ── Competitive achievements ──
  { id: "group_champion", icon: Crown, xp: 300, rarity: "epic", category: "competition", scope: "group", groupType: "competitive", hidden: false,
    titles: { es: "Campeón del Grupo", en: "Group Champion", fr: "Champion du Groupe" },
    descriptions: { es: "Un jugador gana 5+ veces en este grupo", en: "A player wins 5+ times in this group", fr: "Un joueur gagne 5+ fois dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 5),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 5); } },

  { id: "group_best_winrate", icon: Activity, xp: 350, rarity: "epic", category: "competition", scope: "group", groupType: "competitive", hidden: false,
    titles: { es: "Mejor Ratio", en: "Best Win Rate", fr: "Meilleur Ratio" },
    descriptions: { es: "Mejor tasa de victoria del grupo (min 5 partidas, 70%+)", en: "Best win rate in the group (min 5 games, 70%+)", fr: "Meilleur taux de victoire du groupe (min 5 parties, 70%+)" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.gamesPlayed >= 5 && st.winRate >= 70),
    progress: (p, s) => { const best = getPlayerStats(p, s).filter(st => st.gamesPlayed >= 5); if (!best.length) return 0; return pct(Math.max(...best.map(st => st.winRate), 0), 70); } },

  { id: "group_top_scorer", icon: Gem, xp: 250, rarity: "rare", category: "competition", scope: "group", groupType: "competitive", hidden: false,
    titles: { es: "Máximo Anotador", en: "Top Scorer", fr: "Meilleur Scoreur" },
    descriptions: { es: "Acumula 200+ puntos en este grupo", en: "Accumulate 200+ points in this group", fr: "Accumulez 200+ points dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.totalPoints >= 200),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.totalPoints), 0); return pct(m, 200); } },

  { id: "group_streak", icon: Flame, xp: 400, rarity: "epic", category: "competition", scope: "group", groupType: "competitive", hidden: false,
    titles: { es: "Racha del Grupo", en: "Group Win Streak", fr: "Série du Groupe" },
    descriptions: { es: "Un jugador gana 3 sesiones seguidas", en: "A player wins 3 sessions in a row", fr: "Un joueur gagne 3 sessions d'affilée" },
    condition: (p, s) => { for (const player of p) { let streak = 0; for (const session of s) { const r = session.results.find(r => r.playerId === player.id); if (r?.isWinner) { streak++; if (streak >= 3) return true; } else if (r) { streak = 0; } } } return false; },
    progress: (p, s) => { let max = 0; for (const player of p) { let streak = 0; for (const session of s) { const r = session.results.find(r => r.playerId === player.id); if (r?.isWinner) { streak++; max = Math.max(max, streak); } else if (r) { streak = 0; } } } return pct(max, 3); } },

  { id: "group_legend", icon: Award, xp: 800, rarity: "legendary", category: "competition", scope: "group", groupType: "competitive", hidden: true,
    titles: { es: "Leyenda del Grupo", en: "Group Legend", fr: "Légende du Groupe" },
    descriptions: { es: "Un jugador gana 10+ veces en este grupo", en: "A player wins 10+ times in this group", fr: "Un joueur gagne 10+ fois dans ce groupe" },
    condition: (p, s) => getPlayerStats(p, s).some(st => st.wins >= 10),
    progress: (p, s) => { const m = Math.max(...getPlayerStats(p, s).map(st => st.wins), 0); return pct(m, 10); } },

  // ── Rivalry achievements ──
  { id: "nemesis", icon: Crosshair, xp: 300, rarity: "epic", category: "rivalry", scope: "group", groupType: "rivalry", hidden: false,
    titles: { es: "Némesis", en: "Nemesis", fr: "Némésis" },
    descriptions: { es: "Gana 3 veces contra el mismo rival", en: "Win 3 times against the same rival", fr: "Gagnez 3 fois contre le même rival" },
    condition: (p, s) => { const h2h = getHeadToHead(p, s); for (const [, opponents] of h2h) { for (const [, wins] of opponents) { if (wins >= 3) return true; } } return false; },
    progress: (p, s) => { const h2h = getHeadToHead(p, s); let max = 0; for (const [, opponents] of h2h) { for (const [, wins] of opponents) { max = Math.max(max, wins); } } return pct(max, 3); } },

  { id: "rival_ten", icon: Swords, xp: 400, rarity: "epic", category: "rivalry", scope: "group", groupType: "rivalry", hidden: false,
    titles: { es: "Eterno Rival", en: "Eternal Rival", fr: "Rival Éternel" },
    descriptions: { es: "Juega 10 partidas contra un mismo oponente", en: "Play 10 matches against the same opponent", fr: "Jouez 10 matchs contre le même adversaire" },
    condition: (p, s) => {
      const encounters = new Map<string, Map<string, number>>();
      for (const session of s) {
        const pids = session.results.map(r => r.playerId);
        for (let i = 0; i < pids.length; i++) {
          for (let j = i + 1; j < pids.length; j++) {
            const key = [pids[i], pids[j]].sort().join("-");
            if (!encounters.has(pids[i])) encounters.set(pids[i], new Map());
            const m = encounters.get(pids[i])!;
            m.set(key, (m.get(key) || 0) + 1);
          }
        }
      }
      for (const [, opps] of encounters) { for (const [, count] of opps) { if (count >= 10) return true; } }
      return false;
    },
    progress: (p, s) => {
      let max = 0;
      const encounters = new Map<string, number>();
      for (const session of s) {
        const pids = session.results.map(r => r.playerId);
        for (let i = 0; i < pids.length; i++) {
          for (let j = i + 1; j < pids.length; j++) {
            const key = [pids[i], pids[j]].sort().join("-");
            encounters.set(key, (encounters.get(key) || 0) + 1);
            max = Math.max(max, encounters.get(key)!);
          }
        }
      }
      return pct(max, 10);
    } },

  { id: "giant_slayer", icon: Skull, xp: 500, rarity: "legendary", category: "rivalry", scope: "group", groupType: "rivalry", hidden: true,
    titles: { es: "Matador de Gigantes", en: "Giant Slayer", fr: "Tueur de Géants" },
    descriptions: { es: "Vence al líder del grupo", en: "Beat the current group leader", fr: "Battez le leader actuel du groupe" },
    condition: (p, s) => {
      const stats = getPlayerStats(p, s);
      if (stats.length < 2) return false;
      const leader = stats.reduce((a, b) => a.wins > b.wins ? a : b);
      if (leader.wins === 0) return false;
      // Check if any non-leader has beaten the leader
      for (const session of s) {
        const leaderResult = session.results.find(r => r.playerId === leader.player.id);
        if (leaderResult && !leaderResult.isWinner) {
          const winners = session.results.filter(r => r.isWinner && r.playerId !== leader.player.id);
          if (winners.length > 0) return true;
        }
      }
      return false;
    },
    progress: (p, s) => {
      const stats = getPlayerStats(p, s);
      if (stats.length < 2) return 0;
      const leader = stats.reduce((a, b) => a.wins > b.wins ? a : b);
      if (leader.wins === 0) return 0;
      for (const session of s) {
        const leaderResult = session.results.find(r => r.playerId === leader.player.id);
        if (leaderResult && !leaderResult.isWinner) {
          const winners = session.results.filter(r => r.isWinner && r.playerId !== leader.player.id);
          if (winners.length > 0) return 100;
        }
      }
      return 50; // they're in the group but haven't beaten leader
    } },

  // ── Cooperative achievements ──
  { id: "group_squad", icon: Users, xp: 100, rarity: "common", category: "cooperative", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "El Escuadrón", en: "The Squad", fr: "L'Escouade" },
    descriptions: { es: "4 jugadores en este grupo", en: "4 players in this group", fr: "4 joueurs dans ce groupe" },
    condition: (p) => p.length >= 4, progress: (p) => pct(p.length, 4) },

  { id: "group_big_party", icon: PartyPopper, xp: 250, rarity: "rare", category: "cooperative", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Gran Fiesta del Grupo", en: "Group Big Party", fr: "Grande Fête du Groupe" },
    descriptions: { es: "8 jugadores en este grupo", en: "8 players in this group", fr: "8 joueurs dans ce groupe" },
    condition: (p) => p.length >= 8, progress: (p) => pct(p.length, 8) },

  { id: "group_four_session", icon: LayoutGrid, xp: 150, rarity: "rare", category: "cooperative", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Mesa Completa", en: "Full Table", fr: "Table Complète" },
    descriptions: { es: "Primera sesión con 4+ jugadores", en: "First session with 4+ players", fr: "Première session avec 4+ joueurs" },
    condition: (_, s) => s.some(sess => sess.results.length >= 4),
    progress: (_, s) => { const max = Math.max(...s.map(sess => sess.results.length), 0); return pct(max, 4); } },

  { id: "group_twenty_sessions", icon: Route, xp: 400, rarity: "epic", category: "cooperative", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Maratón", en: "Marathon", fr: "Marathon" },
    descriptions: { es: "20 sesiones totales del grupo", en: "20 total group sessions", fr: "20 sessions totales du groupe" },
    condition: (_, s) => s.length >= 20, progress: (_, s) => pct(s.length, 20) },

  { id: "group_variety", icon: Target, xp: 150, rarity: "rare", category: "cooperative", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Variedad del Grupo", en: "Group Variety", fr: "Variété du Groupe" },
    descriptions: { es: "Juega 5 juegos diferentes en este grupo", en: "Play 5 different games in this group", fr: "Jouez à 5 jeux différents dans ce groupe" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 5, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 5) },

  { id: "group_army", icon: Shield, xp: 500, rarity: "epic", category: "cooperative", scope: "group", groupType: "cooperative", hidden: true,
    titles: { es: "Ejército del Grupo", en: "Group Army", fr: "Armée du Groupe" },
    descriptions: { es: "16 jugadores en este grupo", en: "16 players in this group", fr: "16 joueurs dans ce groupe" },
    condition: (p) => p.length >= 16, progress: (p) => pct(p.length, 16) },

  // ── Social achievements (group) ──
  { id: "group_welcomer", icon: Handshake, xp: 75, rarity: "common", category: "social", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Anfitrión", en: "Host", fr: "Hôte" },
    descriptions: { es: "3+ jugadores se unen al grupo", en: "3+ players join the group", fr: "3+ joueurs rejoignent le groupe" },
    condition: (p) => p.length >= 3, progress: (p) => pct(p.length, 3) },

  { id: "group_mixer", icon: Gift, xp: 150, rarity: "rare", category: "social", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "El Mezclador", en: "The Mixer", fr: "Le Mélangeur" },
    descriptions: { es: "Todos los jugadores han jugado al menos 1 sesión", en: "All players played at least 1 session", fr: "Tous les joueurs ont joué au moins 1 session" },
    condition: (p, s) => { if (p.length < 2) return false; return p.every(pl => s.some(sess => sess.results.some(r => r.playerId === pl.id))); },
    progress: (p, s) => { if (p.length < 2) return 0; const active = p.filter(pl => s.some(sess => sess.results.some(r => r.playerId === pl.id))).length; return pct(active, p.length); } },

  { id: "group_all_together", icon: Pizza, xp: 300, rarity: "epic", category: "social", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Todos Juntos", en: "All Together", fr: "Tous Ensemble" },
    descriptions: { es: "Una sesión donde juegan todos los del grupo", en: "A session where everyone in the group plays", fr: "Une session où tout le groupe joue" },
    condition: (p, s) => { if (p.length < 3) return false; return s.some(sess => p.every(pl => sess.results.some(r => r.playerId === pl.id))); },
    progress: (p, s) => { if (p.length < 3) return 0; const best = Math.max(...s.map(sess => p.filter(pl => sess.results.some(r => r.playerId === pl.id)).length)); return pct(best, p.length); } },

  // ── Game-specific achievements (group) ──
  { id: "group_one_game_master", icon: CircleDot, xp: 100, rarity: "common", category: "game_specific", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Primer Juego", en: "First Game", fr: "Premier Jeu" },
    descriptions: { es: "Juega tu primer juego diferente en el grupo", en: "Play your first unique game in the group", fr: "Jouez votre premier jeu unique dans le groupe" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 1, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 1) },

  { id: "group_three_games", icon: Puzzle, xp: 150, rarity: "rare", category: "game_specific", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Explorador del Grupo", en: "Group Explorer", fr: "Explorateur du Groupe" },
    descriptions: { es: "Juega 3 juegos diferentes en este grupo", en: "Play 3 different games in this group", fr: "Jouez à 3 jeux différents dans ce groupe" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 3, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 3) },

  { id: "group_game_marathon", icon: Palette, xp: 300, rarity: "epic", category: "game_specific", scope: "group", groupType: "cooperative", hidden: false,
    titles: { es: "Ludoteca", en: "Game Library", fr: "Ludothèque" },
    descriptions: { es: "Juega 10 juegos diferentes en este grupo", en: "Play 10 different games in this group", fr: "Jouez à 10 jeux différents dans ce groupe" },
    condition: (_, s) => new Set(s.map(x => x.gameName)).size >= 10, progress: (_, s) => pct(new Set(s.map(x => x.gameName)).size, 10) },
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

/**
 * Evaluate group achievements considering per-player logic.
 * Individual/competitive achievements are checked against a specific player.
 * Cooperative achievements are checked group-wide.
 */
export function evaluateGroupAchievement(
  achievement: Achievement,
  allPlayers: Player[],
  sessions: GameSession[],
  linkedPlayer?: Player | null
): boolean {
  const isPerPlayer = achievement.groupType === "individual" || achievement.groupType === "competitive";
  if (isPerPlayer && linkedPlayer) {
    // Evaluate only for the linked player
    const playerSessions = sessions.filter(s => s.results.some(r => r.playerId === linkedPlayer.id));
    return achievement.condition([linkedPlayer], playerSessions);
  }
  if (isPerPlayer && !linkedPlayer) {
    // No linked player — can't unlock individual achievements
    return false;
  }
  // Cooperative/rivalry: evaluate group-wide
  return achievement.condition(allPlayers, sessions);
}

export function evaluateGroupAchievementProgress(
  achievement: Achievement,
  allPlayers: Player[],
  sessions: GameSession[],
  linkedPlayer?: Player | null
): number {
  const isPerPlayer = achievement.groupType === "individual" || achievement.groupType === "competitive";
  if (isPerPlayer && linkedPlayer) {
    const playerSessions = sessions.filter(s => s.results.some(r => r.playerId === linkedPlayer.id));
    return achievement.progress([linkedPlayer], playerSessions);
  }
  if (isPerPlayer && !linkedPlayer) {
    return 0;
  }
  return achievement.progress(allPlayers, sessions);
}

export function calculateGroupXP(players: Player[], sessions: GameSession[], linkedPlayer?: Player | null): number {
  return GROUP_ACHIEVEMENTS
    .filter(a => evaluateGroupAchievement(a, players, sessions, linkedPlayer))
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

    // By rarity desc
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });
}
