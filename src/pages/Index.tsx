import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, LogOut, Menu, X, Monitor,
  BarChart3, Gamepad2, Users, Trophy, UsersRound,
  UserCircle, Settings, ChevronDown, ChevronRight, LayoutDashboard, Swords,
} from "lucide-react";
import { usePlayers, useSessions } from "@/lib/store";
import { useAllUserSessions } from "@/hooks/useAllUserSessions";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useGroups, useGroupMembers, usePendingInvites } from "@/lib/groupStore";
import { PlayersTab } from "@/components/GameTabs";
import { OverviewTab } from "@/components/OverviewTab";
import { RankingTab, ChartsTab } from "@/components/RankingCharts";
import { PlayTab } from "@/components/PlayTab";
import { ProfileTab } from "@/components/ProfileTab";
import { SettingsTab } from "@/components/SettingsTab";
import { GroupSelector } from "@/components/GroupSelector";
import { TournamentTab } from "@/components/TournamentTab";
import { CompareTab } from "@/components/CompareTab";
import { GameStatsPage } from "@/components/GameStatsPage";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type Tab = "groups" | "overview" | "charts" | "play" | "players" | "compare" | "tournaments" | "ranking" | "profile" | "settings";

type ThemeMode = "system" | "light" | "dark";
const THEME_KEY = "gamenight_theme";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface NavSection {
  label: string;
  icon: React.ElementType;
  items: { id: Tab; label: string; requiresGroup?: boolean }[];
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

  const { players, addPlayer, removePlayer, updatePlayer, loading: playersLoading, refetch: refetchPlayers } = usePlayers(activeGroupId);
  const { sessions, addSession, removeSession, updateSession, loading: sessionsLoading } = useSessions(activeGroupId);
  const { sessions: globalSessions, players: globalPlayers } = useAllUserSessions();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [groupSelectorOpen, setGroupSelectorOpen] = useState(false);
  const [gameStatsName, setGameStatsName] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem(THEME_KEY) as ThemeMode) || "system"; } catch { return "system"; }
  });

  const isDark = themeMode === "system" ? getSystemDark() : themeMode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [isDark, themeMode]);

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

  const navSections: NavSection[] = [
    {
      label: "Stats",
      icon: BarChart3,
      items: [
        { id: "overview", label: "Overview", requiresGroup: true },
        { id: "charts", label: "Charts", requiresGroup: true },
      ],
    },
    {
      label: "Play",
      icon: Gamepad2,
      items: [
        { id: "play", label: "Play", requiresGroup: true },
      ],
    },
    {
      label: "Players",
      icon: Users,
      items: [
        { id: "players", label: "All Players", requiresGroup: true },
        { id: "compare", label: "Compare", requiresGroup: true },
      ],
    },
    {
      label: "Competitions",
      icon: Trophy,
      items: [
        { id: "ranking", label: "Leaderboard", requiresGroup: true },
        { id: "tournaments", label: "Tournaments", requiresGroup: true },
      ],
    },
    {
      label: "Group",
      icon: UsersRound,
      items: [
        { id: "groups", label: "Group" },
      ],
    },
  ];

  // Auto-expand the section containing active tab
  useEffect(() => {
    const section = navSections.find(s => s.items.some(i => i.id === activeTab));
    if (section) setExpandedSection(section.label);
  }, [activeTab]);

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
  const displayName = username || user.email?.split("@")[0] || "";

  const handleTabClick = (id: Tab) => {
    const section = navSections.find(s => s.items.some(i => i.id === id));
    const item = section?.items.find(i => i.id === id);
    if (item?.requiresGroup && !activeGroup) {
      setActiveTab("groups");
      setSidebarOpen(false);
      return;
    }
    setActiveTab(id);
    setGameStatsName(null);
    setSidebarOpen(false);
  };

  const handleRefetch = () => { refetchGroups(); refetchMembers(); };

  const toggleSection = (label: string) => {
    setExpandedSection(prev => prev === label ? null : label);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
        className="fixed top-0 left-0 bottom-0 z-50 w-[300px] bg-card border-r border-border flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="GameNight" className="w-8 h-8" />
            <div>
              <h1 className="text-base font-display font-bold text-foreground">GameNight</h1>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold tracking-wide">Tracker</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {displayName[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Group Selector */}
        {groups.length > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <button
              onClick={() => setGroupSelectorOpen(!groupSelectorOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UsersRound className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-primary truncate">
                  {activeGroup?.name || "Select group"}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-primary/60 transition-transform ${groupSelectorOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {groupSelectorOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1.5 space-y-0.5">
                    {groups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          selectGroup(g.id);
                          setGroupSelectorOpen(false);
                          if (activeTab === "groups") setActiveTab("overview");
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${
                          g.id === activeGroupId
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {navSections.map(section => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSection === section.label;
            const hasActiveItem = section.items.some(i => i.id === activeTab);
            const isSingleItem = section.items.length === 1;

            if (isSingleItem) {
              const item = section.items[0];
              const disabled = item.requiresGroup && !activeGroup;
              return (
                <button
                  key={section.label}
                  onClick={() => handleTabClick(item.id)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    disabled ? "opacity-30 cursor-not-allowed" :
                    activeTab === item.id ? "bg-primary text-primary-foreground shadow-md" :
                    "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <SectionIcon className="w-4.5 h-4.5" />
                  <span>{section.label}</span>
                </button>
              );
            }

            return (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasActiveItem ? "text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className="w-4.5 h-4.5" />
                    <span>{section.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-7 pl-3 border-l-2 border-border/60 space-y-0.5 py-1">
                        {section.items.map(item => {
                          const disabled = item.requiresGroup && !activeGroup;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleTabClick(item.id)}
                              disabled={disabled}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                disabled ? "opacity-30 cursor-not-allowed" :
                                activeTab === item.id ? "bg-primary text-primary-foreground shadow-sm" :
                                "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border px-3 py-2 space-y-0.5">
          <button
            onClick={() => handleTabClick("profile")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "profile" ? "bg-primary text-primary-foreground shadow-md" :
              "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <UserCircle className="w-4.5 h-4.5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => handleTabClick("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings" ? "bg-primary text-primary-foreground shadow-md" :
              "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Settings</span>
          </button>

          <div className="flex gap-2 pt-1">
            <button
              onClick={cycleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground transition-all"
            >
              <ThemeIcon className="w-4 h-4" />
              <span>{themeMode === "system" ? "System" : isDark ? "Dark" : "Light"}</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/15 transition-all"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
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
          <button onClick={cycleTheme} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all" aria-label="Toggle theme">
            <ThemeIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {groupsLoading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === "groups" && (
              <GroupSelector
                groups={groups} activeGroup={activeGroup} members={members} pendingInvites={pendingInvites}
                onSelectGroup={(id) => { selectGroup(id); setActiveTab("overview"); }}
                onCreateGroup={async (name) => { const g = await createGroup(name); if (g) setActiveTab("overview"); return g; }}
                onJoinByCode={async (code) => { const res = await joinGroupByCode(code); if (!res.error) setActiveTab("overview"); return res; }}
                onUpdateName={updateGroupName} onDeleteGroup={deleteGroup} onLeaveGroup={leaveGroup}
                onRemoveMember={removeMember} onInviteByEmail={inviteByEmail}
                onAcceptInvite={async (inv) => { await acceptInvite(inv); handleRefetch(); }}
                onDeclineInvite={declineInvite} onRefetch={handleRefetch}
              />
            )}
            {activeTab === "profile" && <ProfileTab players={players} sessions={sessions} globalPlayers={globalPlayers} globalSessions={globalSessions} isDark={isDark} onToggleDark={cycleTheme} />}
            {activeTab === "settings" && <SettingsTab isDark={isDark} onToggleDark={cycleTheme} themeMode={themeMode} onSetThemeMode={setThemeMode} />}
            {activeGroup && !dataLoading && (
              <>
                {activeTab === "overview" && !gameStatsName && (
                  <OverviewTab players={players} sessions={sessions} onGameClick={(name) => setGameStatsName(name)} />
                )}
                {activeTab === "overview" && gameStatsName && (
                  <GameStatsPage gameName={gameStatsName} players={players} sessions={sessions} onBack={() => setGameStatsName(null)} />
                )}
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
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Index;
