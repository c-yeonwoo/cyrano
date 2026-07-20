"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, TextInput } from "./ui";

/** 이메일 OTP 로그인 폼 (모달·/login 공용) */
export function AuthForm({
  onSuccess,
  compact = false,
}: {
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const { configured, sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <p className="text-sm text-ink-600">
          Supabase 환경변수가 없어 로그인을 쓸 수 없어요.
        </p>
        <div className="space-y-3 text-xs leading-relaxed text-ink-500">
          <div>
            <p className="mb-1 font-semibold text-ink-600">Railway 배포</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Variables에{" "}
                <code className="rounded bg-ink-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ·{" "}
                <code className="rounded bg-ink-100 px-1">
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                </code>{" "}
                추가
              </li>
              <li>저장 후 <strong>Redeploy</strong> (빌드 시 값이 번들에 들어갑니다)</li>
            </ol>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ink-600">로컬 개발</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                <code className="rounded bg-ink-100 px-1">.env.local</code>에 동일 키 설정
              </li>
              <li>앱 재시작 후 이메일 6자리 코드로 로그인</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const submitEmail = async () => {
    if (!email.includes("@")) return setErr("이메일을 확인해주세요.");
    setBusy(true);
    setErr(null);
    const { error } = await sendCode(email.trim());
    setBusy(false);
    if (error) setErr(error);
    else setStep("code");
  };

  const submitCode = async () => {
    setBusy(true);
    setErr(null);
    const { error } = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (error) setErr(error);
    else onSuccess?.();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500">
        {step === "email"
          ? "이메일로 인증 코드를 보내드려요. 기기 간 동기화·백업에 사용됩니다."
          : `${email} 로 보낸 6자리 코드를 입력하세요.`}
      </p>

      {step === "email" ? (
        <TextInput value={email} onChange={setEmail} placeholder="you@example.com" />
      ) : (
        <TextInput value={code} onChange={setCode} placeholder="6자리 코드" />
      )}

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex justify-end gap-2">
        {step === "code" && (
          <Button
            variant="ghost"
            onClick={() => {
              setStep("email");
              setCode("");
              setErr(null);
            }}
          >
            이메일 변경
          </Button>
        )}
        {step === "email" ? (
          <Button onClick={submitEmail} disabled={busy}>
            {busy ? "전송 중…" : "코드 받기"}
          </Button>
        ) : (
          <Button onClick={submitCode} disabled={busy || code.trim().length < 6}>
            {busy ? "확인 중…" : "로그인"}
          </Button>
        )}
      </div>
    </div>
  );
}
