import { TrackingPanel } from "@/components/panels/TrackingPanel";
import { PageHeader } from "@/components/PageHeader";

export default function TrackingPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon="check-circle"
        title="실천"
        desc="원데이 루틴을 만들고, 잔디·주간 뷰로 얼마나 지켰는지 확인하세요."
      />
      <TrackingPanel />
    </div>
  );
}
