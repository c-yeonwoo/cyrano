import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 — 시라노",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-ink-900">이용약관</h1>
      <p className="text-xs text-ink-400">최종 업데이트: 2026-07-19 · MVP 초안</p>

      <h2 className="pt-2 text-base font-bold text-ink-800">1. 서비스</h2>
      <p>
        시라노(“서비스”)는 자산 설계 시뮬레이션·진단·실천 기록 기능을 제공합니다. 서비스는
        베타/MVP 단계일 수 있으며, 기능이 변경·중단될 수 있습니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">2. 계정</h2>
      <p>
        로컬 모드에서는 브라우저 저장소만 사용합니다. 계정을 연결한 경우 인증 정보를 안전하게
        관리해야 하며, 타인에게 양도할 수 없습니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">3. 금지 행위</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>서비스의 정상적인 운영을 방해하는 행위</li>
        <li>자동화된 수단으로 과도하게 요청을 보내는 행위</li>
        <li>타인의 계정을 무단으로 사용하는 행위</li>
        <li>서비스를 불법 목적에 이용하는 행위</li>
      </ul>

      <h2 className="pt-2 text-base font-bold text-ink-800">4. 면책</h2>
      <p>
        서비스는 “있는 그대로” 제공됩니다. 시뮬레이션 결과에 대한 의존으로 발생한 손해, 데이터
        손실(로컬 저장소 삭제·기기 변경 등), 제3자 서비스(인증·호스팅) 장애에 대해 법령이 허용하는
        범위에서 책임을 제한합니다. 투자 관련 고지는{" "}
        <a href="/legal/disclaimer" className="font-medium text-brand-700 underline">
          투자 유의사항
        </a>
        을 따릅니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">5. 변경</h2>
      <p>
        약관은 필요 시 개정될 수 있으며, 중요한 변경은 서비스 내 공지 또는 문서 업데이트로
        알립니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">6. 문의</h2>
      <p>서비스 관련 문의는 운영 채널(레포 이슈 또는 안내된 이메일)로 연락해 주세요.</p>
    </>
  );
}
