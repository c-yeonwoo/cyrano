# 시라노 — 자산 설계 코치 (MVP)

개인이 **자기 '재테크 엔진(포트폴리오 배분)'을 직접 조립**하고 → **n년 뒤 자산을 미리 보며**
자신감·동기를 얻는 인생설계 플랫폼. 핸드오프 문서(19) + 설계 파일(09~18) 기반 구현.

> 브랜드 **시라노** = 무대 뒤에서 코칭하는 조력자. "정답을 강요하지 않고, 내가 내 엔진을 만들도록 곁에서 돕는다."
> 컬러: Charcoal & Yellow-gold.

> **주의:** 모든 수치는 **예시·가정**이며 수익을 보장하지 않습니다. 개별 종목·매물 추천이 아닌
> **'배분 구조'** 만 다루며, 세법 딥다이브는 하지 않습니다.

## 문서
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — **결과 위주 핸드오프**: 뭐가 만들어졌는지·왜 이렇게 했는지·다음 세션 킥오프 프롬프트
- [`docs/PRODUCT_REVIEW.md`](docs/PRODUCT_REVIEW.md) — Product·Design·Tech·UXR·AI 5개 관점 종합 리뷰 + ROI 우선순위
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 단계별 로드맵 (v1.0 GA → v2 AI 코치)
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — 시라노 브랜드·토큰·아이콘 시스템

---

## MVP 범위

**온보딩(A 목표·비전) → B 진단 → C 재테크 엔진 → 홈 대시보드.**
핵심 루프 = 비전 세우기 → 현재 입력 → 엔진 구성 → 미래 결과 확인.

제외(이후): 지출관리(E, v1.5) · 실천·트래킹(F) · AI 재무 피드백(G) · 커뮤니티(백로그) ·
오픈뱅킹/마이데이터 자동연동(2차) · 비전 AI 이미지 생성(fast-follow).

핵심 = **C 엔진**: 팔레트에서 버킷을 드래그해 내 포트폴리오 조립 → 멀티 수입(income 합류) →
비율 배분 → **하이브리드 복리 재투입**(미실현=풀 내 복리 / 실현 자본소득=upstream 재유입) →
n년 자산 그래프 + 목표선 + 달성률/ETA.

---

## 기술 스택

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS v4**
- **Zustand** (상태 + localStorage persist)
- **Supabase** (선택적 영속 계층 · 스키마 제공, 아래 참고)
- 차트: 의존성 없는 **커스텀 SVG** (`AssetChart`)
- 테스트: **Vitest**
- 배포: **Railway**

---

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
npm run test         # 엔진(복리·단계판정) 유닛 테스트
npm run build        # 프로덕션 빌드
```

앱은 **Supabase 없이도 즉시 실행**됩니다(기본 영속 = 브라우저 localStorage). 첫 진입 시
온보딩(`/onboarding`)으로 이동하고, 완료 후에는 홈(`/home`)이 허브가 됩니다.

---

## 아키텍처

```
src/
  app/
    (app)/            # 사이드바/하단탭 쉘이 감싸는 메인 앱
      home/           # 홈 대시보드 (달성률·ETA의 집)
      engine/         # C 재테크 엔진 (핵심)
      diagnosis/      # B 진단
      goals/          # A 목표·비전
      spending/       # E 지출관리 (v1.5 플레이스홀더)
    onboarding/       # A→B→C 위저드 (쉘 없음)
    page.tsx          # 진입점: 온보딩 여부로 라우팅
  components/
    engine/           # EngineBuilder · Palette · Inspector · EngineFlow
    panels/           # DiagnosisPanel · GoalsPanel (페이지·온보딩 공용)
    AssetChart.tsx    # SVG 복리 그래프(목표선·비교·잠긴자산)
    AppShell.tsx      # 네비게이션(웹 사이드바 / 모바일 하단탭)
    ui.tsx            # 디자인 시스템 프리미티브
  lib/
    types.ts          # 도메인 모델 (§7)
    engine/           # ⭐ 계산 로직 (§8) — projection.ts · stage.ts + 테스트
    catalog.ts        # 팔레트 프리셋(BucketCatalog)
    store/            # Zustand 스토어 · 기본값 · 추천 배분
    format.ts         # 억/만 포맷 유틸
    supabase.ts       # Supabase 클라이언트(선택)
supabase/migrations/  # 0001_init.sql — 정규화 스키마 + RLS
```

### 데이터 흐름 (한 번만 입력, 공유)
- **B 진단 입력(자산·소득 소스별) = C 엔진의 원천 데이터** (중복 입력 없음).
- **A 목표**는 '타겟 라인' — 엔진 곡선 계산에 영향을 주지 않고 달성률/ETA 기준선으로만 쓰임.
- 셋 다 하나의 `Profile` 로 묶여 localStorage(또는 Supabase)에 저장됨.

---

## 계산 로직 (§8) — 심장

`src/lib/engine/` — 순수 함수 + Vitest 테스트(13개).

### 복리 프로젝션 (`projection.ts`)
- 배분 대상 = **연 소득 총액** = (근로+부수입+프리랜서) + 자본소득.
- 각 버킷 유입 = `annualIncome × ratio%`.
- **투자 버킷**: 미실현 수익(주가·시세) = 버킷 내 복리 / 실현 수익(배당·임대·이자) =
  **다음 해 '자본소득'으로 upstream 재유입 → 재배분** (하이브리드, 1년 지연).
  → 자본소득이 근로소득을 넘어서는 **역전 시점(crossover)** 이 자동으로 드러남.
- **연금·IRP(locked)**: 실현분도 계좌 내부 복리로 잠김 → passive/재유입 제외, '잠긴 자산' 분리 집계.
- **저축**: 저(무)수익 누적. **지출**: 소비(out), 자산에서 제외.
- 산출: 연도별 총자산 곡선, 목표 도달 연차(**ETA**), 현재/목표(**달성률%**), 월 passive.

### 8단계 신호 게이트 판정 (`stage.ts`)
절대 금액이 아니라 신호 게이트로 판정(1→8 누적, 8단계는 override). 임계값 튜닝 가능·'가정'.

### granularity
**연 단위**. 급여 성장률·인플레이션 0, 부채 상수, 기여는 연말 납입 가정.

### 단위 규약
모든 금액은 **만원** 단위 (10억 = `100000`, 월 300만 = `300`). 비율은 퍼센트 값.

---

## 열린 결정 → 채택한 기본값 (§10)

| 결정 | 채택값 | 비고 |
|---|---|---|
| 버킷 수익률 | **기본값 제시 + 사용자 수정** | 팔레트 프리셋에 가정 수익률, 인스펙터에서 편집 |
| 조립 UX | **리스트 + 비율 슬라이더 + 시각 플로우** | 자유 노드캔버스(react-flow) 대신. 드래그로 팔레트→캔버스 추가 지원, 모바일 친화·유지보수성 우선 |
| 커스텀 버킷 | **허용** (이름 + 카테고리 선택) | 수익률 기본값 자동 |
| 시나리오 저장 개수 | **최대 5개** | A/B 비교(점선 오버레이) 지원 |
| 단계 판정 임계값 | 저축률 **40%** · 비상금 **3개월** · 성장궤도 = 투자자산 ≥ 월소득×3 · 부동산 확장 ≥ 3억 | `STAGE_THRESHOLDS` 에서 튜닝 |
| passive 정의 | **실현 자본소득(배당·임대·이자)** · **연금·IRP 제외**(잠김) | |
| AI 장면 생성 | **fast-follow (드롭)** | 이모지/텍스트 입력으로 대체, UI 자리 마련 |
| 넛지 임계값 | ETA > 목표 시점 × **1.5** 또는 시점 내 미도달 | `needsRealityNudge` |
| nav 형태 | **웹 사이드바 + 모바일 하단탭** | |
| 시작 잔액 seed | 투자자산+부동산 → 투자 버킷 비율 배분 / 현금 → 저축 버킷 배분 / locked는 0에서 시작 | year 0 순자산 = 현재 순자산 보장 |
| 목표 기준 | **순자산 + passive 둘 다** (하나만 넣어도 OK) | 하드 상한 없음, 현실 피드백 넛지 |
| 인증 | MVP 스켈레톤은 **로컬(무인증)** | Supabase 연결 시 auth 추가 (아래) |

---

## Supabase (인증 + 영속 · 선택)

**환경변수 미설정 시 앱은 localStorage '로컬 모드'로 완전히 동작합니다.** 환경변수를 설정하면
이메일 OTP 로그인 + 기기 간 동기화가 켜집니다.

동작 방식:
- **로컬 모드(기본):** 모든 데이터는 브라우저 localStorage. 사이드바 하단 "로컬 모드 · 이 기기에 저장".
- **연결 모드:** 로그인 시 원격 프로필을 불러와 스토어를 교체. 원격이 비어 있고 로컬에 데이터가
  있으면 **로컬 → 계정으로 이관**. 이후 변경은 디바운스로 정규화 테이블에 저장.
  (`src/lib/auth.tsx` · `components/SyncManager.tsx` · `lib/store/supabaseRepo.ts`)

연결하려면:
1. Supabase 프로젝트 생성 후 마이그레이션 적용
   ```bash
   supabase db push   # 또는 SQL 에디터에 supabase/migrations/0001_init.sql 붙여넣기
   ```
2. `.env.local` 설정 (`.env.example` 참고)
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. **이메일 OTP:** Supabase Auth → Email 템플릿의 Magic Link 본문에 `{{ .Token }}` 을 포함해야
   6자리 코드 로그인이 동작합니다(코드 입력 방식 사용). 기본 매직링크만 쓰려면 redirect URL 설정 필요.

> 주의: 위 연결 모드는 실제 Supabase 프로젝트가 있어야 런타임 검증됩니다. 로컬 모드/타입/빌드는 검증 완료.

---

## 배포 (Railway)

Railway가 Next.js를 자동 감지합니다.
- Build: `npm run build`
- Start: `npm run start` (`PORT` 환경변수 사용)
- Supabase를 쓸 경우 위 두 환경변수를 Railway 프로젝트에 등록.

---

## 컴플라이언스 / 가드레일

- 수익률·미래 자산은 **항상 '예시·가정' 라벨**, 수익 보장 뉘앙스 금지.
- 개별 종목/매물 추천 ❌ — '배분 구조'만 (유사투자자문 회피).
- 세법 딥다이브 ❌ (절세계좌 '개념'까지).
- 목표는 하드캡 없음 + 현실 피드백(ETA·달성률·넛지).
