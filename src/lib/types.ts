export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  createdAt: string;
}

export interface PlayerResult {
  playerId: string;
  score: number;
  isWinner: boolean;
}

export interface GameSession {
  id: string;
  name: string;
  date: string;
  gameName: string;
  gameId?: string;
  playerIds: string[];
  results: PlayerResult[];
  notes: string;
  customStats?: Record<string, Record<string, string | number>>; // playerId -> { statKey: value }
  createdAt: string;
}

export interface PlayerStats {
  player: Player;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  totalPoints: number;
}

export const PLAYER_COLORS = [
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Orange", value: "#F97316" },
];

export const PLAYER_AVATARS = [
  "🎮", "🎲", "🃏", "🏆", "⭐", "🎯", "🎪", "🎨",
  "🦊", "🐉", "🦁", "🐺", "🦅", "🐙", "🦄", "🐸",
];

export const POPULAR_GAMES = [
  "Mario Kart", "Catan", "Poker", "Uno", "Monopoly",
  "Smash Bros", "Chess", "Risk", "Codenames", "Jenga",
  "Pictionary", "Scrabble", "Trivial Pursuit", "Charades",
];
