import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "투자 유의사항 — 시라노",
};

export default function DisclaimerPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-ink-900">투자 유의사항</h1>
      <p className="text-xs text-ink-400">최종 업데이트: 2026-07-19</p>

      <p>
        시라노는 개인이 자산 배분 구조를 조립하고, 가정에 따른 미래 자산 경로를 미리 보는{" "}
        <strong>교육·시뮬레이션 도구</strong>입니다. 투자 권유, 일임, 자문업에 해당하지 않습니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">예시·가정</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>화면에 표시되는 수익률·자산·달성률·ETA 등 모든 수치는 예시·가정입니다.</li>
        <li>실제 투자 성과를 보장하지 않으며, 원금 손실이 발생할 수 있습니다.</li>
        <li>보수/기본/공격 프리셋과 민감도 밴드는 가정의 영향을 보여주기 위한 장치입니다.</li>
      </ul>

      <h2 className="pt-2 text-base font-bold text-ink-800">다루지 않는 것</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>개별 종목·펀드·부동산 매물 추천</li>
        <li>세법·절세 상품의 구체적 설계 (개념 안내 수준까지)</li>
        <li>특정 금융상품 가입을 유도하는 확정 조언</li>
      </ul>

      <h2 className="pt-2 text-base font-bold text-ink-800">의사결정</h2>
      <p>
        투자 결정은 이용자 본인의 책임입니다. 필요하면 관련 법령에 따른 자격 있는 전문가와
        상담하세요. 시라노 및 운영자는 본 서비스 이용으로 인한 손실에 대해 법령이 허용하는 범위
        외의 책임을 지지 않습니다.
      </p>
    </>
  );
}
