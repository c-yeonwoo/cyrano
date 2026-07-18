/**
 * 시라노 로고 (Black & Gold).
 * 마크 = 블랙 라운드 스퀘어 안의 상승 복리 곡선 + 골드 엔드포인트(목표/돈).
 * 워드마크 = "시라노" + 디스크립터.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-brand-800)" />
      <path
        d="M7 22C10 22 12 18 15 14C17.5 10.7 20 9 25 9"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="25" cy="9" r="3" fill="var(--color-gold-400)" />
    </svg>
  );
}

export function Logo({
  size = 28,
  withDescriptor = true,
}: {
  size?: number;
  withDescriptor?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="text-[16px] font-extrabold tracking-tight text-ink-900">시라노</span>
        {withDescriptor && (
          <span className="mt-1 text-[10px] font-medium tracking-wide text-ink-400">
            자산 설계 코치
          </span>
        )}
      </span>
    </span>
  );
}
