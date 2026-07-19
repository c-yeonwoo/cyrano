"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/store/useProfile";
import { loadProfile, saveProfile, profileHasData } from "@/lib/store/supabaseRepo";

/**
 * Supabase 로그인 시 원격 프로필과 동기화.
 *  - 원격에 데이터 있으면 → 스토어를 원격으로 교체.
 *  - 원격 비었고 로컬에 데이터 있으면 → 로컬을 원격으로 이관(신규 로그인).
 *  - 이후 프로필 변경을 디바운스 저장.
 * 미설정/비로그인 시 아무 것도 하지 않음(로컬 모드).
 */
export function SyncManager() {
  const { configured, user } = useAuth();
  const replaceProfile = useProfile((s) => s.replaceProfile);

  useEffect(() => {
    if (!configured || !user) return;
    const sb = getSupabase();
    if (!sb) return;

    let cancelled = false;
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleSave = () => {
      if (!ready || cancelled) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await saveProfile(sb, user.id, useProfile.getState().profile);
        } catch (e) {
          console.error("[sync] save failed", e);
        }
      }, 1200);
    };

    const unsub = useProfile.subscribe((st, prev) => {
      if (st.profile !== prev.profile) scheduleSave();
    });

    (async () => {
      try {
        const remote = await loadProfile(sb, user.id);
        if (cancelled) return;
        const local = useProfile.getState().profile;
        // 신규 유저는 profiles 행만 있고 vision/snapshot이 비어 있음 → 로컬 이관
        if (remote && profileHasData(remote)) {
          replaceProfile(remote);
        } else if (profileHasData(local)) {
          await saveProfile(sb, user.id, local);
        } else if (remote) {
          replaceProfile(remote);
        }
      } catch (e) {
        console.error("[sync] load failed", e);
      } finally {
        ready = true;
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub();
    };
  }, [configured, user?.id, replaceProfile]);

  return null;
}
