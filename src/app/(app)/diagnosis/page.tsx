import { redirect } from "next/navigation";

/** 진단 메뉴 제거 — 자산 설계로 안내 (내 현황 모달로 흡수 예정) */
export default function DiagnosisPage() {
  redirect("/engine");
}
