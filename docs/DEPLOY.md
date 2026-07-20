# Loop+ (루플러스) — 배포 · Supabase 운영 가이드

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

1. [railway.app](https://railway.app)에서 GitHub `c-yeonwoo/looplus` 연결
2. 서비스 Variables에 위 env 등록 (**필수** — `NEXT_PUBLIC_*` 는 **빌드 시** 번들에 들어감)
3. Variables 저장 후 **Redeploy** (런타임만 바꿔서는 로그인 UI가 안 열림)
4. Networking → Generate Domain (포트 **3000**)
5. Supabase Auth Site URL / Redirect URLs에 Railway 도메인 추가
6. Deploy → 헬스체크 `GET /api/health`

로컬 Docker 검증 (빌드 환경에 NEXT_PUBLIC_* 가 있어야 로그인 번들 포함):

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
docker build -t looplus .
docker run --rm -p 3000:3000 looplus
curl -s http://127.0.0.1:3000/api/health
```

> Docker는 호스트 `export`를 자동으로 넘기지 않을 수 있다. 그 경우  
> `docker build --build-arg NEXT_PUBLIC_SUPABASE_URL --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
> 와 Dockerfile `ARG` 선언이 필요하다. Railway는 Variables를 빌드 ENV로 넣어 주므로 보통 추가 설정 없이 된다.

---

## 4. 컴플라이언스 페이지

| 경로 | 내용 |
|---|---|
| `/legal/disclaimer` | 투자 유의사항 (예시·가정) |
| `/legal/terms` | 이용약관 MVP 초안 |
| `/legal/privacy` | 개인정보 처리방침 MVP 초안 |

법무 검토 전 초안이며, GA 전 문구 감수를 권장한다.
