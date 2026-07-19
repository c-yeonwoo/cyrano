# Loop+ (루플러스) — 디자인 시스템

> 토큰 피벗: … → Quiet Ledger(bronze) → **Cool Mist (쿨 슬레이트 + 스틸 블루)**.
> 화면 용어는 `GLOSSARY.md` (엔진→자산 설계, 버킷→항목 등).
> 레포 폴더명 `cyrano`는 당분간 유지. 브랜드 표기는 아래를 따른다.

---

## 1. 브랜드

| 용도 | 표기 |
|---|---|
| 로고·워드마크 | **Loop+** |
| 영문 식별자 | **Looplus** |
| 한글 | **루플러스** |

- 의미: 자산·현금흐름·일상이 **루프**로 돌고, 돌수록 **플러스**(복리·모멘텀)가 된다.
- 포지셔닝: **"돌수록 더해지는 자산 루프"**. 정답을 강요하지 않고, 내가 내 엔진을 조립하도록 곁에서 돕는다.
- 비주얼 방향: **Cool Mist** — 쿨 슬레이트 + 스틸 블루. (구 Quiet Ledger 브론즈 토큰명 `gold-*`는 하위호환.)

**톤 & 보이스**
- 신뢰감 있는 핀테크 + 20대 친근함. 단정적 조언·수익 보장 뉘앙스 금지.
- "네 미래를 네가 그린다. 꿈은 크게, 경로는 현실적으로."
- 모든 수치 옆엔 항상 *예시·가정* 이 따라붙는다 (컴플라이언스이자 신뢰 장치).

**로고**
- 마크: 슬레이트 라운드 스퀘어 안 **열린 장부** + **상승 루프 궤적** + **+**. `LogoMark`.
- 워드마크: Pretendard extrabold `Loop+` + 디스크립터(한글 설명). 세리프 혼용 없음. `Logo`.
- 상수: `src/lib/brand.ts` (`BRAND.mark` / `.en` / `.ko`).

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
- **전체**: Pretendard Variable (self-host via `pretendard` 패키지, dynamic subset).
- **디스플레이**: 동일 패밀리 + `.font-display`(extrabold · tracking-tight). 세리프 미사용.
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
- 사이드바: 홈 · 목표 · **자산 설계** · 지출 · 실천. (진단 = 엔진「내 현황」모달)
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
