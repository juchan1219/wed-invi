# 인수인계 — 배포 진행 상황

**마지막 갱신: 2026-09-30 · 예식 D-80 (2026-12-19 12:30 KST)**

지금 하고 있는 일은 **배포**다. 코드는 사실상 준비돼 있고, 남은 것은 대부분
**콘솔 클릭과 값 등록**이다. 이 문서는 "지금 어디까지 왔고 다음에 뭘 누르면 되는지"만 적는다.

> 작업 규칙은 [CLAUDE.md](../CLAUDE.md), 코드 구조는 [AGENTS.md](../AGENTS.md),
> 클릭 단위 절차는 [deploy.md](deploy.md), 체크리스트는 [todo.md](todo.md) 에 있다.
> **이 문서는 그것들을 대체하지 않는다.** 상태만 기록한다.

---

## 한 줄 요약

새 Vercel 계정의 `burgund32-4178/wed-invi`가 기준 프로젝트다. 기존 `juchan0702` Supabase DB,
서울 Public Vercel Blob, 새 Cloudflare 계정과 `주은예찬.com`을 모두 연결했다.
공개 주소 `https://www.주은예찬.com`의 홈·관리자·DB health가 정상이고, GitHub Actions의
마이그레이션과 keepalive도 green이다.

---

## 진행 상황

### 끝난 것 (코드·문서, 검증 완료)

| | 내용 |
|---|---|
| 사진 | 플레이스홀더 → 실제 웨딩 사진. 갤러리 29장 + hero + OG. 바른손 청첩장에서 가져옴 |
| DB | Neon HTTP 드라이버 → **Supabase + postgres.js**. `prepare:false`·`max:1`·`idle_timeout:20` |
| 로컬 | `docker-compose.dev.yml` 에서 Neon HTTP 프록시 컨테이너 삭제. 이제 Postgres 하나뿐 |
| 신규 | `/api/health` — `select 1` → 200 / 503. keepalive가 두드릴 대상 |
| 테스트 | `src/db/integration.test.ts` 5개 (`npm run test:db`) |
| 워크플로 | `.github/workflows/` 의 `ci.yml` · `migrate.yml` · `keepalive.yml` |
| 문서 | `deploy.md`·`env.md`·`README.md`·`AGENTS.md`·`requirements.md`·`todo.md` 전부 Supabase 기준으로 갱신 |

### 2026-09-30에 실제로 확인한 외부 상태

| 항목 | 확인 결과 |
|---|---|
| **GitHub Actions `CI`** | `909a7a4`의 CI #3 success. 타입 검사·유닛 테스트·DB 통합 테스트까지 통과 |
| **Vercel 배포** | 새 계정 `burgund32-4178/wed-invi` Production Ready. 환경변수 6개 등록 |
| **공개 주소** | `https://www.주은예찬.com` 홈 200, 루트는 `www`로 308, SSL 정상 |
| **Supabase 런타임 연결** | `/api/health`가 `200 {"ok":true}`, 관리자 로그인 및 3개 테이블 확인 |
| **Vercel Blob** | `wed-invi-blob`, Seoul(`icn1`), Public. 토큰 자동 주입 후 재배포 Ready |
| **Cloudflare** | 새 계정에서 Active. 가비아 NS `elaine`/`sonny`, 루트·`www` DNS only CNAME |
| **GitHub Actions** | Secret `DIRECT_URL`, Variable `SITE_URL` 등록. Migrate #1·Keepalive #3 success |

### 남은 것

- **카카오 개발자 앱** 생성 + JavaScript 키와 플랫폼 Web 도메인 등록
- 실제 사진으로 **Vercel Blob 업로드** 확인
- 지도 앱·공유·카카오톡·캘린더 등 실기기 확인 ([todo.md](todo.md) 3절)
- 접근 가능한 경우 예전 Vercel 계정의 중복 프로젝트 연결 해제 또는 삭제

---

## 다음에 할 일 — 이 순서대로

### 1. 카카오 개발자 앱

`NEXT_PUBLIC_KAKAO_JS_KEY`를 등록하고, 플랫폼 Web 사이트 도메인에 한글과 퓨니코드 주소를
모두 추가한 뒤 재배포한다. 자세한 절차는 [deploy.md 8번](deploy.md).

### 2. 실기기·Blob 확인

관리자에서 실제 사진 한 장을 첨부해 Blob 업로드를 확인하고, 이어서 [todo.md 3절](todo.md)의
지도 앱·복사·공유·카카오톡·캘린더 항목을 휴대전화에서 확인한다.

### 3. 예전 Vercel 프로젝트 정리

새 프로젝트가 기준이고 운영 트래픽도 모두 새 계정으로 간다. 예전 Vercel 계정에 다시 접근할 수
있을 때 중복 프로젝트의 Git 연결을 해제하거나 프로젝트를 삭제해 불필요한 이중 빌드를 끝낸다.

---

## 이 세션에서 내린 결정 (이유까지)

| 결정 | 왜 |
|---|---|
| **Neon → Supabase** | 원래 Neon을 골랐던 이유(7일 정지)를 뒤집었다. 정지되어도 데이터는 보존되고 90일 내 복구 가능하며, cron으로 막을 수 있고, 사용자가 그 수동 관리를 감수하기로 했다. 전체 근거는 [requirements.md 「기술 선택 근거」](requirements.md) 와 [스펙](superpowers/specs/2026-09-27-supabase-migration-design.md) |
| **배포는 Vercel 네이티브** | Actions가 배포까지 지휘하는 방안도 검토했으나, 스키마가 완성돼 있어 순서 보장의 이득이 적고 private 저장소의 Actions 2,000분을 더 먹는다 |
| **CI에서 `npm run build` 안 함** | Vercel이 매 push마다 빌드하고 실패를 알려준다. 두 번 할 이유가 없다 |
| **keepalive는 `/api/health`** | `/api/guestbook` 은 DB가 죽어도 200을 돌려준다(하객 보호용 의도적 설계). 그걸 두드리면 워크플로가 영원히 초록이라 정지를 못 잡는다 |
| **마이그레이션은 session pooler** | Supabase 공식 문서는 direct 연결을 권하지만 direct는 IPv6 전용이라 GitHub 러너·Vercel에서 못 붙는다. shared pooler는 모든 플랜에서 IPv4다 |
| **이미지 저장소는 Vercel Blob 유지** | 이미 동작하고 바꿀 이유가 없다 |

---

## 검증 상태 — **이 구분을 지킬 것**

### 실제로 돌려서 확인한 것

```
npm ci · typecheck · build                      통과
test:story 113 / test:dance 5 / test:db 5       fail 0
/api/health   DB 살아있음 200 → docker stop 503 → 복구 200
CI 환경 시뮬레이션(.env.local 없이 환경변수만)   마이그레이션·테스트 통과, 실패 시 종료코드 1
빈 NEXT_PUBLIC_SITE_URL                          폴백으로 빌드 성공 (고치기 전엔 실패 재현됨)
워크플로 YAML 3개                                 파싱 통과
깨끗한 체크아웃의 `npm run typecheck`              생성 전 실패 → `next typegen` 포함 후 통과
GitHub Actions CI #3 (`909a7a4`)                   success (DB 통합 테스트 포함)
GitHub Actions Keepalive #2 (`c18f033`)            success (`SITE_URL`로 `/api/health` 호출)
Vercel `wed-invi-88b2` 홈 · `/api/health`           200 · `200 {"ok":true}`
```

### 확인 못 한 것 — 사실처럼 쓰지 말 것

- **Migrate 워크플로 실제 성공.** 아직 Repository Secret `DIRECT_URL`이 없다
- **한글 도메인**의 SSL 발급과 카카오 공유 매칭
- 갤러리 29장이 실제 화면에서 어떻게 보이는지 (3열 × 10줄이 된다)
- 지도 앱 딥링크·클립보드·`navigator.share`·`.ics`·Blob 업로드 — 전부 실기기 전용

---

## 밟은 함정 (같은 데 또 빠지지 말 것)

1. **Vercel에 값 없는 환경변수를 만들면 빌드가 죽었다.**
   `??` 가 빈 문자열을 통과시켜 `new URL("")` 이 터졌다. 코드는 고쳤지만(`?.trim() ||`),
   값 없는 변수는 애초에 만들지 말 것. Vercel import 화면이 `.env.example` 을 읽어
   행을 자동으로 만들어 주는데, **값이 빈 행이 있으면 Create 버튼도 안 눌린다.**

2. **`process.loadEnvFile` 은 파일이 없으면 ENOENT를 던진다.**
   CI에는 `.env.local` 이 없다. `existsSync` 로 감쌌다.

3. **마이그레이션 재실행 시 NOTICE가 에러처럼 보인다.**
   `schema "drizzle" already exists` 는 정상이다. `onnotice` 로 눌러놨다.

4. **`git push` 가 HTTP 400으로 실패했다.**
   사진 때문에 전송이 커서 기본 버퍼(1MB)를 넘겼다.
   이 저장소에 `http.postBuffer = 524288000` 을 설정해 뒀다.

5. **Vercel 빌드 로그와 GitHub Actions 로그는 다른 곳이다.** 실패 보고를 받으면 어느 쪽인지부터 확인할 것.

---

## 비밀값

**이 저장소에는 없고, 앞으로도 넣지 말 것.**

| 값 | 어디에 있나 |
|---|---|
| `TOKEN_SECRET` · `SESSION_SECRET` · `ADMIN_PASSWORD` | 2026-09-27 세션에서 생성해 사용자에게 전달. Vercel 환경변수와 사용자 비밀번호 관리 앱 |
| Supabase 연결 문자열 | Supabase 대시보드 → Connect. 비밀번호는 프로젝트 생성 시 정한 값 |

> ⚠️ **`TOKEN_SECRET` 은 절대 바꾸지 말 것.** 하객 URL(`/i/<토큰>`)이 이 값으로 만들어진다.
> 바꾸는 순간 이미 나간 링크가 전부 죽는다. 아직 링크를 안 보냈다면 지금이 마지막 변경 기회다.

로컬 `.env.local` 은 도커를 가리킨다(`localhost:55432`, `DATABASE_URL` 과 `DIRECT_URL` 이 같은 값).

---

## 브랜치

- 작업 브랜치는 **`main`** 이다. Vercel이 `main` 을 배포한다
- `feat/supabase-migration` 은 `main` 에 fast-forward 머지가 끝났다. 지워도 된다
- `codex/*` 두 개도 머지 완료 상태다
