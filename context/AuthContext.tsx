"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, StaffRole } from "@/types";

export type DisplayUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: StaffRole | string;
  banned?: boolean | null;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: DisplayUser | null;
  sessionUser: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    email: string,
    password: string,
    meta?: Record<string, unknown>
  ) => Promise<User | null>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithOTP: (phone: string, code: string) => Promise<User | null>;
  sendOTP: (phone: string) => Promise<{ demoCode?: string; demo_code?: string; [key: string]: unknown }>;
  refreshProfile: () => Promise<Profile | null> | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string | undefined | null) => {
      if (!userId) {
        setProfile(null);
        return null;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      const p = (data as Profile | null) || null;
      setProfile(p);
      return p;
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    await fetchProfile(data.user.id);
    return data.user;
  };

  const signUp = async (
    email: string,
    password: string,
    meta: Record<string, unknown> = {}
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) throw error;
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return data.user;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const loginWithOTP = async (phone: string, code: string) => {
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", phone, code }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Invalid OTP");
    if (json.session) {
      await supabase.auth.setSession(json.session);
    }
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    setUser(u);
    if (u) await fetchProfile(u.id);
    return u;
  };

  const sendOTP = async (phone: string) => {
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", phone }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not send OTP");
    return json;
  };

  const displayUser: DisplayUser | null = profile
    ? {
        ...profile,
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        banned: profile.banned,
      }
    : user
      ? {
          id: user.id,
          name: (user.user_metadata?.name as string) || user.email?.split("@")[0],
          email: user.email,
          phone: user.phone || (user.user_metadata?.phone as string | undefined),
          role: (user.user_metadata?.role as string) || "customer",
        }
      : null;

  return (
    <AuthContext.Provider
      value={{
        user: displayUser,
        sessionUser: user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        logout: signOut,
        loginWithOTP,
        sendOTP,
        refreshProfile: () => (user ? fetchProfile(user.id) : null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
