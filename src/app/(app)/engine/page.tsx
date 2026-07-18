import { EngineBuilder } from "@/components/engine/EngineBuilder";
import { PageHeader } from "@/components/PageHeader";

export default function EnginePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        icon="engine"
        title="재테크 엔진"
        desc="팔레트에서 버킷을 끌어다 내 포트폴리오를 조립하세요. 복리 결과가 실시간으로 갱신됩니다."
      />
      <EngineBuilder />
    </div>
  );
}
