# 시라노 — 디자인 시스템

> 토큰은 세션 중 3회 피벗했다: Indigo → Plum&Gold → **Charcoal & Yellow-gold(현재)**.
> 이모지는 전면 제거하고 인라인 SVG 아이콘 세트로 대체했다.

---

## 1. 브랜드

**이름: 시라노** (Cyrano → 한글 서비스명으로 확정, 레포명 `cyrano`는 유지)
- 은유: *시라노 드 베르주라크* — 무대 뒤에서 상대가 원하는 것을 얻도록 **코칭하는 조력자**.
- 포지셔닝: **"당신의 자산 설계 코치"**. 정답을 강요하지 않고, 내가 내 엔진을 만들도록 **곁에서 돕는다.**
- 이 은유는 제품 핵심(사용자가 직접 조립 + 다음 한 걸음 제시)과 정확히 맞고, 향후 **AI 코치**로 확장할 때 브랜드가 그대로 성립한다.

**톤 & 보이스**
- 신뢰감 있는 핀테크 + 20대 친근함. 단정적 조언·수익 보장 뉘앙스 금지.
- "네 미래를 네가 그린다. 꿈은 크게, 경로는 현실적으로."
- 모든 수치 옆엔 항상 *예시·가정* 이 따라붙는다 (컴플라이언스이자 신뢰 장치).

**로고**
- 마크: 라운드 스퀘어(차콜) 안의 **상승 복리 곡선**(흰선) + **골드 엔드포인트**(목표/돈). `LogoMark`.
- 워드마크: `시라노` + 디스크립터 `자산 설계 코치`. `Logo`.

---

## 2. 컬러 토큰 (`globals.css` `@theme`) — 현재값 (PR #13 기준)

| 역할 | 토큰 | 대표값 | 용도 |
|---|---|---|---|
| Brand | `brand-50…900` | Charcoal(`#16171a`~`#f7f7f8`) | 히어로·곡선·앵커. 순검정이 아니라 한 톤 밝은 다크그레이 |
| Gold | `gold-50…600` | Yellow-gold(`#f4b91e` 중심) | **주요 액션**(primary 버튼)·활성 nav·강조 숫자·목표선. 브랜드에서 가장 눈에 띄어야 하는 색 |
| Ink | `ink-50…900` | Slate | 텍스트·보더·배경(중립) |
| Invest | `invest-50/500/600/700` | Amber(`#f59e0b`) | 투자(성장/복리) 카테고리 — **gold와 헷갈리지 않게 명도/채도로 구분 유지 확인 필수** |
| Save | `save-*` | Emerald | 저축(안전/유동) 카테고리 |
| Spend | `spend-*` | Sky | 지출(소비/out) 카테고리 |
| Locked | `locked` | Teal(`#0d9488`) | 잠긴 자산(연금·IRP) |
| Goal | `goal` | Gold(`#f4b91e`, gold-400과 동일) | 목표선 |
| Semantic | `success/warning/danger` | — | 상태 |

**원칙**:
- 카테고리 색은 기능색. 색만으로 구분하지 않고 항상 텍스트 라벨을 병기(접근성).
- **골드는 액션·강조 전용**, 배경 대량 도포에는 쓰지 않는다(카테고리 amber와의 혼동 방지).
- 브랜드 액센트를 다시 바꿀 일이 있으면 반드시 엔진 화면(투자 버킷 카드 + 골드 버튼이 같이 보이는 곳)에서 `getComputedStyle`로 실제 hex를 비교해 구분되는지 확인할 것 — 이 세션에서 3번의 리컬러 모두 이 방식으로 검증했다.

## 3. 타이포그래피
- Font: system stack (`--font-sans`, Pretendard 우선순위 포함). 외부 CDN 미사용.
- 위계: display(2xl/extrabold) · h1(xl/extrabold) · h2(base/bold) · body(sm) · caption(xs).
- **재무 수치는 `.tnum`** (tabular-nums)로 자릿수 정렬 → 표·카드 가독성.

## 4. 형태
- Radius: `--radius-card`(16) · `--radius-field`(12) · pill(full).
- Elevation: `shadow-sm` 위주(과한 그림자 지양). 카드 = 흰 배경 + `ink-200` 보더.
- 간격: 4px 그리드. 카드 패딩 20, 섹션 간격 20~24.

## 5. 컴포넌트 (재사용 프리미티브 — `components/ui.tsx`)
`Card` · `Button`(primary/outline/ghost/danger) · `Field` · `NumberInput` · `TextInput` ·
`Badge`(brand/amber/emerald/sky/slate) · `StatCard` · `SectionTitle`(번호 옵션) · `NumberChip` ·
`EmptyState`(아이콘) · `AssumptionNote`(컴플라이언스 고지) · `PageHeader` · `Logo`/`LogoMark`.

## 6. 아이콘 (`components/Icon.tsx`)
- **이모지 전면 제거** → 24 그리드 stroke 기반 인라인 SVG, `currentColor`, `aria-hidden`.
- 세트: home·engine·diagnosis·target·wallet·trending-up·building·lock·shield·receipt·cart·
  sun·briefcase·users·loop·check(-circle)·plus·trash·copy·chevron-right·arrow-right·x·
  info·alert·calculator·image·layers·coins·flag·sparkle.
- 팔레트 프리셋·장면 카드·네비게이션은 모두 아이콘 키(`IconName`)로 매핑.

## 7. 데이터 시각화 규칙 (`AssetChart`)
- 총자산 = 다크 실선(+ 그라디언트 area) · 잠긴자산 = `locked`(teal) 점선 · 목표선 = `goal`(gold) 대시 · 비교 시나리오 = `ink-400` 점선 · 민감도 밴드 = 다크 저투명도 음영.
- 값 축·툴팁은 `억/만` 포맷. hover 시 연차별 상세.

## 8. 엔진 캔버스 (`EngineCanvas`)
- 멀티 수입 → 버킷 → 자산 풀을 잇는 순수 SVG 흐름그래프. eCharts 등 외부 라이브러리 미사용(파티클·클릭·드롭 완전 제어가 목적).
- 링크는 출구/입구 지점을 세로로 분산 배치해 서로 겹치지 않게 라우팅. 두께 = 배분 비율.
- 골드 파티클이 흐르는 애니메이션은 SMIL(`animateMotion`), `prefers-reduced-motion: reduce`에서 비활성화.
- 인스펙터는 컬럼이 아니라 **캔버스 위 오버레이 패널**(노드 클릭 시에만 노출) — 캔버스 폭이 줄어들지 않게 하기 위한 결정.

---

## 남은 디자인 부채 (다음 단계)
- 다크 모드 토큰(현재 light 고정).
- 엔진 캔버스: 노드 드래그 이동(현재 자동 배치만 지원).
- 모션 토큰(트랜지션/이징) 정식화.
- 폰트: Pretendard 웹폰트 self-host 도입 검토(현재 system fallback).
