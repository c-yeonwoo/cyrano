"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { identify } from "./analytics";
import { getSupabase, isSupabaseConfigured } from "./supabase";

interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  /** OTP 코드 발송 (이메일) */
  sendCode: (email: string) => Promise<{ error?: string }>;
  /** OTP 코드 검증 → 로그인 */
  verifyCode: (email: string, code: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    sb.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) identify(u.id, { email_domain: u.email?.split("@")[1] });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const sendCode: AuthState["sendCode"] = async (email) => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase 미설정" };
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error ? { error: error.message } : {};
  };

  const verifyCode: AuthState["verifyCode"] = async (email, code) => {
    const sb = getSupabase();
    if (!sb) return { error: "Supabase 미설정" };
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    const sb = getSupabase();
    await sb?.auth.signOut();
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{ configured: isSupabaseConfigured, loading, user, sendCode, verifyCode, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Provider 밖(또는 미설정)에서도 안전하게 로컬 모드 반환
    return {
      configured: false,
      loading: false,
      user: null,
      sendCode: async () => ({ error: "미설정" }),
      verifyCode: async () => ({ error: "미설정" }),
      signOut: async () => {},
    };
  }
  return ctx;
}
