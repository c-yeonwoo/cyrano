import { GoalsPanel } from "@/components/panels/GoalsPanel";
import { PageHeader } from "@/components/PageHeader";

export default function GoalsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon="target"
        title="목표 · 비전"
        desc="미래의 나(도달점)를 그려요. 이 목표가 엔진의 목표선 · 달성률 · ETA 기준이 됩니다."
      />
      <GoalsPanel />
    </div>
  );
}
