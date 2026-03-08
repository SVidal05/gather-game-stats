import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, LogOut, Menu, X, UsersRound, Share2, Monitor } from "lucide-react";
import { usePlayers, useSessions } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useGroups, useGroupMembers, usePendingInvites } from "@/lib/groupStore";
import { DashboardTab, PlayersTab } from "@/components/GameTabs";
import { RankingTab, ChartsTab } from "@/components/RankingCharts";
import { PlayTab } from "@/components/PlayTab";
import { ProfileTab } from "@/components/ProfileTab";
import { SettingsTab } from "@/components/SettingsTab";
import { GroupSelector } from "@/components/GroupSelector";
import { TournamentTab } from "@/components/TournamentTab";
import { CompareTab } from "@/components/CompareTab";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type Tab = "groups" | "dashboard" | "play" | "players" | "tournaments" | "ranking" | "charts" | "compare" | "profile" | "settings";

type ThemeMode = "system" | "light" | "dark";
const THEME_KEY = "gamenight_theme";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const Index = () => {
  const { t } = useI18n();
  const { user, username, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    groups, loading: groupsLoading, activeGroup, activeGroupId,
    selectGroup, createGroup, joinGroupByCode,
    updateGroupName, deleteGroup, leaveGroup, refetch: refetchGroups,
  } = useGroups();

  const { members, removeMember, inviteByEmail, refetch: refetchMembers } = useGroupMembers(activeGroupId);
  const { invites: pendingInvites, acceptInvite, declineInvite } = usePendingInvites();

  const { players, addPlayer, removePlayer, updatePlayer, loading: playersLoading } = usePlayers(activeGroupId);
  const { sessions, addSession, removeSession, updateSession, loading: sessionsLoading } = useSessions(activeGroupId);

  const [activeTab, setActiveTab] = useState<Tab>("groups");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem(THEME_KEY) as ThemeMode) || "system"; } catch { return "system"; }
  });

  const isDark = themeMode === "system" ? getSystemDark() : themeMode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [isDark, themeMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => document.documentElement.classList.toggle("dark", mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!groupsLoading && groups.length === 0) setActiveTab("groups");
  }, [groupsLoading, groups.length]);

  const cycleTheme = () => {
    setThemeMode(prev => prev === "system" ? "light" : prev === "light" ? "dark" : "system");
  };

  const ThemeIcon = themeMode === "system" ? Monitor : themeMode === "dark" ? Moon : Sun;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="GameNight" className="w-16 h-16 mx-auto mb-3 animate-bounce" />
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const dataLoading = playersLoading || sessionsLoading;

  const tabs: { id: Tab; label: string; emoji: string; requiresGroup?: boolean }[] = [
    { id: "groups", label: t("groups.title"), emoji: "🏠" },
    { id: "dashboard", label: t("tab.home"), emoji: "📊", requiresGroup: true },
    { id: "play", label: t("play.title"), emoji: "🎮", requiresGroup: true },
    { id: "players", label: t("tab.players"), emoji: "👥", requiresGroup: true },
    { id: "tournaments", label: "Tournaments", emoji: "⚔️", requiresGroup: true },
    { id: "ranking", label: t("tab.ranking"), emoji: "🏆", requiresGroup: true },
    { id: "charts", label: t("tab.charts"), emoji: "📈", requiresGroup: true },
    { id: "compare", label: "Compare", emoji: "⚖️", requiresGroup: true },
    { id: "profile", label: t("tab.profile"), emoji: "👤" },
    { id: "settings", label: t("settings.title"), emoji: "⚙️" },
  ];

  const handleTabClick = (id: Tab) => {
    const tab = tabs.find(t => t.id === id);
    if (tab?.requiresGroup && !activeGroup) {
      setActiveTab("groups");
      setSidebarOpen(false);
      return;
    }
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const displayName = username || user.email?.split("@")[0] || "";

  const handleRefetch = () => { refetchGroups(); refetchMembers(); };

  const handleShareGroup = () => {
    if (!activeGroupId) return;
    const url = `${window.location.origin}/share/group/${activeGroupId}`;
    if (navigator.share) {
      navigator.share({ title: `${activeGroup?.name} - GameNight`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "📋", description: "Share link copied!" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.aside initial={false} animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
        className="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-card border-r border-border flex flex-col safe-area-top">
        
        {/* Sidebar Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="GameNight" className="w-8 h-8" />
            <div>
              <h1 className="text-base font-display font-bold text-foreground">GameNight</h1>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Tracker</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {displayName[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          {activeGroup && (
            <div className="mt-3 flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
              <UsersRound className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary truncate">{activeGroup.name}</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => {
            const disabled = tab.requiresGroup && !activeGroup;
            return (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)} disabled={disabled}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  disabled ? "opacity-30 cursor-not-allowed" :
                  activeTab === tab.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                <span className="text-base w-6 text-center">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {activeGroup && (
            <button onClick={handleShareGroup} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-all">
              <Share2 className="w-4 h-4" /> Share Leaderboard
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={cycleTheme} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold hover:text-foreground transition-all">
              <ThemeIcon className="w-4 h-4" />
              {themeMode === "system" ? "System" : isDark ? t("profile.dark") : t("profile.light")}
            </button>
            <button onClick={signOut} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/15 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 safe-area-top">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all">
              <Menu className="w-5 h-5" />
            </button>
            <img src={logo} alt="GameNight" className="w-8 h-8" />
            <div className="flex flex-col">
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">GameNight</h1>
              {activeGroup && (
                <button onClick={() => setActiveTab("groups")} className="text-[11px] text-primary font-semibold leading-tight hover:underline text-left">
                  {activeGroup.name}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeGroup && (
              <button onClick={handleShareGroup} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={cycleTheme} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all" aria-label="Toggle theme">
              <ThemeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {groupsLoading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "groups" && (
              <GroupSelector
                groups={groups} activeGroup={activeGroup} members={members} pendingInvites={pendingInvites}
                onSelectGroup={(id) => { selectGroup(id); setActiveTab("dashboard"); }}
                onCreateGroup={async (name) => { const g = await createGroup(name); if (g) setActiveTab("dashboard"); return g; }}
                onJoinByCode={async (code) => { const res = await joinGroupByCode(code); if (!res.error) setActiveTab("dashboard"); return res; }}
                onUpdateName={updateGroupName} onDeleteGroup={deleteGroup} onLeaveGroup={leaveGroup}
                onRemoveMember={removeMember} onInviteByEmail={inviteByEmail}
                onAcceptInvite={async (inv) => { await acceptInvite(inv); handleRefetch(); }}
                onDeclineInvite={declineInvite} onRefetch={handleRefetch}
              />
            )}
            {activeTab === "profile" && <ProfileTab players={players} sessions={sessions} isDark={isDark} onToggleDark={cycleTheme} />}
            {activeTab === "settings" && <SettingsTab isDark={isDark} onToggleDark={cycleTheme} themeMode={themeMode} onSetThemeMode={setThemeMode} />}
            {activeGroup && !dataLoading && (
              <>
                {activeTab === "dashboard" && <DashboardTab players={players} sessions={sessions} />}
                {activeTab === "players" && (
                  <PlayersTab players={players} sessions={sessions} onAddPlayer={addPlayer} onRemovePlayer={removePlayer} onUpdatePlayer={updatePlayer} />
                )}
                {activeTab === "play" && (
                  <PlayTab players={players} sessions={sessions} onAddSession={addSession} onRemoveSession={removeSession} onUpdateSession={updateSession} />
                )}
                {activeTab === "tournaments" && <TournamentTab groupId={activeGroup.id} players={players} />}
                {activeTab === "ranking" && <RankingTab players={players} sessions={sessions} />}
                {activeTab === "charts" && <ChartsTab players={players} sessions={sessions} />}
                {activeTab === "compare" && <CompareTab players={players} sessions={sessions} />}
              </>
            )}
            {activeGroup && dataLoading && !["groups", "profile", "settings"].includes(activeTab) && (
              <div className="text-center py-20">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
