# 시라노 — 디자인 시스템

> 토큰 피벗: Indigo → Plum&Gold → Charcoal&Yellow-gold → **Quiet Ledger (Charcoal & Champagne bronze)**.
> 이모지는 전면 제거하고 인라인 SVG 아이콘 세트로 대체했다.

---

## 1. 브랜드

**이름: 시라노** (Cyrano → 한글 서비스명으로 확정, 레포명 `cyrano`는 유지)
- 은유: *시라노 드 베르주라크* — 무대 뒤에서 상대가 원하는 것을 얻도록 **코칭하는 조력자**.
- 포지셔닝: **"당신의 자산 설계 코치"**. 정답을 강요하지 않고, 내가 내 엔진을 만들도록 **곁에서 돕는다.**
- 비주얼 방향: **Quiet Ledger** — 코치의 조용한 장부. 블랙+옐로우골드(코인앱 클리셰) 대신 뮤트 샴페인 브론즈.

**톤 & 보이스**
- 신뢰감 있는 핀테크 + 20대 친근함. 단정적 조언·수익 보장 뉘앙스 금지.
- "네 미래를 네가 그린다. 꿈은 크게, 경로는 현실적으로."
- 모든 수치 옆엔 항상 *예시·가정* 이 따라붙는다 (컴플라이언스이자 신뢰 장치).

**로고**
- 마크: 라운드 스퀘어(charcoal) 안의 **상승 복리 곡선**(흰선) + **bronze 엔드포인트**. `LogoMark`.
- 워드마크: 디스플레이 세리프(`Nanum Myeongjo`) `시라노` + 산세리프 디스크립터. `Logo`.

---

## 2. 컬러 토큰 (`globals.css` `@theme`) — Quiet Ledger

| 역할 | 토큰 | 대표값 | 용도 |
|---|---|---|---|
| Brand | `brand-50…900` | Charcoal(`#14151a`~`#f7f7f8`) | 히어로·앵커. `#14151a` |
| Accent | `gold-50…600` | Champagne bronze(`#c4a574` 중심) | **주요 액션**·활성 nav·강조 숫자. 토큰명 `gold-*`는 하위호환 |
| Sage | `sage-50/100/500/600/700` | `#5b7c6e` | **코치 순간**(다음 한 걸음 등) — 드물게 |
| Ink | `ink-50…900` | Cool paper / slate | 텍스트·보더·배경 |
| Invest | `invest-*` | Amber(`#f59e0b`) | 투자 카테고리 — **bronze CTA와 chroma로 구분** |
| Save | `save-*` | Emerald | 저축 카테고리 |
| Spend | `spend-*` | Sky | 지출 카테고리 |
| Locked | `locked` | Teal(`#0d9488`) | 잠긴 자산 |
| Goal | `goal` | `#b8956c` | 목표선 (CTA보다 한 톤 깊게) |
| Semantic | `success/warning/danger` | — | 상태 |

**원칙**:
- 카테고리 색은 기능색. 색만으로 구분하지 않고 항상 텍스트 라벨을 병기.
- **브론즈는 액션·강조 전용**, 배경 대량 도포 금지.
- invest amber와 brand bronze가 엔진 화면에 같이 보일 때 hex를 비교해 구분되는지 확인할 것.
- 코치 순간(sage)은 invest 기능색을 대체하지 않는다 — 홈 “다음 한 걸음”처럼 브랜드 코칭 맥락에만.

---

## 3. 타이포그래피
- **UI**: Pretendard Variable (self-host via `pretendard` 패키지, dynamic subset).
- **워드마크**: Nanum Myeongjo 700 (`next/font/google` → `--font-display`, `.font-display`).
- 위계: display(2xl/extrabold) · h1(xl/extrabold) · h2(base/bold) · body(sm) · caption(xs).
- **재무 수치는 `.tnum`** (tabular-nums).

---

## 4. 형태
- Radius: `--radius-card`(16) · `--radius-field`(12) · pill(full).
- Elevation: 과한 그림자 지양. 카드 = 흰 배경 + `ink-200` 보더.
- 간격: 4px 그리드. 카드 패딩 20, 섹션 간격 20~24.
- Primary 버튼: bronze fill → hover 시 charcoal(`brand-800`) + 흰 텍스트.

---

## 5. IA
- 사이드바 그룹: **허브** → **공방**(엔진·핵심) → **준비**(목표·진단) → **루프**(실천·지출).
- 모바일 하단탭: 엔진을 중앙에 배치.
- 홈: 브랜드 신호 + 단계/달성/ETA + 다음 한 걸음 + 엔진 미니뷰. placeholder 바로가기(지출)는 넣지 않음.

---

## 6. 컴포넌트 (`components/ui.tsx`)
`Card` · `Button`(primary/outline/ghost/danger) · `Field` · `NumberInput` · `TextInput` ·
`Badge` · `StatCard` · `SectionTitle` · `NumberChip` · `EmptyState` · `AssumptionNote` ·
`PageHeader` · `Logo`/`LogoMark`.

---

## 7. 아이콘 (`components/Icon.tsx`)
- 24 그리드 stroke SVG, `currentColor`, `aria-hidden`. 이모지 금지.

---

## 8. 데이터 시각화 (`AssetChart`)
- 총자산 = 다크 실선 · 잠긴자산 = `locked` 점선 · 목표선 = `goal` · 비교 = `ink-400` 점선 · 민감도 밴드 = 저투명도 음영.

---

## 9. 엔진 캔버스 (`EngineCanvas`)
- 순수 SVG 흐름그래프. 파티클 = `gold-400`(bronze). `prefers-reduced-motion` 대응.
- 인스펙터 = 캔버스 위 오버레이 / 모바일 바텀시트.

---

## 남은 디자인 부채
- 다크 모드 토큰.
- 엔진 Assemble → Preview progressive disclosure.
- 모션 토큰 정식화.
- 노드 드래그 이동.
