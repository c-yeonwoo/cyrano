# 지출관리 ↔ 자산 설계 엔진 연동

> 상태: **Phase A·B UX 구현** · 자동 sync 없음  
> 단위 브리지: `src/lib/spending/bridge.ts` · UI: `ApplySpendingToEngine` / `SpendRatioSuggestion`

## 1. 역할 분리

| 모듈 | 역할 | 단위 |
|---|---|---|
| **지출관리 (E)** | 실제 기록 · 예산 · 페이스 · 진단(또래/패턴) | **원** |
| **진단 스냅샷** | `monthlySpending` — 단계·여유자금·자유 판정 입력 | **만원** |
| **배분 엔진** | 수입 → `g_spend` 등 계층 배분(의도/계획) | **만원 · %** |

지출 = **실측**, 엔진 = **의도 배분**. 둘이 같아질 필요는 없지만, 실측이 계획의 기준선을 제안해야 한다.

## 2. 숫자 브리지

```
월 총지출(원) = sum(해당 월 변동 로그) + sum(고정)
엔진 monthlySpending(만원) = floor(월 총지출 / 10_000)
```

- 고정은 매월 동일하게 포함(결제일과 무관 — v1).
- 변동은 **조회 중인 달** 기준. 엔진 sync 시에는 **당월**을 쓴다.
- 원→만원은 **버림** (엔진 계층 월 환산과 동일 정책).

## 3. 연동 단계 (제안)

### Phase A — 단방향 pull ✅
1. 지출 **요약**: 「엔진에 반영」 / 진단: 「지출 실측 가져오기」 (`ApplySpendingToEngine`).
2. `monthSpendingBreakdown` → ConfirmModal 확인 후 `snapshot.monthlySpending` 덮어쓰기.
3. 값 = 당월 변동 + **고정 전체**(결제일 무관) · 만원 버림. 요약「오늘까지」와 의도적으로 다름.
4. 이미 동일·실측 0원이면 버튼 비활성. analytics: `spend_applied_to_engine`.

### Phase B — 배분 트리 제안 ✅
1. `toSpendRatioPctSuggestion` / `applySpendRatioToBuckets` — 지출 루트·고정/변동 `ratioPct`만 패치.
2. 엔진: `SpendRatioSuggestionBar` + 지출 노드 「실측」 배지 + Inspector CTA.
3. 수락 시 canvas 위치 유지 · 없으면 지출 트리 생성 · 진단 `monthlySpending`도 동일 실측으로 맞춤.
4. analytics: `spend_ratio_suggestion_applied`.

### Phase C — 양방향·루프 (이후)
- 엔진에서 지출 한도를 바꾸면 변동 **예산** 제안(고정 제외한 잔여).
- 예산 초과 페이스 → 엔진 `g_spend` 경고 링크.
- Supabase sync 시 spending ↔ snapshot 버전 필드.

## 4. 하지 않을 것 (v1)

- 기록할 때마다 `monthlySpending` 자동 덮어쓰기 (노이즈·되돌리기 어려움).
- 카테고리별 엔진 노드 1:1 강제 매핑 (카탈로그 taxonomy가 다름).
- 고정 결제일 기준 일별 엔진 반영.

## 5. UX 카피 가이드

- 요약: 「변동 + 고정 = 이번 달 지출 총합」
- 변동 탭: 「n월 현재까지 / 예산」페이스
- 엔진 반영: 「실측을 계획 입력에 넣을까요? (만원으로 반올림·버림)」

## 6. 열린 결정

- [x] Phase A 트리거: 요약 카드 + 진단 인라인 (배너 아님)
- [x] Phase B: `g_spend` + 고정/변동 ratio
- [ ] 과거 달 평균 vs 당월만
