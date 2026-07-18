import { DiagnosisPanel } from "@/components/panels/DiagnosisPanel";
import { PageHeader } from "@/components/PageHeader";

export default function DiagnosisPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon="diagnosis"
        title="현재 진단"
        desc="최소 입력 · 즉시 결과. 8단계 중 내 위치와 다음 한 걸음을 확인하세요."
      />
      <DiagnosisPanel />
    </div>
  );
}
