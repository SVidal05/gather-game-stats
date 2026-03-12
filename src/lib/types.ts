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
  losses: number;
  winRate: number;
  totalPoints: number;
  podiums: number;
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

// Extended list for autocomplete suggestions
export const KNOWN_GAMES = [
  // Board games
  "Catan", "Monopoly", "Risk", "Chess", "Scrabble", "Trivial Pursuit", "Codenames",
  "Jenga", "Pictionary", "Charades", "Ticket to Ride", "Pandemic", "Azul",
  "Dixit", "7 Wonders", "Splendor", "Carcassonne", "Clue", "Battleship",
  "Connect Four", "Dominion", "Terraforming Mars", "Wingspan", "Gloomhaven",
  "Spirit Island", "Betrayal at House on the Hill", "Exploding Kittens",
  "Cards Against Humanity", "Sequence", "Stratego", "Othello", "Backgammon",
  "Checkers", "Go", "Mahjong", "Mancala", "Boggle",
  // Card games
  "Poker", "Uno", "Magic: The Gathering", "Yu-Gi-Oh!", "Hearthstone",
  "Blackjack", "Bridge", "Rummy", "Solitaire", "Phase 10",
  // Video games
  "Fortnite", "League of Legends", "Valorant", "Counter-Strike 2", "Overwatch 2",
  "Apex Legends", "Call of Duty", "FIFA", "EA FC", "Rocket League",
  "Minecraft", "Among Us", "Fall Guys", "Roblox", "GTA V",
  "Mario Kart", "Smash Bros", "Mario Party", "Splatoon", "Animal Crossing",
  "Pokémon", "The Legend of Zelda", "Halo", "Destiny 2", "World of Warcraft",
  "Dota 2", "Teamfight Tactics", "Clash Royale", "Clash of Clans", "Brawl Stars",
  "Genshin Impact", "Honkai: Star Rail", "Elden Ring", "Dark Souls",
  "Street Fighter", "Tekken", "Mortal Kombat", "Dragon Ball FighterZ",
  "NBA 2K", "Madden NFL", "MLB The Show", "Gran Turismo", "Forza Horizon",
  "F1", "iRacing", "Wii Sports", "Just Dance", "Beat Saber",
  "Tetris", "Pac-Man", "Bomberman", "Puyo Puyo",
  // Classics / party
  "Monopoly Deal", "Dobble", "Spot It!", "Taboo", "Cranium",
  "Apples to Apples", "Telestrations", "Werewolf", "Mafia", "The Resistance",
  "Secret Hitler", "Coup", "Love Letter", "Sushi Go!", "King of Tokyo",
];
