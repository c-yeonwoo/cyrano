# Cyrano — 디자인 시스템 v0

> 브랜딩이 없던 상태에서 **Cyrano**로 브랜드를 정의하고 토큰 기반 시스템을 잡았다.
> 이모지는 전면 제거하고 인라인 SVG 아이콘 세트로 대체했다.

---

## 1. 브랜드

**이름: Cyrano** (레포명에서 확정)
- 은유: *시라노 드 베르주라크* — 무대 뒤에서 상대가 원하는 것을 얻도록 **코칭하는 조력자**.
- 포지셔닝: **"당신의 자산 설계 코치"**. 정답을 강요하지 않고, 내가 내 엔진을 만들도록 **곁에서 돕는다.**
- 이 은유는 제품 핵심(사용자가 직접 조립 + 다음 한 걸음 제시)과 정확히 맞고, 향후 **AI 코치**로 확장할 때 브랜드가 그대로 성립한다.

**톤 & 보이스**
- 신뢰감 있는 핀테크 + 20대 친근함. 단정적 조언·수익 보장 뉘앙스 금지.
- "네 미래를 네가 그린다. 꿈은 크게, 경로는 현실적으로."
- 모든 수치 옆엔 항상 *예시·가정* 이 따라붙는다 (컴플라이언스이자 신뢰 장치).

**로고**
- 마크: 라운드 스퀘어 안의 **상승 복리 곡선** (엔진·성장). `LogoMark`.
- 워드마크: `Cyrano` + 디스크립터 `자산 설계 코치`. `Logo`.

---

## 2. 컬러 토큰 (`globals.css` `@theme`)

| 역할 | 토큰 | 값 | 용도 |
|---|---|---|---|
| Brand | `brand-50…900` | Indigo | 주도색·CTA·링크·선택 상태 |
| Ink | `ink-50…900` | Slate | 텍스트·보더·배경 (중립) |
| Invest | `invest-50/100/500/600/700` | Amber | 투자(성장/복리) 카테고리 |
| Save | `save-*` | Emerald | 저축(안전/유동) 카테고리 |
| Spend | `spend-*` | Sky | 지출(소비/out) 카테고리 |
| Locked | `locked` | Violet | 잠긴 자산(연금·IRP) |
| Goal | `goal` | Rose | 목표선 |
| Semantic | `success/warning/danger` | — | 상태 |

원칙: **카테고리 색은 기능색**이다. 색만으로 구분하지 않고 항상 텍스트 라벨을 병기(접근성).

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
- 총자산 = `brand-600` 실선(+ 그라디언트 area) · 잠긴자산 = `locked` 점선 · 목표선 = `goal` 대시 · 비교 시나리오 = `ink-400` 점선.
- 값 축·툴팁은 `억/만` 포맷. hover 시 연차별 상세.

---

## 남은 디자인 부채 (다음 단계)
- 다크 모드 토큰(현재 light 고정).
- 모바일 엔진: 인스펙터를 바텀시트로.
- 모션 토큰(트랜지션/이징) 정식화.
- 폰트: Pretendard 웹폰트 self-host 도입 검토(현재 system fallback).
