import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — 시라노",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-ink-900">개인정보 처리방침</h1>
      <p className="text-xs text-ink-400">최종 업데이트: 2026-07-19 · MVP 초안</p>

      <h2 className="pt-2 text-base font-bold text-ink-800">1. 수집 항목</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>로컬 모드:</strong> 브라우저 localStorage에 저장되는 목표·진단·엔진·실천 데이터
          (서버로 전송되지 않음)
        </li>
        <li>
          <strong>계정 모드(선택):</strong> 이메일(OTP 인증), 프로필·재무 스냅샷·엔진 배분·실천
          기록
        </li>
        <li>
          <strong>계측(선택):</strong> 익명/계정 식별자, 페이지·이벤트 로그(온보딩·아하·클릭 등).
          PostHog 등 분석 도구 사용 시 해당 정책이 추가로 적용됩니다.
        </li>
      </ul>

      <h2 className="pt-2 text-base font-bold text-ink-800">2. 이용 목적</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>서비스 제공·동기화·로그인</li>
        <li>제품 개선을 위한 집계·퍼널 분석</li>
        <li>부정 이용 방지 및 보안</li>
      </ul>

      <h2 className="pt-2 text-base font-bold text-ink-800">3. 보관·파기</h2>
      <p>
        로컬 데이터는 이용자가 브라우저 저장소를 삭제하면 제거됩니다. 계정 데이터는 계정 삭제
        요청 시 또는 서비스 종료 시 관련 법령이 정한 바에 따라 파기합니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">4. 제3자 제공·처리위탁</h2>
      <p>
        서비스 운영을 위해 호스팅(예: Railway), 인증·DB(예: Supabase), 분석(예: PostHog) 등
        처리위탁이 발생할 수 있습니다. 각 업체는 계약·정책 범위 내에서만 처리합니다. 마케팅 목적의
        무단 판매는 하지 않습니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">5. 이용자 권리</h2>
      <p>
        계정 모드에서는 자신의 데이터 열람·수정·삭제를 요청할 수 있습니다. 로컬 모드는 기기에서
        직접 삭제할 수 있습니다.
      </p>

      <h2 className="pt-2 text-base font-bold text-ink-800">6. 문의</h2>
      <p>개인정보 관련 문의는 운영 채널로 연락해 주세요.</p>
    </>
  );
}
