import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Gamepad2, Trophy, BarChart3, User, Sun, Moon, LogOut, Menu, X } from "lucide-react";
import { usePlayers, useSessions } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n, LANGUAGE_OPTIONS } from "@/lib/i18n";
import { DashboardTab, PlayersTab } from "@/components/GameTabs";
import { RankingTab, ChartsTab } from "@/components/RankingCharts";
import { PlayTab } from "@/components/PlayTab";
import { ProfileTab } from "@/components/ProfileTab";

type Tab = "profile" | "dashboard" | "players" | "play" | "ranking" | "charts";

const DARK_KEY = "gamenight_dark";

const Index = () => {
  const { t, lang, setLang } = useI18n();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { players, addPlayer, removePlayer, updatePlayer, loading: playersLoading } = usePlayers();
  const { sessions, addSession, removeSession, updateSession, loading: sessionsLoading } = useSessions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(DARK_KEY, String(isDark));
  }, [isDark]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const toggleDark = () => setIsDark(prev => !prev);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🎲</div>
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const dataLoading = playersLoading || sessionsLoading;

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; emoji: string }[] = [
    { id: "profile", label: t("tab.profile"), icon: User, emoji: "👤" },
    { id: "dashboard", label: t("tab.home"), icon: LayoutDashboard, emoji: "📊" },
    { id: "play", label: t("play.title"), icon: Gamepad2, emoji: "🎮" },
    { id: "players", label: t("tab.players"), icon: Users, emoji: "👥" },
    { id: "ranking", label: t("tab.ranking"), icon: Trophy, emoji: "🏆" },
    { id: "charts", label: t("tab.charts"), icon: BarChart3, emoji: "📈" },
  ];

  const handleTabClick = (id: Tab) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
        className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-card border-r border-border flex flex-col safe-area-top"
      >
        {/* Sidebar Header */}
        <div className="p-4 pb-2 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <h1 className="text-lg font-extrabold text-foreground">GameNight</h1>
            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">Tracker</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground active:scale-90 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-lg">👤</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground">GameNight Tracker</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/60 space-y-2">
          {/* Language */}
          <div className="flex gap-1">
            {LANGUAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value as any)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                  lang === opt.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {opt.flag}
              </button>
            ))}
          </div>
          {/* Theme + Logout */}
          <div className="flex gap-1.5">
            <button onClick={toggleDark} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-bold active:scale-95 transition-all">
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDark ? t("profile.light") : t("profile.dark")}
            </button>
            <button onClick={signOut} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-bold active:scale-95 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60 px-4 py-2.5 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-secondary/80 text-foreground active:scale-90 transition-all">
              <Menu className="w-4.5 h-4.5" />
            </button>
            <span className="text-xl">🎲</span>
            <h1 className="text-lg font-extrabold text-foreground">GameNight</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleDark} className="p-2 rounded-xl bg-secondary/80 text-foreground active:scale-90 transition-all" aria-label="Toggle dark mode">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-3 py-4">
        {dataLoading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === "profile" && <ProfileTab players={players} sessions={sessions} isDark={isDark} onToggleDark={toggleDark} />}
            {activeTab === "dashboard" && <DashboardTab players={players} sessions={sessions} />}
            {activeTab === "players" && (
              <PlayersTab players={players} sessions={sessions} onAddPlayer={addPlayer} onRemovePlayer={removePlayer} onUpdatePlayer={updatePlayer} />
            )}
            {activeTab === "play" && (
              <PlayTab players={players} sessions={sessions} onAddSession={addSession} onRemoveSession={removeSession} onUpdateSession={updateSession} />
            )}
            {activeTab === "ranking" && <RankingTab players={players} sessions={sessions} />}
            {activeTab === "charts" && <ChartsTab players={players} sessions={sessions} />}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
