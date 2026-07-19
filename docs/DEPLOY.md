# 시라노 — 배포 · Supabase 운영 가이드

## 1. 로컬 Supabase E2E (검증 완료 경로)

```bash
npm run supabase:start          # Docker 필요 · 마이그레이션 자동 적용
npm run verify:supabase         # 스키마·트리거·RLS·읽기/쓰기 스모크
npm run supabase:stop           # 종료
```

앱에 붙이려면 `.env.local`:

```bash
# supabase status -o env 에서 복사
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

OTP 테스트 메일은 Mailpit: http://127.0.0.1:54324  
Auth → Email 템플릿에 `{{ .Token }}` 이 있어야 6자리 코드 로그인이 동작합니다(클라우드도 동일).

---

## 2. 클라우드 Supabase

무료 플랜은 **조직당 active 프로젝트 2개** 제한이 있다. `cyrano` 전용 프로젝트 생성 시
기존 프로젝트를 pause/삭제하거나 플랜 업그레이드가 필요할 수 있다.

```bash
# 프로젝트 생성 (슬롯 확보 후)
supabase projects create cyrano \
  --org-id <ORG_ID> \
  --db-password <STRONG_PASSWORD> \
  --region ap-northeast-2 \
  --size nano

supabase link --project-ref <REF>
supabase db push

supabase projects api-keys --project-ref <REF> -o env
```

`.env.local` / Railway Variables:

| Key | 값 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable |
| `NEXT_PUBLIC_POSTHOG_KEY` | (선택) |
| `NEXT_PUBLIC_LEAD_URL` | (선택) |

원격 스모크:

```bash
NEXT_PUBLIC_SUPABASE_URL=… \
NEXT_PUBLIC_SUPABASE_ANON_KEY=… \
SUPABASE_SERVICE_ROLE_KEY=… \
npm run verify:supabase
```

---

## 3. Railway

레포에 `Dockerfile` + `railway.toml` + `output: "standalone"` 이 준비되어 있다.

1. [railway.app](https://railway.app)에서 GitHub `c-yeonwoo/cyrano` 연결
2. 서비스 Variables에 위 env 등록
3. Deploy → 헬스체크 `GET /api/health`
4. (CLI) `npm i -g @railway/cli && railway login && railway link && railway up`

로컬 Docker 검증:

```bash
docker build -t cyrano .
docker run --rm -p 3000:3000 cyrano
curl -s http://127.0.0.1:3000/api/health
```

---

## 4. 컴플라이언스 페이지

| 경로 | 내용 |
|---|---|
| `/legal/disclaimer` | 투자 유의사항 (예시·가정) |
| `/legal/terms` | 이용약관 MVP 초안 |
| `/legal/privacy` | 개인정보 처리방침 MVP 초안 |

법무 검토 전 초안이며, GA 전 문구 감수를 권장한다.
