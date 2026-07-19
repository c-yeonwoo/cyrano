"use client";

import { track } from "@/lib/analytics";
import { Button } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * 리드젠 CTA (BM 1차).
 * NEXT_PUBLIC_LEAD_URL 이 있으면 외부로, 없으면 자리만 유지하고 클릭은 계측만.
 */
export function LeadCta({
  placement,
  className = "",
}: {
  placement: string;
  className?: string;
}) {
  const url = process.env.NEXT_PUBLIC_LEAD_URL?.trim();

  const onClick = () => {
    track("lead_cta_clicked", { placement, has_url: Boolean(url) });
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={`rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-800">배분이 섰다면, 실행을 이어가요</div>
          <p className="mt-0.5 text-xs text-ink-500">
            Signal 도구·강의로 다음 한 걸음을 구체화할 수 있어요. 개별 종목·매물 추천이 아닌
            배분·실행 가이드입니다.
          </p>
        </div>
        <Button onClick={onClick} className="shrink-0">
          {url ? (
            <>
              알아보기 <Icon name="arrow-right" size={14} />
            </>
          ) : (
            <>곧 연결</>
          )}
        </Button>
      </div>
    </div>
  );
}
