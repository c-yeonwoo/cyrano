import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";

export default function SpendingPage() {
  return (
    <div className="space-y-5">
      <PageHeader icon="wallet" title="지출관리" />
      <EmptyState
        icon="wallet"
        title="지출관리는 v1.5에서 만나요"
        desc="고정/변동 지출 기록과 점검 기능이 준비 중입니다. 지금은 진단에서 월 지출 대략값으로 저축률을 계산합니다."
      />
    </div>
  );
}
