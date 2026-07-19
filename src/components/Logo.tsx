/**
 * 시라노 마크 — Cool Mist.
 * 열린 장부(ledger) 위에 상승 궤적과 스틸블루 포인트.
 * 워드마크는 Pretendard 통일 (세리프 혼용 없음).
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-brand-900)" />
      {/* 장부 면 */}
      <path
        d="M9 8.5h11.5a2 2 0 0 1 2 2V22a1.5 1.5 0 0 1-1.5 1.5H9.5A1.5 1.5 0 0 1 8 22V10a1.5 1.5 0 0 1 1-1.5Z"
        fill="white"
        fillOpacity="0.12"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 12.5h8M11.5 16h5.5"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* 상승 궤적 */}
      <path
        d="M11 21.5c2.2-.2 3.6-2.4 5.2-5.2C17.8 13.8 19.2 12 22.5 11"
        stroke="var(--color-gold-400)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="22.5" cy="11" r="2.4" fill="var(--color-gold-400)" />
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
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-extrabold tracking-tight text-ink-900">시라노</span>
        {withDescriptor && (
          <span className="mt-1 text-[10px] font-semibold tracking-wide text-ink-400">
            자산 설계 코치
          </span>
        )}
      </span>
    </span>
  );
}
