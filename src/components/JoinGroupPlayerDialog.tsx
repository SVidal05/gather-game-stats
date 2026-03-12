import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, UserPlus, Eye, Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { PLAYER_COLORS, PLAYER_AVATARS } from "@/lib/types";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface GroupPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  linkedUserId: string | null;
  linkedUsername: string | null;
}

interface JoinGroupPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  onComplete: () => void;
}

type Mode = "select" | "create" | "spectator" | null;

export function JoinGroupPlayerDialog({
  open, onOpenChange, groupId, groupName, onComplete,
}: JoinGroupPlayerDialogProps) {
  const { user, username } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [players, setPlayers] = useState<GroupPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Create new player form
  const [newName, setNewName] = useState(username || "");
  const [newAvatar, setNewAvatar] = useState(PLAYER_AVATARS[0]);
  const [newColor, setNewColor] = useState(PLAYER_COLORS[0].value);

  useEffect(() => {
    if (!open || !groupId) return;
    setMode(null);
    setSelectedPlayerId(null);
    fetchPlayers();
  }, [open, groupId]);

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (data) {
      const linkedIds = data.filter(p => p.linked_user_id).map(p => p.linked_user_id!);
      let profileMap = new Map<string, string>();
      if (linkedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", linkedIds);
        profileMap = new Map((profiles || []).map(pr => [pr.user_id, pr.username]));
      }

      setPlayers(data.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        linkedUserId: p.linked_user_id || null,
        linkedUsername: p.linked_user_id ? (profileMap.get(p.linked_user_id) || "User") : null,
      })));
    }
  };

  const handleLinkExisting = async () => {
    if (!selectedPlayerId || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from("players")
      .update({ linked_user_id: user.id })
      .eq("id", selectedPlayerId)
      .is("linked_user_id", null);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✓", description: "Player linked successfully" });
      onComplete();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleCreateNew = async () => {
    if (!newName.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from("players")
      .insert({
        group_id: groupId,
        user_id: user.id,
        linked_user_id: user.id,
        name: newName.trim(),
        avatar: newAvatar,
        color: newColor,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✓", description: "Player created and linked" });
      onComplete();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleSpectator = () => {
    toast({ title: "👀", description: "Joined as spectator — you can link a player later" });
    onComplete();
    onOpenChange(false);
  };

  const availablePlayers = players.filter(p => !p.linkedUserId);
  const alreadyLinked = players.some(p => p.linkedUserId === user?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-lg">
            Join "{groupName}"
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            How do you want to participate?
          </p>
        </DialogHeader>

        {alreadyLinked ? (
          <div className="text-center py-6 space-y-2">
            <Check className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-semibold text-foreground">You already have a player in this group</p>
            <Button onClick={() => { onComplete(); onOpenChange(false); }} className="rounded-lg mt-2">
              Continue
            </Button>
          </div>
        ) : !mode ? (
          <div className="space-y-3 pt-2">
            {/* Option 1: Select existing */}
            <button
              onClick={() => setMode("select")}
              className="w-full game-card !p-4 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Select an existing player</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Link your account to a player already in the group
                  {availablePlayers.length > 0
                    ? ` (${availablePlayers.length} available)`
                    : " (none available)"}
                </p>
              </div>
            </button>

            {/* Option 2: Create new */}
            <button
              onClick={() => setMode("create")}
              className="w-full game-card !p-4 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Create a new player</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a new player identity in this group
                </p>
              </div>
            </button>

            {/* Option 3: Spectator */}
            <button
              onClick={() => setMode("spectator")}
              className="w-full game-card !p-4 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Join as spectator</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View stats without linking to a player
                </p>
              </div>
            </button>
          </div>
        ) : mode === "select" ? (
          <div className="space-y-4 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="rounded-lg text-xs">
              ← Back
            </Button>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {players.map(p => {
                const isLocked = !!p.linkedUserId;
                const isSelected = selectedPlayerId === p.id;
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => !isLocked && setSelectedPlayerId(p.id)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isLocked
                        ? "opacity-50 cursor-not-allowed border-border bg-muted/50"
                        : isSelected
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 overflow-hidden"
                      style={{ backgroundColor: p.color + "15", border: `2px solid ${p.color}` }}
                    >
                      {p.avatar.startsWith("/") ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                      {isLocked && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Linked to {p.linkedUsername}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </motion.button>
                );
              })}
              {players.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No players in this group yet</p>
              )}
            </div>
            <Button
              onClick={handleLinkExisting}
              className="w-full rounded-lg h-11 font-semibold"
              disabled={!selectedPlayerId || loading}
            >
              {loading ? "Linking..." : "Link to this player"}
            </Button>
          </div>
        ) : mode === "create" ? (
          <div className="space-y-4 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="rounded-lg text-xs">
              ← Back
            </Button>
            <div>
              <Label className="font-medium text-xs">Player name</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Your player name"
                className="rounded-lg mt-1 h-11"
              />
            </div>
            <div>
              <Label className="font-medium text-xs">Avatar</Label>
              <div className="mt-1">
                <AvatarPicker value={newAvatar} onChange={setNewAvatar} />
              </div>
            </div>
            <div>
              <Label className="font-medium text-xs">Color</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PLAYER_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={`w-9 h-9 rounded-lg transition-all ${newColor === c.value ? "ring-2 ring-offset-2 ring-foreground scale-105" : ""}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateNew}
              className="w-full rounded-lg h-11 font-semibold"
              disabled={!newName.trim() || loading}
            >
              {loading ? "Creating..." : "Create & join"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2 text-center">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              You'll be able to view all group stats without being linked to a player.
              You can link to a player later from the Players tab.
            </p>
            <Button onClick={handleSpectator} className="w-full rounded-lg h-11 font-semibold">
              Join as spectator
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
