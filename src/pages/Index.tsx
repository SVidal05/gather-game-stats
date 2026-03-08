import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Gamepad2, Trophy, BarChart3, Swords } from "lucide-react";
import { usePlayers, useSessions } from "@/lib/store";
import { DashboardTab, PlayersTab, SessionsTab } from "@/components/GameTabs";
import { RankingTab, ChartsTab } from "@/components/RankingCharts";
import { GamesTab } from "@/components/GamesTab";

type Tab = "dashboard" | "players" | "sessions" | "games" | "ranking" | "charts";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "players", label: "Players", icon: Users },
  { id: "sessions", label: "Sessions", icon: Gamepad2 },
  { id: "games", label: "Games", icon: Swords },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "charts", label: "Charts", icon: BarChart3 },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { players, addPlayer, removePlayer, updatePlayer } = usePlayers();
  const { sessions, addSession, removeSession, updateSession } = useSessions();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60 px-4 py-2.5 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-xl">🎲</span>
          <h1 className="text-lg font-extrabold text-foreground">GameNight</h1>
          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold ml-0.5">Tracker</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-3 py-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "dashboard" && <DashboardTab players={players} sessions={sessions} />}
          {activeTab === "players" && (
            <PlayersTab players={players} sessions={sessions} onAddPlayer={addPlayer} onRemovePlayer={removePlayer} onUpdatePlayer={updatePlayer} />
          )}
          {activeTab === "sessions" && (
            <SessionsTab players={players} sessions={sessions} onAddSession={addSession} onRemoveSession={removeSession} onUpdateSession={updateSession} />
          )}
          {activeTab === "games" && <GamesTab players={players} sessions={sessions} />}
          {activeTab === "ranking" && <RankingTab players={players} sessions={sessions} />}
          {activeTab === "charts" && <ChartsTab players={players} sessions={sessions} />}
        </motion.div>
      </main>

      {/* Bottom Navigation - iOS style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/92 backdrop-blur-xl border-t border-border/60 safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around px-1 py-1.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab relative ${activeTab === tab.id ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              <tab.icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] leading-tight">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Index;
