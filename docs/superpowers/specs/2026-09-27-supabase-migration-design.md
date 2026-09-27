# Supabase 전환 + 배포 자동화 설계

## 목표

DB를 Neon에서 Supabase로 옮기고, GitHub Actions로 검사·마이그레이션·keepalive를 자동화한다.

배포 직전 시점(2026-09-27, 예식 D-83)에 DB 계층을 바꾸는 작업이므로, **DB가 비어 있는 지금**에 끝낸다.
하객에게 URL이 나간 뒤에는 되돌릴 수 없다 — Supabase에 쌓인 편지는 Neon으로 돌아오지 않는다.

이 변경은 스키마 변경이 아니다. 테이블·마이그레이션 파일·토큰 생성·관리자 인증은 그대로 둔다.
이미지 저장소도 Vercel Blob을 그대로 쓴다.

## 왜 Neon에서 Supabase로 돌아가는가

`docs/requirements.md`의 「기술 선택 근거」는 원래 **Supabase를 제외**했다. 이유는 하나였다 —
Supabase 무료 플랜은 7일간 DB 활동이 없으면 프로젝트를 일시정지하고, 수동으로 Resume해야 한다.

그 판단을 뒤집는 근거는 다음과 같다. **나중에 "빠뜨린 것"으로 오해되지 않도록 남긴다.**

- 일시정지는 **삭제가 아니다.** 데이터·스토리지가 보존되고 대시보드에서 복구된다.
  (단 2024-06-24 정책 변경으로 **정지 후 90일** 안에 복구해야 한다.)
- GitHub Actions cron으로 주기적으로 깨우면 정지 자체가 일어나지 않는다.
  저장소 무활동 60일이면 cron이 비활성화되지만, GitHub이 사전 경고 메일을 보내고 커밋 하나로 리셋된다.
- 사용자가 이 수동 관리를 감수하기로 결정했다 (2026-09-27).

대신 Neon을 떠남으로써 잃는 것과 얻는 것을 분명히 해둔다.

| | Neon | Supabase |
|---|---|---|
| 방치 시 | 아무 일 없음 (관리 불필요) | 7일 뒤 정지 → keepalive 필요 |
| 컴퓨트 한도 | 100 CU-h/월 (이 규모에선 19~31 CU-h) | 미터 없음 |
| 로컬 개발 | HTTP 프록시 컨테이너 필요 | **불필요 — 평범한 Postgres** |

## 확정된 접근

### 연결 구조 — URL 두 개

Supabase는 접속 경로가 셋이고 용도가 갈린다.

| 경로 | 포트 | 환경변수 | 쓰는 곳 | 이유 |
|---|---|---|---|---|
| Transaction pooler | 6543 | `DATABASE_URL` | 런타임 | 서버리스용. 연결 다중화로 고갈 없음. prepared statement 불가 |
| Session pooler | 5432 | `DIRECT_URL` | 마이그레이션·drizzle-kit | DDL과 advisory lock이 transaction 모드에서 불안정 |
| Direct | 5432 | 안 씀 | — | IPv6 전용이라 Vercel 함수에서 접속 불가 |

리전은 **Seoul (`ap-northeast-2`)** 로 만든다.

연결 문자열의 비밀번호에 `@`·`#`·`/` 같은 문자가 있으면 URL 인코딩해야 한다.

### 드라이버

`@neondatabase/serverless` + `drizzle-orm/neon-http` → `postgres`(postgres.js) + `drizzle-orm/postgres-js`.

런타임 클라이언트 옵션은 다음을 반드시 포함한다.

- `prepare: false` — Supavisor transaction 모드는 prepared statement를 지원하지 않는다
- `max: 1` — 서버리스 인스턴스당 커넥션 1개
- `idle_timeout: 20` — 인스턴스가 얼어붙은 뒤 커넥션이 남지 않도록
- `connect_timeout: 10`

`src/db/index.ts`의 지연 생성(`cached ??= createDb()`)과 `isDatabaseConfigured()`는 유지한다.
`DATABASE_URL` 없이도 기본 청첩장이 빌드·렌더되는 성질을 깨면 안 된다.

`configureLocalProxy`와 `LOCAL_PROXY_HOST`는 삭제한다. Neon HTTP 드라이버 전용 분기였다.

### 로컬 개발

`docker-compose.dev.yml`에서 **`neon-proxy` 서비스를 삭제**한다. Postgres 하나만 남는다.
로컬에서는 `DATABASE_URL`과 `DIRECT_URL`이 같은 값이다.

```
postgres://postgres:postgres@localhost:55432/wedinvi
```

`db.localtest.me` 호스트 트릭도 함께 사라진다.

### `/api/health` — 새 라우트

keepalive가 두드릴 대상. **기존 `/api/guestbook`을 쓰면 안 된다** — 그 라우트는 DB 조회가 실패해도
`catch`에서 빈 배열과 HTTP 200을 돌려준다(하객 보호를 위한 의도적 설계). DB가 정지돼도 200이 나와서
keepalive가 영원히 green이 된다.

- `select 1` 한 번 실행 → 성공 `200 {ok:true}` / 실패 `503 {ok:false}`
- 응답 본문에 에러 내용을 담지 않는다 (정보 노출 방지)
- `export const dynamic = "force-dynamic"` 과 `Cache-Control: no-store` —
  CDN 캐시가 응답하면 DB를 건드리지 않아 keepalive 목적이 깨진다

### 배포 — Vercel 네이티브 유지

`main` push → Vercel이 자동 배포한다. GitHub Actions는 배포하지 않는다.

Actions에서 배포까지 지휘하는 방안(마이그레이션→배포 순서 보장)도 검토했으나 채택하지 않았다.
스키마가 사실상 완성돼 있어 예식까지 마이그레이션이 더 생길 일이 거의 없고,
Actions에서 빌드까지 하면 private 저장소의 2,000분 한도를 추가로 먹기 때문이다.
순서 보장이 필요해지면 그때 올린다.

### 워크플로 3개

한도 계산의 전제: 저장소가 **private**이라 GitHub Actions는 월 2,000분이다 (Linux 1배).
러너는 `ubuntu-latest`, Node는 **22 LTS**로 고정한다 (Next 16 요구사항 충족, Vercel 기본과 일치).

#### `ci.yml`

- 트리거: `main` push + pull request. `docs/**`, `photos/**`, `**.md` 변경은 제외
- 동시 실행 취소(`concurrency`)로 낭비를 줄인다
- **잡 하나(`check`)** 로 둔다: `npm ci`(npm 캐시) → `typecheck` → `test:story` → `test:dance`
  → `db:migrate` → `test:db`. `postgres:17-alpine` 서비스 컨테이너를 잡에 붙인다
- **`npm run build`는 돌리지 않는다.** Vercel이 매 push마다 빌드하고 실패를 알려준다.
  Actions에서 또 빌드하면 같은 일을 두 번 하면서 한도만 먹는다

> 잡을 `check`/`db-test` 둘로 나누려다 하나로 합쳤다. 나누면 `npm ci`가 잡마다 돌아
> 청구 분이 두 배가 된다(분은 잡 시간의 **합**으로 계산된다). 경로별 조건부 실행도
> 잡 단위로는 서드파티 액션이 필요해서 포기했다 — 합쳐도 회당 1.5분 안팎이라 한도에 여유가 있다.

CI의 고유 가치는 **유닛 테스트**다. 그건 다른 어디에서도 돌지 않는다.

#### `migrate.yml`

- 트리거: `main` push 중 `drizzle/**` 변경 + `workflow_dispatch`
- 저장소 시크릿 `DIRECT_URL` 로 마이그레이션 적용
- 이 워크플로가 `docs/deploy.md`의 "노트북에서 손으로 마이그레이션" 단계를 대체한다

#### `keepalive.yml`

- 트리거: 매주 월·목 03:00 UTC (`0 3 * * 1,4`) + `workflow_dispatch`
  → 최대 공백 4일. Supabase 정지 기준 7일보다 안전하다
- `curl --fail --retry 3 --retry-delay 10 --max-time 30 "$SITE_URL/api/health"`
  재시도는 Vercel·Supabase 콜드 스타트를 흡수하기 위한 것이다
- 사이트 주소는 저장소 **Variable** `SITE_URL` (시크릿이 아니라 눈으로 확인·수정 가능)
- 실패하면 워크플로가 red → GitHub이 메일을 보낸다
- 파일 상단 주석에 "저장소 무활동 60일이면 이 cron이 비활성화된다 / 정지까지 7일" 을 적는다

### DB 통합 테스트

드라이버를 통째로 교체하는데 회귀를 잡아줄 테스트가 하나도 없다. 최소한만 추가한다.

- 파일: `src/db/integration.test.ts`
- 실행: `npm run test:db` (새 스크립트). `DATABASE_URL`이 없으면 **건너뛴다**(실패가 아니라 skip)
- 검증 범위: 편지 1건 쓰기 → 토큰으로 읽기 / 방명록 1건 쓰기 → 목록 조회 → 삭제
- 테스트가 쓴 행은 테스트가 지운다

## 변경 파일 목록

| 파일 | 변경 |
|---|---|
| `package.json` | `@neondatabase/serverless` 제거, `postgres` 추가, `test:db` 스크립트 추가 |
| `src/db/index.ts` | 드라이버 교체, `configureLocalProxy` 삭제 |
| `src/app/api/health/route.ts` | **신규** |
| `scripts/db-migrate.ts` | `postgres-js/migrator`로 교체, `DIRECT_URL` 사용, 연결 종료(`client.end()`) 추가, **env 파일 없이 process.env만으로도 동작**하게 (CI에서 필요) |
| `drizzle.config.ts` | `DIRECT_URL ?? DATABASE_URL` |
| `docker-compose.dev.yml` | `neon-proxy` 서비스 삭제, 주석 재작성 |
| `.env.example` | `DIRECT_URL` 추가, Neon 설명을 Supabase로 |
| `src/db/*.integration.test.ts` | **신규** |
| `.github/workflows/{ci,migrate,keepalive}.yml` | **신규** |

### 문서 갱신

| 파일 | 내용 |
|---|---|
| `docs/requirements.md` | 「Vercel + Neon (Supabase 아님)」 절을 **지우지 말고** 결정을 뒤집은 이유와 함께 다시 쓴다 |
| `AGENTS.md` | 「로컬 DB에 Neon 프록시를 쓰는 이유」 절 재작성 |
| `docs/deploy.md` | 2번(Neon 연결) → Supabase, 6번(수동 마이그레이션) → 워크플로로 대체 |
| `docs/env.md` | `DIRECT_URL` 추가, Neon 설명 교체 |
| `README.md` | DB 관련 서술 |
| `docs/todo.md` | 인프라 체크리스트 갱신 |

## 실패 모드

| 상황 | 결과 | 방어선 |
|---|---|---|
| keepalive 실패 | 워크플로 red → GitHub 메일 | 메일 확인 후 대응 |
| 60일 무활동으로 cron 비활성화 | GitHub 사전 경고 메일 | 커밋 하나 또는 수동 실행 |
| 그래도 놓쳐 7일 정지 | 편지·방명록이 에러 | 대시보드에서 복구 (데이터 보존, **90일 내**) |
| transaction pooler 접속 실패 | 편지·방명록 500 | `DATABASE_URL`을 임시로 session pooler로 |
| 마이그레이션이 배포보다 늦음 | 스키마 변경 배포에서 잠시 에러 | 마이그레이션은 추가(additive) 위주로. 순서 보장이 필요하면 Actions 배포로 전환 |

## 롤백

코드는 revert + 재배포로 돌아온다. **Supabase에 쓰인 데이터는 돌아오지 않는다.**
따라서 이 전환은 실제 편지를 입력하기 전에 완료해야 한다.

## 검증 계획

DB 테스트가 없던 영역이라 수동 검증을 병행한다.

1. 도커 기동 → `npm run db:migrate` → 테이블 생성 확인
2. `npm run test:db` 통과
3. `npm run dev` → `/admin` 로그인 → 편지 작성 → 발급된 URL에서 편지 확인
4. 방명록 작성·조회·삭제
5. `npm run typecheck && npm run build && npm run test:story && npm run test:dance`
6. `curl localhost:3000/api/health` → 200. 도커를 내린 뒤 다시 호출 → **503** (이게 핵심 검증이다)
7. 배포 후: Supabase에 마이그레이션 적용 → 실제 URL로 3·4·6 재확인
8. `keepalive.yml` 수동 실행 → green 확인

## 범위 밖

- Supabase Auth·Realtime·Storage 도입 (관리자 2명·공용 비밀번호 구조를 바꾸지 않는다)
- Vercel Blob → Supabase Storage 이전 (이미 동작하고, 바꿀 이유가 없다)
- Supabase 프로젝트·Vercel 프로젝트·Blob 스토어·카카오 앱 생성 자동화
  (1회성 콘솔 작업이라 스크립트로 만들 이득이 없다)
