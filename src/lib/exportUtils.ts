import { Player, GameSession } from "@/lib/types";
import { getPlayerStats } from "@/lib/store";

export function exportToCSV(players: Player[], sessions: GameSession[], filename: string) {
  const stats = getPlayerStats(players, sessions);
  const headers = ["Player", "Avatar", "Games Played", "Wins", "Win Rate %", "Total Points"];
  const rows = stats.map(s => [
    s.player.name,
    s.player.avatar,
    s.gamesPlayed,
    s.wins,
    s.winRate.toFixed(1),
    s.totalPoints,
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

export function exportSessionsToCSV(sessions: GameSession[], players: Player[], filename: string) {
  const headers = ["Session", "Game", "Date", "Winner", "Players", "Notes"];
  const rows = sessions.map(s => {
    const winner = s.results.find(r => r.isWinner);
    const winnerPlayer = winner ? players.find(p => p.id === winner.playerId)?.name || "" : "";
    const playerNames = s.playerIds.map(id => players.find(p => p.id === id)?.name || "").join("; ");
    return [
      `"${s.name}"`,
      `"${s.gameName}"`,
      s.date,
      `"${winnerPlayer}"`,
      `"${playerNames}"`,
      `"${s.notes || ""}"`,
    ];
  });

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
