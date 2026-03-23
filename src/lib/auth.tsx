import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  username: string;
  isGuest: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAsGuest: () => Promise<{ error: any }>;
  linkGuestAccount: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateUsername: (username: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  username: "",
  isGuest: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInAsGuest: async () => ({ error: null }),
  linkGuestAccount: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updateUsername: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  const isGuest = !!user && user.is_anonymous === true;

  const fetchUsername = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .single();
    if (data) setUsername(data.username);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => fetchUsername(session.user.id), 100);
      } else {
        setUsername("");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) fetchUsername(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, usernameVal?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-verified`,
        data: { username: usernameVal || "" },
      },
    });
    if (!error && data.user && usernameVal) {
      setTimeout(async () => {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user!.id)
          .single();
        if (existing) {
          await supabase.from("profiles").update({ username: usernameVal }).eq("user_id", data.user!.id);
        } else {
          await supabase.from("profiles").insert({ user_id: data.user!.id, username: usernameVal });
        }
        setUsername(usernameVal);
      }, 500);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error };
  };

  const linkGuestAccount = async (email: string, password: string, usernameVal?: string) => {
    // Link anonymous user to email/password
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: { username: usernameVal || "" },
    });
    if (!error && data.user) {
      // Update or create profile with username
      if (usernameVal) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .single();
        if (existing) {
          await supabase.from("profiles").update({ username: usernameVal }).eq("user_id", data.user.id);
        } else {
          await supabase.from("profiles").insert({ user_id: data.user.id, username: usernameVal });
        }
        setUsername(usernameVal);
      }
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    let error;
    if (existing) {
      ({ error } = await supabase.from("profiles").update({ username: newUsername }).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("profiles").insert({ user_id: user.id, username: newUsername }));
    }
    if (!error) setUsername(newUsername);
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, username, isGuest, signUp, signIn, signInAsGuest, linkGuestAccount, signOut, resetPassword, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
