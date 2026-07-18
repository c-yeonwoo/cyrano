import type { YearPoint } from "./types";
import { formatKRW } from "./format";

/**
 * 결과 공유 카드 — canvas로 브랜드 이미지를 렌더한다(외부 의존성 0).
 * 획득 루프: "n년 뒤 X억" 결과를 이미지로 공유.
 */

export interface ShareCardData {
  curve: YearPoint[];
  goalNetworth?: number;
  targetYears: number;
  atTargetNetWorth: number;
  lowNetWorth: number;
  highNetWorth: number;
  targetReachYear: number | null;
  achievementPct: number;
}

const S = 1080; // 정사각 카드

export async function renderShareCard(d: ShareCardData): Promise<Blob> {
  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = S * dpr;
  canvas.height = S * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const brand = "#17181c";
  const gold = "#c9a24a";
  const ink900 = "#0f172a";
  const ink400 = "#94a3b8";
  const goal = "#b8860b";

  // 배경
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);
  // 상단 브랜드 바
  ctx.fillStyle = brand;
  roundRect(ctx, 64, 64, 48, 48, 12);
  ctx.fill();
  // 마크 곡선
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(76, 100);
  ctx.bezierCurveTo(86, 100, 92, 86, 100, 76);
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(100, 76, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ink900;
  ctx.font = "800 34px ui-sans-serif, system-ui, 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText("시라노", 128, 92);
  ctx.fillStyle = ink400;
  ctx.font = "500 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("자산 설계 코치", 128, 116);

  // 헤드라인
  ctx.fillStyle = ink400;
  ctx.font = "600 30px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`${d.targetYears}년 뒤 예상 순자산`, 64, 210);

  // 큰 숫자
  ctx.fillStyle = brand;
  ctx.font = "800 132px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(formatKRW(d.atTargetNetWorth), 60, 330);

  // 범위
  ctx.fillStyle = ink400;
  ctx.font = "500 26px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(
    `범위 ${formatKRW(d.lowNetWorth)} ~ ${formatKRW(d.highNetWorth)} · 가정 기준`,
    64,
    378,
  );

  // 차트 영역
  const cx = 64,
    cy = 440,
    cw = S - 128,
    ch = 380;
  drawChart(ctx, d, cx, cy, cw, ch, brand, goal, ink400);

  // 하단 요약 칩
  const chips: string[] = [];
  if (d.goalNetworth) chips.push(`목표 ${formatKRW(d.goalNetworth)}`);
  chips.push(
    d.targetReachYear != null ? `도달 약 ${d.targetReachYear}년` : "시점 내 미도달",
  );
  if (d.goalNetworth) chips.push(`달성률 ${d.achievementPct.toFixed(1)}%`);

  let chipX = 64;
  const chipY = 880;
  ctx.font = "700 24px ui-sans-serif, system-ui, sans-serif";
  for (const c of chips) {
    const w = ctx.measureText(c).width + 40;
    ctx.fillStyle = "#f2e6c2";
    roundRect(ctx, chipX, chipY, w, 52, 26);
    ctx.fill();
    ctx.fillStyle = "#8a6a20";
    ctx.fillText(c, chipX + 20, chipY + 34);
    chipX += w + 14;
  }

  // 고지
  ctx.fillStyle = ink400;
  ctx.font = "500 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(
    "예시·가정이며 수익을 보장하지 않습니다 · 배분 구조만 다룹니다",
    64,
    S - 48,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob 실패"))), "image/png");
  });
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  d: ShareCardData,
  x: number,
  y: number,
  w: number,
  h: number,
  brand: string,
  goal: string,
  ink: string,
) {
  const curve = d.curve;
  if (curve.length < 2) return;
  const years = curve.length - 1;
  const maxV = Math.max(...curve.map((p) => p.totalNetWorth), d.goalNetworth ?? 0, 1) * 1.1;
  const px = (yr: number) => x + (yr / years) * w;
  const py = (v: number) => y + (1 - v / maxV) * h;

  // area
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "rgba(79,70,229,0.22)");
  grad.addColorStop(1, "rgba(79,70,229,0)");
  ctx.beginPath();
  ctx.moveTo(px(0), py(0));
  curve.forEach((p) => ctx.lineTo(px(p.year), py(p.totalNetWorth)));
  ctx.lineTo(px(years), py(0));
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 목표선
  if (d.goalNetworth && d.goalNetworth <= maxV) {
    ctx.strokeStyle = goal;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(x, py(d.goalNetworth));
    ctx.lineTo(x + w, py(d.goalNetworth));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = goal;
    ctx.font = "600 20px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`목표 ${formatKRW(d.goalNetworth)}`, x + w - 160, py(d.goalNetworth) - 10);
  }

  // 곡선
  ctx.strokeStyle = brand;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  curve.forEach((p, i) =>
    i === 0 ? ctx.moveTo(px(p.year), py(p.totalNetWorth)) : ctx.lineTo(px(p.year), py(p.totalNetWorth)),
  );
  ctx.stroke();

  // x 라벨
  ctx.fillStyle = ink;
  ctx.font = "500 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("0년", x, y + h + 26);
  ctx.fillText(`${years}년`, x + w - 40, y + h + 26);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 공유(모바일 Web Share) 또는 다운로드 폴백 */
export async function shareOrDownload(blob: Blob, filename = "cyrano-result.png") {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
  };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: "시라노 결과" });
      return;
    } catch {
      // 취소 시 폴백 없이 종료
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
