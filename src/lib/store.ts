import { useState, useEffect, useCallback } from "react";
import { Player, GameSession, PlayerStats } from "./types";

const PLAYERS_KEY = "gamenight_players";
const SESSIONS_KEY = "gamenight_sessions";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(() => loadFromStorage(PLAYERS_KEY, []));

  useEffect(() => { saveToStorage(PLAYERS_KEY, players); }, [players]);

  const addPlayer = useCallback((player: Omit<Player, "id" | "createdAt">) => {
    const newPlayer: Player = {
      ...player,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  return { players, addPlayer, removePlayer, updatePlayer };
}

export function useSessions() {
  const [sessions, setSessions] = useState<GameSession[]>(() => loadFromStorage(SESSIONS_KEY, []));

  useEffect(() => { saveToStorage(SESSIONS_KEY, sessions); }, [sessions]);

  const addSession = useCallback((session: Omit<GameSession, "id" | "createdAt">) => {
    const newSession: GameSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, []);

  const removeSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<GameSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  return { sessions, addSession, removeSession, updateSession };
}

export function getPlayerStats(players: Player[], sessions: GameSession[]): PlayerStats[] {
  return players.map(player => {
    const playerSessions = sessions.filter(s => s.results.some(r => r.playerId === player.id));
    const wins = sessions.filter(s => s.results.some(r => r.playerId === player.id && r.isWinner)).length;
    const totalPoints = sessions.reduce((sum, s) => {
      const result = s.results.find(r => r.playerId === player.id);
      return sum + (result?.score || 0);
    }, 0);

    return {
      player,
      gamesPlayed: playerSessions.length,
      wins,
      winRate: playerSessions.length > 0 ? (wins / playerSessions.length) * 100 : 0,
      totalPoints,
    };
  });
}
