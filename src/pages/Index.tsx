import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Gamepad2, Trophy, BarChart3, Swords, User, Sun, Moon, LogOut } from "lucide-react";
import { usePlayers, useSessions } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n, LANGUAGE_OPTIONS } from "@/lib/i18n";
import { DashboardTab, PlayersTab, SessionsTab } from "@/components/GameTabs";
import { RankingTab, ChartsTab } from "@/components/RankingCharts";
import { GamesTab } from "@/components/GamesTab";
import { ProfileTab } from "@/components/ProfileTab";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Tab = "dashboard" | "players" | "sessions" | "games" | "ranking" | "charts" | "profile";

const DARK_KEY = "gamenight_dark";

const Index = () => {
  const { t, lang, setLang } = useI18n();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { players, addPlayer, removePlayer, updatePlayer, loading: playersLoading } = usePlayers();
  const { sessions, addSession, removeSession, updateSession, loading: sessionsLoading } = useSessions();

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

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: t("tab.home"), icon: LayoutDashboard },
    { id: "players", label: t("tab.players"), icon: Users },
    { id: "sessions", label: t("tab.sessions"), icon: Gamepad2 },
    { id: "games", label: t("tab.games"), icon: Swords },
    { id: "ranking", label: t("tab.ranking"), icon: Trophy },
    { id: "charts", label: t("tab.charts"), icon: BarChart3 },
    { id: "profile", label: t("tab.profile"), icon: User },
  ];

  const currentFlag = LANGUAGE_OPTIONS.find(l => l.value === lang)?.flag || "🇪🇸";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60 px-4 py-2.5 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <h1 className="text-lg font-extrabold text-foreground">GameNight</h1>
            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold ml-0.5">Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Language selector */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="appearance-none bg-secondary/80 text-foreground rounded-xl pl-7 pr-2 py-1.5 text-[10px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-95 transition-all"
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.flag} {opt.label}</option>
                ))}
              </select>
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">{currentFlag}</span>
            </div>
            {/* Dark mode toggle */}
            <button onClick={toggleDark} className="p-2 rounded-xl bg-secondary/80 text-foreground active:scale-90 transition-all" aria-label="Toggle dark mode">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-xl bg-secondary/80 text-foreground active:scale-90 transition-all">
                  <User className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("profile")} className="text-xs gap-2 cursor-pointer">
                  <User className="w-3.5 h-3.5" /> {t("tab.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-xs gap-2 cursor-pointer text-destructive">
                  <LogOut className="w-3.5 h-3.5" /> {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            {activeTab === "profile" && <ProfileTab players={players} sessions={sessions} isDark={isDark} onToggleDark={toggleDark} />}
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
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
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-primary rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Index;
