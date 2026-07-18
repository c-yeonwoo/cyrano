/**
 * Cyrano 로고 (Plum & Gold).
 * 마크 = 플럼 라운드 스퀘어 안의 상승 복리 곡선 + 골드 엔드포인트(목표/돈 강조, 절제).
 * 워드마크 = 세리프 "Cyrano" (코치·프리미엄) + 한글 디스크립터(산세리프).
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-brand-700)" />
      <path
        d="M7 22C10 22 12 18 15 14C17.5 10.7 20 9 25 9"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="25" cy="9" r="2.8" fill="var(--color-gold-400)" />
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
        <span className="font-serif text-[17px] font-bold tracking-tight text-ink-900">
          Cyrano
        </span>
        {withDescriptor && (
          <span className="mt-1 text-[10px] font-medium tracking-wide text-ink-400">
            자산 설계 코치
          </span>
        )}
      </span>
    </span>
  );
}
