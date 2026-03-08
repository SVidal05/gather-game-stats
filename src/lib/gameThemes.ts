import gameMarioKart from "@/assets/game-mario-kart.jpg";
import gameCatan from "@/assets/game-catan.jpg";
import gamePoker from "@/assets/game-poker.jpg";
import gameUno from "@/assets/game-uno.jpg";
import gameChess from "@/assets/game-chess.jpg";
import gameMonopoly from "@/assets/game-monopoly.jpg";
import gameSmashBros from "@/assets/game-smash-bros.jpg";
import gameDefault from "@/assets/game-default.jpg";
import gameJenga from "@/assets/game-jenga.jpg";
import gameRisk from "@/assets/game-risk.jpg";
import gameScrabble from "@/assets/game-scrabble.jpg";
import gamePictionary from "@/assets/game-pictionary.jpg";
import gameCodenames from "@/assets/game-codenames.jpg";
import gameTrivialPursuit from "@/assets/game-trivial-pursuit.jpg";

export interface GameTheme {
  id: string;
  name: string;
  image: string;
  emoji: string;
  gradient: string;
  primaryColor: string;
  secondaryColor: string;
  category: "racing" | "strategy" | "cards" | "party" | "fighting" | "classic" | "word";
  description: string;
  customStats: { key: string; label: string; emoji: string }[];
  tips: string[];
}

export const GAME_THEMES: Record<string, GameTheme> = {
  "Mario Kart": {
    id: "mario-kart",
    name: "Mario Kart",
    image: gameMarioKart,
    emoji: "🏎️",
    gradient: "linear-gradient(135deg, hsl(0, 80%, 55%), hsl(45, 95%, 55%))",
    primaryColor: "hsl(0, 80%, 55%)",
    secondaryColor: "hsl(45, 95%, 55%)",
    category: "racing",
    description: "High-speed racing action with items and power-ups!",
    customStats: [
      { key: "firstPlace", label: "1st Place Finishes", emoji: "🥇" },
      { key: "blueShells", label: "Blue Shells Received", emoji: "🔵" },
      { key: "itemsUsed", label: "Items Used", emoji: "🍌" },
      { key: "bestTrack", label: "Best Track", emoji: "🏁" },
    ],
    tips: ["Track positions per race for detailed stats", "Record favorite tracks", "Note comeback victories"],
  },
  "Catan": {
    id: "catan",
    name: "Catan",
    image: gameCatan,
    emoji: "🏰",
    gradient: "linear-gradient(135deg, hsl(28, 90%, 55%), hsl(45, 80%, 50%))",
    primaryColor: "hsl(28, 90%, 55%)",
    secondaryColor: "hsl(45, 80%, 50%)",
    category: "strategy",
    description: "Trade, build, and settle on the island of Catan!",
    customStats: [
      { key: "longestRoad", label: "Longest Road", emoji: "🛤️" },
      { key: "largestArmy", label: "Largest Army", emoji: "⚔️" },
      { key: "settlements", label: "Settlements Built", emoji: "🏠" },
      { key: "trades", label: "Trades Made", emoji: "🤝" },
    ],
    tips: ["Track victory points breakdown", "Record resource strategies", "Note who had longest road/largest army"],
  },
  "Poker": {
    id: "poker",
    name: "Poker",
    image: gamePoker,
    emoji: "🃏",
    gradient: "linear-gradient(135deg, hsl(140, 50%, 25%), hsl(140, 40%, 35%))",
    primaryColor: "hsl(140, 50%, 30%)",
    secondaryColor: "hsl(0, 70%, 50%)",
    category: "cards",
    description: "Bluff, bet, and play your best hand!",
    customStats: [
      { key: "handsWon", label: "Hands Won", emoji: "✋" },
      { key: "bluffs", label: "Successful Bluffs", emoji: "😏" },
      { key: "allIns", label: "All-Ins", emoji: "💰" },
      { key: "bestHand", label: "Best Hand", emoji: "🂡" },
    ],
    tips: ["Track buy-ins and cash-outs", "Record biggest pots won", "Note memorable hands"],
  },
  "Uno": {
    id: "uno",
    name: "Uno",
    image: gameUno,
    emoji: "🎴",
    gradient: "linear-gradient(135deg, hsl(0, 80%, 55%), hsl(210, 90%, 55%), hsl(120, 60%, 45%), hsl(45, 95%, 55%))",
    primaryColor: "hsl(0, 80%, 55%)",
    secondaryColor: "hsl(210, 90%, 55%)",
    category: "cards",
    description: "The classic card game of matching colors and numbers!",
    customStats: [
      { key: "draw4Played", label: "+4 Cards Played", emoji: "➕" },
      { key: "reversals", label: "Reverse Cards", emoji: "🔄" },
      { key: "unosCalled", label: "UNO! Called", emoji: "☝️" },
      { key: "forgotUno", label: "Forgot to Say UNO", emoji: "😱" },
    ],
    tips: ["Track penalty cards drawn", "Record fastest wins", "Note epic +4 chain reactions"],
  },
  "Chess": {
    id: "chess",
    name: "Chess",
    image: gameChess,
    emoji: "♟️",
    gradient: "linear-gradient(135deg, hsl(220, 20%, 20%), hsl(220, 15%, 45%))",
    primaryColor: "hsl(220, 20%, 25%)",
    secondaryColor: "hsl(220, 15%, 60%)",
    category: "strategy",
    description: "The ultimate game of strategy and intellect!",
    customStats: [
      { key: "checkmates", label: "Checkmates", emoji: "👑" },
      { key: "draws", label: "Draws", emoji: "🤝" },
      { key: "openings", label: "Favorite Opening", emoji: "📖" },
      { key: "fastestWin", label: "Fastest Win (moves)", emoji: "⚡" },
    ],
    tips: ["Record opening strategies used", "Track wins as white vs black", "Note brilliant moves"],
  },
  "Monopoly": {
    id: "monopoly",
    name: "Monopoly",
    image: gameMonopoly,
    emoji: "🏦",
    gradient: "linear-gradient(135deg, hsl(150, 60%, 35%), hsl(150, 50%, 45%))",
    primaryColor: "hsl(150, 60%, 35%)",
    secondaryColor: "hsl(150, 50%, 50%)",
    category: "classic",
    description: "Buy, trade, and dominate the real estate market!",
    customStats: [
      { key: "properties", label: "Properties Owned", emoji: "🏘️" },
      { key: "bankruptcies", label: "Players Bankrupted", emoji: "💸" },
      { key: "jailTime", label: "Times in Jail", emoji: "🔒" },
      { key: "richest", label: "Peak Net Worth", emoji: "💎" },
    ],
    tips: ["Track property monopolies achieved", "Record game duration", "Note best trade deals"],
  },
  "Smash Bros": {
    id: "smash-bros",
    name: "Smash Bros",
    image: gameSmashBros,
    emoji: "👊",
    gradient: "linear-gradient(135deg, hsl(262, 80%, 50%), hsl(330, 80%, 55%))",
    primaryColor: "hsl(262, 80%, 55%)",
    secondaryColor: "hsl(330, 80%, 55%)",
    category: "fighting",
    description: "Battle it out with iconic characters!",
    customStats: [
      { key: "kos", label: "Total KOs", emoji: "💥" },
      { key: "selfDestructs", label: "Self Destructs", emoji: "😵" },
      { key: "mainCharacter", label: "Main Character", emoji: "🎮" },
      { key: "perfectGames", label: "Perfect Games", emoji: "✨" },
    ],
    tips: ["Track character picks", "Record stock counts", "Note epic comeback KOs"],
  },
  "Jenga": {
    id: "jenga",
    name: "Jenga",
    image: gameJenga,
    emoji: "🧱",
    gradient: "linear-gradient(135deg, hsl(30, 50%, 55%), hsl(30, 40%, 65%))",
    primaryColor: "hsl(30, 50%, 55%)",
    secondaryColor: "hsl(30, 40%, 70%)",
    category: "party",
    description: "Steady hands win! Don't let the tower fall!",
    customStats: [
      { key: "blocksRemoved", label: "Blocks Removed", emoji: "🪵" },
      { key: "towersFelled", label: "Towers Knocked", emoji: "💨" },
      { key: "maxHeight", label: "Max Tower Height", emoji: "📏" },
      { key: "steadyHands", label: "Steady Hands Award", emoji: "🤲" },
    ],
    tips: ["Record number of moves before collapse", "Track who knocked it down", "Note most precarious pulls"],
  },
  "Risk": {
    id: "risk",
    name: "Risk",
    image: gameRisk,
    emoji: "🗺️",
    gradient: "linear-gradient(135deg, hsl(210, 60%, 35%), hsl(210, 50%, 50%))",
    primaryColor: "hsl(210, 60%, 40%)",
    secondaryColor: "hsl(0, 60%, 50%)",
    category: "strategy",
    description: "Conquer the world through strategic warfare!",
    customStats: [
      { key: "continents", label: "Continents Held", emoji: "🌍" },
      { key: "armies", label: "Armies Deployed", emoji: "⚔️" },
      { key: "territories", label: "Max Territories", emoji: "🏴" },
      { key: "eliminations", label: "Players Eliminated", emoji: "☠️" },
    ],
    tips: ["Track territory control over time", "Record alliance formations", "Note epic battles"],
  },
  "Scrabble": {
    id: "scrabble",
    name: "Scrabble",
    image: gameScrabble,
    emoji: "🔤",
    gradient: "linear-gradient(135deg, hsl(35, 60%, 45%), hsl(45, 70%, 55%))",
    primaryColor: "hsl(35, 60%, 50%)",
    secondaryColor: "hsl(45, 70%, 55%)",
    category: "word",
    description: "Build words, score big! The classic word game.",
    customStats: [
      { key: "highestWord", label: "Highest Word Score", emoji: "💯" },
      { key: "bingo", label: "Bingos (7-letter words)", emoji: "🎰" },
      { key: "tripleWord", label: "Triple Word Scores", emoji: "3️⃣" },
      { key: "longestWord", label: "Longest Word", emoji: "📏" },
    ],
    tips: ["Track highest-scoring words", "Record bingo plays", "Note creative word combos"],
  },
  "Pictionary": {
    id: "pictionary",
    name: "Pictionary",
    image: gamePictionary,
    emoji: "🎨",
    gradient: "linear-gradient(135deg, hsl(20, 90%, 55%), hsl(340, 75%, 55%))",
    primaryColor: "hsl(20, 90%, 55%)",
    secondaryColor: "hsl(340, 75%, 55%)",
    category: "party",
    description: "Draw it out! Can your team guess in time?",
    customStats: [
      { key: "fastGuess", label: "Fastest Guess (sec)", emoji: "⚡" },
      { key: "artistWins", label: "Rounds Won Drawing", emoji: "🖌️" },
      { key: "hardClues", label: "Hard Clues Solved", emoji: "🧩" },
      { key: "funniest", label: "Funniest Drawing", emoji: "😂" },
    ],
    tips: ["Track which categories are easiest", "Record speed of guesses", "Note hilarious drawing moments"],
  },
  "Codenames": {
    id: "codenames",
    name: "Codenames",
    image: gameCodenames,
    emoji: "🕵️",
    gradient: "linear-gradient(135deg, hsl(0, 65%, 45%), hsl(220, 65%, 45%))",
    primaryColor: "hsl(0, 65%, 50%)",
    secondaryColor: "hsl(220, 65%, 50%)",
    category: "word",
    description: "Give clues, find agents, avoid the assassin!",
    customStats: [
      { key: "cluesGiven", label: "Clues Given", emoji: "💬" },
      { key: "perfectRounds", label: "Perfect Rounds", emoji: "✨" },
      { key: "assassinHits", label: "Assassin Hits", emoji: "💀" },
      { key: "bestClue", label: "Best Clue Combo", emoji: "🧠" },
    ],
    tips: ["Track spymaster vs operative wins", "Record best multi-word clues", "Note assassin card disasters"],
  },
  "Trivial Pursuit": {
    id: "trivial-pursuit",
    name: "Trivial Pursuit",
    image: gameTrivialPursuit,
    emoji: "❓",
    gradient: "linear-gradient(135deg, hsl(280, 60%, 50%), hsl(180, 60%, 45%))",
    primaryColor: "hsl(280, 60%, 50%)",
    secondaryColor: "hsl(180, 60%, 45%)",
    category: "classic",
    description: "Test your knowledge across all categories!",
    customStats: [
      { key: "wedges", label: "Wedges Collected", emoji: "🧀" },
      { key: "streaks", label: "Longest Answer Streak", emoji: "🔥" },
      { key: "bestCategory", label: "Best Category", emoji: "🏆" },
      { key: "totalCorrect", label: "Total Correct", emoji: "✅" },
    ],
    tips: ["Track performance by category", "Record answer streaks", "Note surprise correct answers"],
  },
};

export function getGameTheme(gameName: string): GameTheme {
  if (GAME_THEMES[gameName]) return GAME_THEMES[gameName];
  
  const key = Object.keys(GAME_THEMES).find(
    k => k.toLowerCase() === gameName.toLowerCase()
  );
  if (key) return GAME_THEMES[key];

  return {
    id: "default",
    name: gameName,
    image: gameDefault,
    emoji: "🎲",
    gradient: "linear-gradient(135deg, hsl(262, 80%, 55%), hsl(210, 90%, 55%))",
    primaryColor: "hsl(262, 80%, 55%)",
    secondaryColor: "hsl(210, 90%, 55%)",
    category: "party",
    description: "A great game to play with friends!",
    customStats: [
      { key: "highScore", label: "High Score", emoji: "🏅" },
      { key: "streak", label: "Win Streak", emoji: "🔥" },
      { key: "mvp", label: "MVP Moments", emoji: "⭐" },
      { key: "funLevel", label: "Fun Level", emoji: "😄" },
    ],
    tips: ["Track scores each round", "Record memorable moments", "Note winning strategies"],
  };
}

export function getCategoryColor(category: GameTheme["category"]): string {
  const colors: Record<GameTheme["category"], string> = {
    racing: "hsl(0, 80%, 55%)",
    strategy: "hsl(28, 90%, 55%)",
    cards: "hsl(262, 80%, 55%)",
    party: "hsl(330, 80%, 58%)",
    fighting: "hsl(280, 70%, 55%)",
    classic: "hsl(162, 60%, 45%)",
    word: "hsl(35, 60%, 50%)",
  };
  return colors[category];
}

export function getCategoryEmoji(category: GameTheme["category"]): string {
  const emojis: Record<GameTheme["category"], string> = {
    racing: "🏁",
    strategy: "🧠",
    cards: "🃏",
    party: "🎉",
    fighting: "⚔️",
    classic: "🎯",
    word: "🔤",
  };
  return emojis[category];
}
