import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  isPersonal: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
  email?: string;
  username?: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  email: string;
  invitedBy: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  groupName?: string;
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    try { return localStorage.getItem("gamenight_active_group"); } catch { return null; }
  });

  const fetchGroups = useCallback(async () => {
    if (!user) { setGroups([]); setLoading(false); return; }

    // Ensure every authenticated user has a personal workspace
    await supabase.rpc("ensure_personal_group");

    const { data } = await supabase
      .from("groups")
      .select("*")
      .order("is_personal", { ascending: false })
      .order("created_at", { ascending: true });

    if (data) {
      const mapped = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        ownerId: g.owner_id,
        inviteCode: g.invite_code,
        createdAt: g.created_at,
        isPersonal: !!g.is_personal,
      }));
      setGroups(mapped);

      const activeStillExists = activeGroupId ? mapped.some(g => g.id === activeGroupId) : false;
      if (!activeGroupId || !activeStillExists) {
        const preferred = mapped.find(g => g.isPersonal) || mapped[0];
        if (preferred) {
          setActiveGroupId(preferred.id);
          localStorage.setItem("gamenight_active_group", preferred.id);
        }
      }
    }

    setLoading(false);
  }, [user, activeGroupId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const selectGroup = useCallback((id: string) => {
    setActiveGroupId(id);
    localStorage.setItem("gamenight_active_group", id);
  }, []);

  const createGroup = useCallback(async (name: string) => {
    if (!user) return null;
    const { data: groupData, error } = await supabase.rpc("create_group_with_owner", { _name: name });
    if (error || !groupData) return null;

    const g = groupData as any;
    const newGroup: Group = {
      id: g.id,
      name: g.name,
      ownerId: g.owner_id,
      inviteCode: g.invite_code,
      createdAt: g.created_at,
      isPersonal: !!g.is_personal,
    };
    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    localStorage.setItem("gamenight_active_group", newGroup.id);
    return newGroup;
  }, [user]);

  const joinGroupByCode = useCallback(async (code: string) => {
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabase.rpc("join_group_by_code", { _code: code });
    if (error) return { error: error.message };
    // Refetch groups
    await fetchGroups();
    if (data) {
      setActiveGroupId(data);
      localStorage.setItem("gamenight_active_group", data);
    }
    return { error: null, groupId: data };
  }, [user, fetchGroups]);

  const updateGroupName = useCallback(async (groupId: string, name: string) => {
    await supabase.from("groups").update({ name }).eq("id", groupId);
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g));
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    const target = groups.find(g => g.id === groupId);
    if (target?.isPersonal) return;

    await supabase.from("groups").delete().eq("id", groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));

    if (activeGroupId === groupId) {
      const remaining = groups.filter(g => g.id !== groupId);
      const next = remaining.find(g => g.isPersonal)?.id || remaining[0]?.id || null;
      setActiveGroupId(next);
      if (next) localStorage.setItem("gamenight_active_group", next);
      else localStorage.removeItem("gamenight_active_group");
    }
  }, [activeGroupId, groups]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!user) return;
    const target = groups.find(g => g.id === groupId);
    if (target?.isPersonal) return;

    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) {
      const remaining = groups.filter(g => g.id !== groupId);
      const next = remaining.find(g => g.isPersonal)?.id || remaining[0]?.id || null;
      setActiveGroupId(next);
      if (next) localStorage.setItem("gamenight_active_group", next);
      else localStorage.removeItem("gamenight_active_group");
    }
  }, [user, activeGroupId, groups]);

  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

  return {
    groups, loading, activeGroup, activeGroupId,
    selectGroup, createGroup, joinGroupByCode,
    updateGroupName, deleteGroup, leaveGroup,
    refetch: fetchGroups,
  };
}

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!groupId) { setMembers([]); setLoading(false); return; }
    const { data } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });
    if (data) {
      // Fetch profiles for usernames
      const userIds = data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.username]));

      setMembers(data.map((m: any) => ({
        id: m.id,
        groupId: m.group_id,
        userId: m.user_id,
        role: m.role as "admin" | "member",
        joinedAt: m.joined_at,
        username: profileMap.get(m.user_id) || "",
      })));
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const removeMember = useCallback(async (memberId: string) => {
    await supabase.from("group_members").delete().eq("id", memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const inviteByEmail = useCallback(async (email: string, invitedBy: string) => {
    if (!groupId) return { error: "No group" };
    const { error } = await supabase.from("group_invites").insert({
      group_id: groupId,
      email,
      invited_by: invitedBy,
    });
    return { error: error?.message || null };
  }, [groupId]);

  return { members, loading, removeMember, inviteByEmail, refetch: fetchMembers };
}

export function usePendingInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!user?.email) { setInvites([]); setLoading(false); return; }
    const { data } = await supabase
      .from("group_invites")
      .select("*, groups:group_id(name)")
      .eq("email", user.email)
      .eq("status", "pending");
    if (data) {
      setInvites(data.map((inv: any) => ({
        id: inv.id,
        groupId: inv.group_id,
        email: inv.email,
        invitedBy: inv.invited_by,
        status: inv.status,
        createdAt: inv.created_at,
        groupName: inv.groups?.name || "",
      })));
    }
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const acceptInvite = useCallback(async (invite: GroupInvite) => {
    if (!user) return;
    // Add as member
    await supabase.from("group_members").insert({
      group_id: invite.groupId,
      user_id: user.id,
      role: "member",
    });
    // Mark invite as accepted via secure function
    await supabase.rpc("update_invite_status", { _invite_id: invite.id, _status: "accepted" });
    setInvites(prev => prev.filter(i => i.id !== invite.id));
  }, [user]);

  const declineInvite = useCallback(async (inviteId: string) => {
    await supabase.rpc("update_invite_status", { _invite_id: inviteId, _status: "rejected" });
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  }, []);

  return { invites, loading, acceptInvite, declineInvite, refetch: fetchInvites };
}
