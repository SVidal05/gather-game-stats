import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Link2, Users, ChevronRight, Mail, Check, Copy, Crown, Shield, Trash2, LogOut, Edit3, X, UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Group, GroupMember, GroupInvite } from "@/lib/groupStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { JoinGroupPlayerDialog } from "@/components/JoinGroupPlayerDialog";
import logo from "@/assets/logo.png";

interface GroupSelectorProps {
  groups: Group[];
  activeGroup: Group | null;
  members: GroupMember[];
  pendingInvites: GroupInvite[];
  onSelectGroup: (id: string) => void;
  onCreateGroup: (name: string) => Promise<Group | null>;
  onJoinByCode: (code: string) => Promise<{ error: string | null }>;
  onUpdateName: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onLeaveGroup: (groupId: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onInviteByEmail: (email: string, invitedBy: string) => Promise<{ error: string | null }>;
  onAcceptInvite: (invite: GroupInvite) => Promise<void>;
  onDeclineInvite: (inviteId: string) => Promise<void>;
  onRefetch: () => void;
}

type View = "list" | "manage";

export function GroupSelector({
  groups, activeGroup, members, pendingInvites,
  onSelectGroup, onCreateGroup, onJoinByCode,
  onUpdateName, onDeleteGroup, onLeaveGroup,
  onRemoveMember, onInviteByEmail, onAcceptInvite, onDeclineInvite,
  onRefetch,
}: GroupSelectorProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<View>("list");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  const [joinedGroupName, setJoinedGroupName] = useState("");

  const isAdmin = activeGroup && members.some(m => m.userId === user?.id && m.role === "admin");
  const isOwner = activeGroup?.ownerId === user?.id;
  const isPersonalGroup = !!activeGroup?.isPersonal;

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    const group = await onCreateGroup(newGroupName.trim());
    setLoading(false);
    if (group) { setNewGroupName(""); setCreateDialogOpen(false); onRefetch(); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    const { error } = await onJoinByCode(joinCode.trim());
    setLoading(false);
    if (error) {
      toast({ title: t("groups.invalidCode"), description: error, variant: "destructive" });
    } else {
      toast({ title: t("groups.joined") });
      setJoinCode(""); setJoinDialogOpen(false); onRefetch();
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setLoading(true);
    const { error } = await onInviteByEmail(inviteEmail.trim(), user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: t("groups.inviteSent") });
      setInviteEmail(""); setInviteDialogOpen(false);
    }
  };

  const copyInviteCode = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveName = async () => {
    if (!activeGroup || !editName.trim()) return;
    await onUpdateName(activeGroup.id, editName.trim());
    setEditingName(false);
  };

  // ─── Manage View ───
  if (view === "manage" && activeGroup) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={() => setView("list")} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-lg h-9 text-sm" />
                <Button size="sm" onClick={handleSaveName} className="rounded-lg"><Check className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display font-bold text-foreground">{activeGroup.name}</h2>
                {isAdmin && (
                  <button onClick={() => { setEditName(activeGroup.name); setEditingName(true); }} className="text-muted-foreground hover:text-primary p-1">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-muted-foreground text-sm">{t("groups.manage")}</p>
          </div>
        </div>

        {/* Invite Code / Personal note */}
        {isPersonalGroup ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="game-card space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {t("groups.personalWorkspace")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("groups.personalWorkspaceHint")}
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="game-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              {t("groups.inviteCode")}
            </h3>
            <div className="flex gap-2">
              <code className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm font-mono text-foreground select-all">
                {activeGroup.inviteCode}
              </code>
              <Button size="sm" variant="outline" className="rounded-lg gap-2" onClick={copyInviteCode}>
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? t("groups.copied") : t("groups.copyCode")}
              </Button>
            </div>
            {isAdmin && (
              <Button size="sm" className="rounded-lg gap-2 w-full" onClick={() => setInviteDialogOpen(true)}>
                <Mail className="w-4 h-4" /> {t("groups.inviteByEmail")}
              </Button>
            )}
          </motion.div>
        )}

        {/* Members */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="game-card space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t("groups.members")} ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                    {m.role === "admin" ? <Crown className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {m.username || "User"}
                      {m.userId === user?.id && <span className="text-muted-foreground ml-1">{t("groups.you")}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.role === "admin" ? t("groups.admin") : t("groups.member")}
                      {m.userId === activeGroup.ownerId && ` · ${t("groups.owner")}`}
                    </p>
                  </div>
                </div>
                {isAdmin && m.userId !== user?.id && m.userId !== activeGroup.ownerId && (
                  <button onClick={() => onRemoveMember(m.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        {!isPersonalGroup && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
            {!isOwner && (
              <Button variant="outline" className="w-full rounded-lg gap-2 text-destructive border-destructive/30" onClick={() => onLeaveGroup(activeGroup.id)}>
                <LogOut className="w-4 h-4" /> {t("groups.leaveGroup")}
              </Button>
            )}
            {isOwner && (
              <Button variant="destructive" className="w-full rounded-lg gap-2" onClick={() => { onDeleteGroup(activeGroup.id); setView("list"); }}>
                <Trash2 className="w-4 h-4" /> {t("groups.deleteGroup")}
              </Button>
            )}
          </motion.div>
        )}

        {/* Invite Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)]">
            <DialogHeader><DialogTitle className="font-display font-bold">{t("groups.inviteByEmail")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder={t("groups.emailPlaceholder")} className="rounded-lg h-11" />
              <Button onClick={handleInvite} className="w-full rounded-lg h-11 font-semibold" disabled={loading || !inviteEmail.trim()}>
                {t("groups.sendInvite")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Group List ───
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">{t("groups.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("groups.subtitle")}</p>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            {t("groups.pendingInvites")}
          </h3>
          {pendingInvites.map(inv => (
            <div key={inv.id} className="game-card !p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">{inv.groupName}</p>
                <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-lg text-xs h-9" onClick={() => { onAcceptInvite(inv); onRefetch(); }}>
                  {t("groups.acceptInvite")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg text-xs h-9" onClick={() => onDeclineInvite(inv.id)}>
                  {t("groups.declineInvite")}
                </Button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Group Cards */}
      {groups.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <img src={logo} alt="GameNight" className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-display font-bold text-foreground">{t("groups.createFirst")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px] mx-auto">{t("groups.createFirstMsg")}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`game-card !p-4 cursor-pointer flex items-center justify-between ${activeGroup?.id === group.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => onSelectGroup(group.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg">🎮</div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {group.isPersonal ? t("groups.personalLabel") : (group.ownerId === user?.id ? t("groups.owner") : t("groups.member"))}
                    {group.isPersonal && <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">{t("groups.soloTag")}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeGroup?.id === group.id && (
                  <button
                    onClick={e => { e.stopPropagation(); setView("manage"); }}
                    className="text-muted-foreground hover:text-primary p-2"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="flex-1 rounded-lg h-11 font-semibold gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" /> {t("groups.createGroup")}
        </Button>
        <Button variant="outline" className="flex-1 rounded-lg h-11 font-semibold gap-2" onClick={() => setJoinDialogOpen(true)}>
          <UserPlus className="w-4 h-4" /> {t("groups.joinGroup")}
        </Button>
      </div>

      {/* Dialogs */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle className="font-display font-bold">{t("groups.createGroup")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={t("groups.groupNamePlaceholder")} className="rounded-lg h-11" />
            <Button onClick={handleCreate} className="w-full rounded-lg h-11 font-semibold" disabled={loading || !newGroupName.trim()}>
              {t("groups.createGroup")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)]">
          <DialogHeader><DialogTitle className="font-display font-bold">{t("groups.joinGroup")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder={t("groups.inviteCodePlaceholder")} className="rounded-lg h-11 font-mono" />
            <Button onClick={handleJoin} className="w-full rounded-lg h-11 font-semibold" disabled={loading || !joinCode.trim()}>
              {t("groups.join")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
