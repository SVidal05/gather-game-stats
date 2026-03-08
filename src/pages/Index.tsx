import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Gamepad2, Trophy, BarChart3, User, Sun, Moon, LogOut, Menu, X, Settings, UsersRound } from "lucide-react";
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
import logo from "@/assets/logo.png";

type Tab = "groups" | "profile" | "dashboard" | "players" | "play" | "ranking" | "charts" | "settings";

const DARK_KEY = "gamenight_dark";

const Index = () => {
  const { t, lang, setLang } = useI18n();
  const { user, username, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const {
    groups, loading: groupsLoading, activeGroup, activeGroupId,
    selectGroup, createGroup, joinGroupByCode,
    updateGroupName, deleteGroup, leaveGroup, refetch: refetchGroups,
  } = useGroups();

  const { members, removeMember, inviteByEmail, refetch: refetchMembers } = useGroupMembers(activeGroupId);
  const { invites: pendingInvites, acceptInvite, declineInvite } = usePendingInvites();

  const { players, addPlayer, removePlayer, updatePlayer, loading: playersLoading } = usePlayers(activeGroupId);
  const { sessions, addSession, removeSession, updateSession, loading: sessionsLoading } = useSessions(activeGroupId);

  const [activeTab, setActiveTab] = useState<Tab>(() => "groups");
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

  // Auto-navigate to groups if no active group
  useEffect(() => {
    if (!groupsLoading && groups.length === 0) {
      setActiveTab("groups");
    }
  }, [groupsLoading, groups.length]);

  const toggleDark = () => setIsDark(prev => !prev);

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
    { id: "ranking", label: t("tab.ranking"), emoji: "🏆", requiresGroup: true },
    { id: "charts", label: t("tab.charts"), emoji: "📈", requiresGroup: true },
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

  const handleRefetch = () => {
    refetchGroups();
    refetchMembers();
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
        <div className="p-4 pb-2 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GameNight" className="w-7 h-7" />
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
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          {activeGroup && (
            <div className="mt-2 flex items-center gap-1.5 bg-primary/10 rounded-xl px-2.5 py-1.5">
              <UsersRound className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary truncate">{activeGroup.name}</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => {
            const disabled = tab.requiresGroup && !activeGroup;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                  disabled ? "opacity-30 cursor-not-allowed" :
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span className="text-base">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/60 space-y-2">
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
            <img src={logo} alt="GameNight" className="w-7 h-7" />
            <div className="flex flex-col">
              <h1 className="text-lg font-extrabold text-foreground leading-tight">GameNight</h1>
              {activeGroup && (
                <button onClick={() => setActiveTab("groups")} className="text-[10px] text-primary font-bold leading-tight hover:underline text-left">
                  {activeGroup.name}
                </button>
              )}
            </div>
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
        {groupsLoading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === "groups" && (
              <GroupSelector
                groups={groups}
                activeGroup={activeGroup}
                members={members}
                pendingInvites={pendingInvites}
                onSelectGroup={(id) => { selectGroup(id); setActiveTab("dashboard"); }}
                onCreateGroup={async (name) => { const g = await createGroup(name); if (g) setActiveTab("dashboard"); return g; }}
                onJoinByCode={async (code) => { const res = await joinGroupByCode(code); if (!res.error) setActiveTab("dashboard"); return res; }}
                onUpdateName={updateGroupName}
                onDeleteGroup={deleteGroup}
                onLeaveGroup={leaveGroup}
                onRemoveMember={removeMember}
                onInviteByEmail={inviteByEmail}
                onAcceptInvite={async (inv) => { await acceptInvite(inv); handleRefetch(); }}
                onDeclineInvite={declineInvite}
                onRefetch={handleRefetch}
              />
            )}
            {activeTab === "profile" && <ProfileTab players={players} sessions={sessions} isDark={isDark} onToggleDark={toggleDark} />}
            {activeTab === "settings" && <SettingsTab isDark={isDark} onToggleDark={toggleDark} />}
            {activeGroup && !dataLoading && (
              <>
                {activeTab === "dashboard" && <DashboardTab players={players} sessions={sessions} />}
                {activeTab === "players" && (
                  <PlayersTab players={players} sessions={sessions} onAddPlayer={addPlayer} onRemovePlayer={removePlayer} onUpdatePlayer={updatePlayer} />
                )}
                {activeTab === "play" && (
                  <PlayTab players={players} sessions={sessions} onAddSession={addSession} onRemoveSession={removeSession} onUpdateSession={updateSession} />
                )}
                {activeTab === "ranking" && <RankingTab players={players} sessions={sessions} />}
                {activeTab === "charts" && <ChartsTab players={players} sessions={sessions} />}
              </>
            )}
            {activeGroup && dataLoading && activeTab !== "groups" && activeTab !== "profile" && activeTab !== "settings" && (
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
