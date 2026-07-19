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
          지금 이 기기는 <strong>로컬 모드</strong>예요. 로그인·클라우드 저장을 쓰려면
          Supabase를 연결해야 합니다.
        </p>
        <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-ink-500">
          <li>
            터미널에서 <code className="rounded bg-ink-100 px-1">npm run supabase:start</code>
          </li>
          <li>
            <code className="rounded bg-ink-100 px-1">supabase status -o env</code> 의 URL·anon
            key를 <code className="rounded bg-ink-100 px-1">.env.local</code>에 넣기
          </li>
          <li>
            앱 재시작 후 이메일로 6자리 코드를 받아 로그인
          </li>
        </ol>
        <p className="text-[11px] text-ink-400">
          클라우드 프로젝트를 쓸 때도 동일하게{" "}
          <code className="rounded bg-ink-100 px-1">NEXT_PUBLIC_SUPABASE_*</code> 를 설정하면
          됩니다.
        </p>
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
