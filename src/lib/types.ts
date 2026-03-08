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
  { name: "Purple", value: "hsl(262, 80%, 55%)" },
  { name: "Blue", value: "hsl(210, 90%, 55%)" },
  { name: "Green", value: "hsl(162, 60%, 45%)" },
  { name: "Orange", value: "hsl(28, 90%, 55%)" },
  { name: "Pink", value: "hsl(330, 80%, 58%)" },
  { name: "Yellow", value: "hsl(45, 95%, 55%)" },
  { name: "Red", value: "hsl(0, 72%, 55%)" },
  { name: "Cyan", value: "hsl(185, 70%, 45%)" },
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
