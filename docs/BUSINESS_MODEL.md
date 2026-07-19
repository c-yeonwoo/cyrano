# 시라노 — 비즈니스 모델 (결정)

> 작성: 2026-07 · Quiet Ledger 리뷰 후 v1.0 GA 전제 확정.
> 이 문서가 로드맵 우선순위의 기준이다.

---

## 결정 (Hybrid)

| 순서 | 모델 | 역할 | 시점 |
|---|---|---|---|
| **1차** | **리드젠 / 크로스셀** | 아하 이후 Signal Desk·APT·강의로 핸드오프 | 지금 ~ v1.1 |
| **2차** | **Freemium** | 무료 엔진 + 유료 **AI 재무 코치** | v2 |

**비권고 (당분간):** 시뮬레이터 자체 구독. 차별화·신뢰 baseline 전에 과금하면 이탈이 크다.

---

## 왜 이 순서인가

1. 지금 제품의 강점은 **획득·아하**(엔진 조립 → n년 곡선)다. 리텐션·실데이터는 아직 얇다.
2. 브랜드(시라노=코치)의 유료 웨지는 AI 코치가 맞지만, API·가드레일·신뢰 비용이 높다 → v2.
3. 리드젠은 CTA·랜딩 URL만으로 수익 경로를 열 수 있다. `linkedTool` 힌트가 이미 카탈로그에 있다.

---

## 제품에 미치는 영향

| 영역 | 함의 |
|---|---|
| 엔진 결과 / 공유 직후 | 리드 CTA 노출 (`LeadCta`, `NEXT_PUBLIC_LEAD_URL`) |
| Inspector `linkedTool` | 텍스트 → 클릭 가능한 CTA로 승격 (v1.1) |
| 계측 | `lead_cta_clicked`, `aha_engine_allocated`, 온보딩 퍼널 필수 |
| AI 코치 | 프리미엄 게이트 전제. 가드레일: 배분 구조만, 개별 종목·매물 금지 |
| 지출/마이데이터 | 리텐션·데이터 신선도용. 리드젠과 독립적으로 v1.5+ |

---

## North-star (프록시)

온보딩 완료자 중:

1. **아하:** 엔진 배분 합 100% 도달 (`aha_engine_allocated`)
2. **실행 의도:** 7일 내 재방문 + 실천 1건 (`action_completed` 또는 `weekly_checkin`)
3. **수익 경로:** 아하 이후 `lead_cta_clicked` 비율

---

## 환경변수

```bash
NEXT_PUBLIC_LEAD_URL=https://…   # 리드 랜딩. 없으면 CTA는 "곧 연결" + 계측만
NEXT_PUBLIC_POSTHOG_KEY=…        # 계측. 없으면 로컬 no-op
NEXT_PUBLIC_POSTHOG_HOST=…       # 기본 us.i.posthog.com
```

---

## 재검토 트리거

- 아하 도달율 baseline 2주 확보 후 리드 CTR이 구조적으로 낮으면 CTA 카피·위치 A/B.
- D7 리텐션이 의미 있게 오르기 전에 AI 코치 과금으로 건너뛰지 말 것.
- Signal/강의 측 상품이 없으면 URL을 비워 두고 계측만 쌓는다.
