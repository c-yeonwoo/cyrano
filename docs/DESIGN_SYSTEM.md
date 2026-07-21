# Loop+ (루플러스) — 디자인 시스템

> 브랜드: **Compound Signal** — 잉크 지면 + 신호 틸 CTA.  
> (구 Cool Mist / Quiet Ledger 폐기. 토큰명 `gold-*`는 하위호환으로 Signal teal 값을 담는다.)

---

## 1. 브랜드

| 용도 | 표기 |
|---|---|
| 로고·워드마크 | **Loop+** |
| 영문 식별자 | **Looplus** |
| 한글 | **루플러스** |

- 의미: 자산·현금흐름이 **루프**로 돌고, 돌수록 **플러스**(복리·모멘텀).
- 포지셔닝: 정답을 강요하지 않고, 내가 내 엔진을 조립하도록 곁에서 돕는다.
- 비주얼: **Compound Signal** — `#0B1220` 잉크 + `#0F8B6B` 신호 틸.

**톤 & 보이스**
- 신뢰 핀테크 + 20대 친근. 수익 보장·종목/매물/레버리지 권유 금지.
- 수치 옆 항상 *예시·가정*.

---

## 2. 컬러 토큰 (`globals.css`)

| 역할 | 토큰 | hex | 용도 |
|---|---|---|---|
| Ink | `brand-900` / `ink-900` | `#0B1220` | 히어로·텍스트 |
| Ink (보조) | `brand-800` | `#141C2B` | 히어로 그라디언트·hover |
| Paper | `ink-50` | `#F3F5F7` | 페이지 배경 |
| Line | `ink-200` | `#E2E8F0` | 보더 |
| Signal wash | `gold-50` | `#DDF3EC` | active nav·서브틀 배경 |
| Signal tint | `gold-100…300` | `#B8E5D4 → #3DB891` | 배지·아이콘 배경 |
| Signal CTA | `gold-400/500` | `#0F8B6B` | Primary 버튼·강조 |
| Signal hover | `gold-600` | `#0C7359` | hover |
| Sage | `sage-*` | `#4D8B82` 계열 | 다음 한 걸음(코치 순간) |
| Invest | `invest-500` | `#F59E0B` | 투자 카테고리만 |
| Save | `save-500` | `#10B981` | 저축 |
| Spend | `spend-500` | `#E11D48` | 지출 |
| Goal line | `goal` | `#0F8B6B` | 차트 목표선 |

**원칙**: 카테고리 색(invest/save/spend)은 기능색으로 유지 — Signal teal(CTA)과 chroma로 구분되도록 배경 대량 도포는 지양.

---

## 3. 타이포그래피
- **Display**: SUIT Variable 800 · `letter-spacing: -0.03em` (`.font-display`). CDN(`cdn.jsdelivr.net/gh/sunn-us/SUIT`)에서 `@font-face`로 로드, 실패 시 Pretendard로 폴백.
- **Body/UI**: Pretendard Variable (self-host)
- 재무 수치: `.tnum`

---

## 4. 형태
- Radius card/field: **12px** (`0.75rem`)
- 카드: 흰 배경 + `ink-200` 보더 · 과한 그림자 지양
- Primary 버튼: Signal fill → hover `gold-600`

---

## 5. IA
- 사이드바/탭 1차: **홈 · 자산 설계 · 실천**
- 2차(구분선 아래, 톤 다운): 목표 · 지출
- 모바일 하단탭(5개): 홈 · 설계(core) · 실천 · 목표 · 지출
- 진단 = 엔진「내 현황」모달
- 홈: 단계 히어로 → N년 미리보기(히어로 — 숫자 목표 있을 때만 큰 수치) → 비전보드(secondary) → 다음 걸음 → 지표
- 로그인: 풀블리드 — 좌측 잉크(`brand-900`) 브랜드 면 + 우측 폼 (모바일: 상단 잉크 스트립 + 하단 폼)

---

## 6. 컴포넌트
`Card` · `Button` · `Field` · `NumberInput` · `TextInput` · `Badge` · `StatCard` ·
`SectionTitle` · `EmptyState` · `AssumptionNote` · `Logo`/`LogoMark` · `LeadCta` · `AuthForm`
