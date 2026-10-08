# 환경변수 — 무엇을, 어디에, 어디서 구하나

새 컴퓨터에서 클론했을 때 이 문서만 보면 됩니다.

환경변수를 넣는 곳은 **세 군데**입니다.

| 곳 | 파일/위치 | 언제 쓰이나 |
|---|---|---|
| **내 컴퓨터** | 프로젝트 루트의 `.env.local` | `npm run dev`, `npm run db:migrate` |
| **Vercel** | 프로젝트 → Settings → Environment Variables | 실제 배포된 사이트 |
| **GitHub Actions** | 저장소 → Settings → Secrets and variables → Actions | 마이그레이션·keepalive 워크플로 ([아래](#github-actions-에-넣는-값)) |

`.env.local` 은 `.gitignore` 에 걸려 있어 저장소에 올라가지 않습니다.
그래서 **새 컴퓨터에서는 항상 직접 만들어야 합니다.**

---

## 🚨 먼저 읽으세요 — 이미 배포한 뒤에 클론한다면

**`TOKEN_SECRET` 을 새로 만들면 안 됩니다.** Vercel에 등록된 값을 그대로 가져와야 합니다.

이 값으로 하객 URL(`/i/<토큰>`)이 만들어집니다. 값이 다르면 같은 이름·번호를 입력해도
**전혀 다른 URL이 나오고, 이미 카톡으로 보낸 링크는 전부 열리지 않습니다.**

아직 한 번도 배포하지 않았다면 새로 만들어도 됩니다.

---

## 한눈에 보기

| 변수 | 내 컴퓨터 | Vercel | 어디서 구하나 | 없으면 |
|---|---|---|---|---|
| `DATABASE_URL` | 직접 입력 | 직접 입력 | Supabase → Connect → **Transaction pooler (6543)** / 로컬 Docker면 고정값 | `/admin`·편지·방명록이 죽음 (기본 청첩장은 정상) |
| `DIRECT_URL` | 직접 입력 | 직접 입력 | Supabase → Connect → **Session pooler (5432)** / 로컬 Docker면 `DATABASE_URL` 과 같은 값 | 마이그레이션·drizzle-kit이 런타임 URL로 떨어짐 (로컬은 무해, 배포는 위험) |
| `ADMIN_PASSWORD` | 직접 입력 | 직접 입력 | 본인이 정함 | 로그인 불가 |
| `SESSION_SECRET` | 직접 입력 | 직접 입력 | `openssl rand -base64 32` | 로그인 불가 |
| `TOKEN_SECRET` | 직접 입력 | 직접 입력 | `openssl rand -base64 32` ⚠️ **배포 후엔 기존 값 복사** | 편지 저장/조회 불가 |
| `NEXT_PUBLIC_SITE_URL` | 직접 입력 | 직접 입력 | 로컬은 `http://localhost:3000`, 배포는 실제 주소 | OG 이미지·공유 링크가 깨짐 |
| `BLOB_READ_WRITE_TOKEN` | (선택) | **자동 주입** | Vercel Blob 스토어 생성 시 자동 | 편지에 이미지만 못 넣음 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | (선택) | 직접 입력 | developers.kakao.com → 앱 키 | 카카오톡 버튼만 숨겨짐 |
| `NEXT_PUBLIC_PHONE_*` (6개) | 직접 입력 | 직접 입력 | 본인·혼주 전화번호 | 연락처 섹션이 빔 |
| `NEXT_PUBLIC_ACCOUNT_*` (6개) | 직접 입력 | 직접 입력 | 통장·은행 앱 | 계좌 섹션이 빔 |

**자동 주입**은 Vercel에서 Blob 스토어를 만들면 Vercel이 알아서 넣어준다는 뜻입니다.
직접 입력할 필요도 없고, 하면 안 됩니다.

**DB는 자동 주입이 아닙니다.** Neon을 쓸 때는 Vercel 연동이 `DATABASE_URL` 을 넣어줬지만,
Supabase 프로젝트는 콘솔에서 직접 만들어 쓰므로 `DATABASE_URL` 과 `DIRECT_URL` 을
**손으로 등록**해야 합니다 ([deploy.md](deploy.md) 2번).

---

## 상황별 가이드

### A. 아직 배포 전 — 처음 세팅하는 경우

로컬 Docker DB로 개발합니다. 시크릿은 새로 만들면 됩니다.

```bash
cp .env.example .env.local
openssl rand -base64 32    # 두 번 실행해서 각각 SESSION_SECRET, TOKEN_SECRET 에
```

`.env.local` 을 이렇게 채웁니다.

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
DIRECT_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
ADMIN_PASSWORD="아무거나-길게"
SESSION_SECRET="<openssl 결과 1>"
TOKEN_SECRET="<openssl 결과 2>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN=""
NEXT_PUBLIC_KAKAO_JS_KEY=""
```

로컬에서는 두 URL이 **같은 값**입니다. 도커 Postgres 하나만 띄우면 되니까요.

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run dev
```

> 나중에 배포할 때, 여기서 만든 `TOKEN_SECRET` 을 **Vercel에도 똑같이** 넣으면
> 로컬에서 만든 하객 URL이 배포본에서도 그대로 열립니다.

---

### B. 이미 배포함 — 새 컴퓨터에서 이어서 작업

**가장 쉬운 방법: Vercel에서 통째로 받아오기**

```bash
npm i -g vercel        # 한 번만
vercel login
vercel link            # 물어보면 기존 프로젝트(wed-invi) 선택
vercel env pull .env.local
```

이러면 `DATABASE_URL`, `TOKEN_SECRET` 등이 **전부 올바른 값으로** 채워집니다.
직접 옮겨 적다가 오타 내는 사고가 없습니다.

받아온 뒤 **한 줄만 고치세요.**

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

> 이걸 안 고치면 로컬 관리자 화면에서 발급되는 링크가 배포 주소로 나옵니다.
> (실제로 공유할 주소는 그게 맞지만, 로컬에서 눌러 확인하기엔 불편합니다.)

이제 실제 배포 DB에 붙어서 **진짜 편지와 방명록을 그대로** 볼 수 있습니다.
Docker는 필요 없습니다.

```bash
npm run dev
```

> ⚠️ 이 상태에서는 **실제 데이터를 건드립니다.** 편지를 지우면 진짜로 지워집니다.

**수동으로 옮기고 싶다면**: Vercel → Settings → Environment Variables 에서
각 항목의 눈 아이콘을 눌러 값을 확인하고 `.env.local` 에 붙여넣습니다.
`TOKEN_SECRET` 과 `SESSION_SECRET` 은 반드시 같은 값이어야 합니다.

---

### C. 이미 배포함 — 로컬 DB로 안전하게 개발

실제 데이터를 건드리기 싫을 때. B와 같지만 DB만 로컬로 돌립니다.

```bash
vercel env pull .env.local
```

받아온 뒤 세 줄을 고칩니다.

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
DIRECT_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

`DIRECT_URL` 을 같이 안 고치면 **마이그레이션이 배포 DB(Supabase)에 적용됩니다.**
DB 주소 두 줄은 꼭 함께 바꾸세요.

**`TOKEN_SECRET` 은 건드리지 마세요.** 그래야 로컬에서 테스트한 URL이 배포본과 같아집니다.

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run dev
```

---

## 값 하나하나

### `DATABASE_URL`

편지·방명록이 저장되는 Postgres 주소. **앱(배포된 사이트와 `npm run dev`)이 쓰는 값**입니다.

| 상황 | 값 |
|---|---|
| 로컬 Docker | `postgres://postgres:postgres@localhost:55432/wedinvi` |
| Supabase | 대시보드 → **Connect** → **Transaction pooler** (포트 **6543**) |
| Vercel | 위 Supabase 값을 **직접 등록** (자동 주입이 아닙니다) |

포트 `55432` 는 `docker-compose.dev.yml` 이 띄우는 Postgres 컨테이너입니다. 중계 프록시는
없습니다 — Supabase도 평범한 Postgres 프로토콜이라 로컬은 컨테이너 하나로 충분합니다.

⚠️ 런타임은 반드시 **transaction pooler(6543)** 입니다. 서버리스 함수는 요청마다 새로 뜨기 때문에
커넥션 풀을 유지할 수 없고, pooler가 연결을 다중화해 줘야 커넥션이 고갈되지 않습니다.
대신 이 모드는 prepared statement를 지원하지 않아서 드라이버에 `prepare: false` 를 켜 뒀습니다
([`src/db/index.ts`](../src/db/index.ts)).

⚠️ **Direct connection(IPv6 전용)은 쓸 수 없습니다.** Vercel 함수에서 아예 붙지 못합니다.
호스트가 `...pooler.supabase.com` 인 쪽을 쓰세요.

⚠️ 비밀번호에 `@` `#` `/` 가 있으면 **URL 인코딩**해야 합니다 (`%40` `%23` `%2F`).
연결 문자열은 URL이라 이 문자들이 구분자로 읽힙니다.

### `DIRECT_URL`

마이그레이션(`npm run db:migrate`)과 drizzle-kit(`db:generate`·`db:studio`)이 쓰는 주소.
**앱은 이 값을 쓰지 않습니다.**

| 상황 | 값 |
|---|---|
| 로컬 Docker | `DATABASE_URL` 과 **같은 값** |
| Supabase | 대시보드 → **Connect** → **Session pooler** (포트 **5432**) |
| Vercel | 위 값을 직접 등록 (수동 마이그레이션 때 `vercel env pull` 로 받아옵니다) |

경로를 나눈 이유는 **DDL과 advisory lock이 transaction 모드에서 불안정**하기 때문입니다.
스키마를 바꾸는 작업은 session pooler로 붙어야 안전합니다.

값이 없으면 `DATABASE_URL` 로 떨어집니다. 로컬 도커에서는 둘이 같은 값이라 무해하지만,
배포 DB에 적용할 때는 transaction pooler로 마이그레이션을 돌리는 셈이 되니 꼭 채우세요.

> GitHub Actions의 `Migrate` 워크플로도 같은 이름의 **저장소 시크릿**을 씁니다
> (아래 [GitHub Actions 에 넣는 값](#github-actions-에-넣는-값)).

### `ADMIN_PASSWORD`

예찬·주은이 `/admin` 로그인에 쓰는 공용 비밀번호. 본인이 정합니다.

서버리스라 로그인 시도 횟수 제한을 걸 수 없어서 **길이가 유일한 방어선**입니다. 20자 이상 권장.
언제든 바꿔도 됩니다 — 바꾸고 재배포하면 끝이고, 기존 로그인만 유지됩니다.

### `SESSION_SECRET`

관리자 로그인 쿠키에 서명하는 값.

```bash
openssl rand -base64 32
```

바꿔도 **큰일 나지 않습니다.** 로그인한 사람이 로그아웃될 뿐입니다.
로컬과 배포가 달라도 상관없습니다.

### `TOKEN_SECRET` ⚠️

하객 URL을 만드는 값. `HMAC(TOKEN_SECRET, "이름|뒷자리4")` → `/i/<12자>`

```bash
openssl rand -base64 32
```

- **한 번 정하면 절대 바꾸지 마세요.** 배포된 하객 URL이 전부 죽습니다
- 로컬과 배포가 **같아야** 로컬에서 만든 URL이 배포본에서도 열립니다
- 비밀번호 관리 앱 같은 곳에 따로 백업해 두세요

### `NEXT_PUBLIC_SITE_URL`

OG 태그의 절대 URL과 공유 링크를 만드는 데 쓰입니다.

| 곳 | 값 |
|---|---|
| 로컬 | `http://localhost:3000` |
| Vercel | `https://wed-invi-xxxx.vercel.app` (또는 커스텀 도메인) |

**끝에 `/` 를 붙이지 마세요.** 커스텀 도메인을 붙였다면 이 값과 카카오 사이트 도메인을 함께 갱신해야 합니다.

`NEXT_PUBLIC_` 접두사가 붙은 값은 **브라우저에 그대로 노출됩니다.** 비밀을 넣으면 안 됩니다.

### `BLOB_READ_WRITE_TOKEN` (선택)

편지에 첨부하는 이미지를 저장할 Vercel Blob 토큰. Vercel에서 Blob 스토어를 만들면 자동 주입됩니다.

⚠️ 스토어를 만들 때 **Access mode를 `Public`** 으로 골라야 합니다. 생성 후에는 못 바꿉니다.

로컬에서 이미지 업로드까지 테스트하려면 `vercel env pull` 로 받아오면 됩니다.
비워두면 관리자 화면에서 이미지 버튼을 눌렀을 때 안내 문구가 뜨고, 나머지는 정상 동작합니다.

### `NEXT_PUBLIC_KAKAO_JS_KEY` (선택)

카카오톡 공유 버튼용. developers.kakao.com → 내 애플리케이션 → 앱 키 → **JavaScript 키**.

플랫폼 → Web → **사이트 도메인 등록**을 함께 해야 동작합니다 ([deploy.md](deploy.md) 8번).

비워두면 카카오톡 버튼만 숨겨지고, OS 공유·링크 복사는 그대로 동작합니다.
로컬에서 테스트하려면 카카오 사이트 도메인에 `http://localhost:3000` 도 추가하세요.

### `NEXT_PUBLIC_PHONE_*` / `NEXT_PUBLIC_ACCOUNT_*` — 연락처·계좌 번호

이 저장소는 **공개**입니다. 전화번호·계좌번호를 `src/config/wedding.ts` 에 적으면
git 히스토리에 영구히 남고, 공개 저장소를 긁는 수집기의 대상이 됩니다.
그래서 **번호만** 환경변수로 받습니다. 이름·은행·예금주·라벨은 설정 파일에 그대로 있습니다.

| 이름 | 누구 |
|---|---|
| `NEXT_PUBLIC_PHONE_GROOM` | 신랑 |
| `NEXT_PUBLIC_PHONE_GROOM_FATHER` / `_MOTHER` | 신랑 아버지 / 어머니 |
| `NEXT_PUBLIC_PHONE_BRIDE` | 신부 |
| `NEXT_PUBLIC_PHONE_BRIDE_FATHER` / `_MOTHER` | 신부 아버지 / 어머니 |
| `NEXT_PUBLIC_ACCOUNT_GROOM` | 신랑 (하나은행) |
| `NEXT_PUBLIC_ACCOUNT_GROOM_FATHER` | 신랑 아버지 (국민은행) |
| `NEXT_PUBLIC_ACCOUNT_GROOM_MOTHER` | 신랑 어머니 (농협은행) |
| `NEXT_PUBLIC_ACCOUNT_BRIDE` | 신부 (하나은행) |
| `NEXT_PUBLIC_ACCOUNT_BRIDE_FATHER` | 신부 아버지 (국민은행) |
| `NEXT_PUBLIC_ACCOUNT_BRIDE_MOTHER` | 신부 어머니 (농협은행) |

**이 값들은 비밀이 아닙니다.** 청첩장 화면에 그대로 보이고, `NEXT_PUBLIC_` 이라
빌드 시 번들에 인라인되어 브라우저에 실립니다. 목적은 "숨기기"가 아니라
**공개 저장소에 남기지 않기**입니다. 위 `NEXT_PUBLIC_SITE_URL` 항목의
"비밀을 넣으면 안 됩니다" 경고와 모순이 아닙니다 — 애초에 비밀이 아닙니다.

> ⚠️ **넣는 곳은 Vercel 환경변수입니다. GitHub Secret이 아닙니다.**
> `NEXT_PUBLIC_*` 는 **빌드 시점에** 번들로 박히고, 실제 사이트를 만드는 빌드는
> Vercel에서만 돕니다. `ci.yml` 은 일부러 `npm run build` 를 돌리지 않으므로
> GitHub에 넣은 값은 사이트에 반영되지 않습니다.

등록 후 **재배포**해야 반영됩니다. 빌드 시점에 박히는 값이라 환경변수만 바꾸고
재배포하지 않으면 이전 번들이 그대로 서빙됩니다.

비워두면 그 항목만 목록에서 사라집니다(`withNumber`). 전부 비면 섹션이
"등록된 연락처가 없습니다" / "등록된 계좌가 없습니다" 안내를 보입니다 —
빈칸이 뜨는 것보다 누락을 알아채기 쉽게 한 것입니다.

하이픈은 포함해 적으세요. 계좌 복사 버튼이 숫자만 떼어 복사합니다.

---

## GitHub Actions 에 넣는 값

워크플로 두 개가 값을 하나씩 씁니다.
저장소 → **Settings** → **Secrets and variables** → **Actions**.

| 종류 | 이름 | 값 | 쓰는 워크플로 |
|---|---|---|---|
| **Secret** | `DIRECT_URL` | Supabase **session pooler (5432)** | `migrate.yml` — 배포 DB에 마이그레이션 적용 |
| **Variable** | `SITE_URL` | `https://<도메인>` (끝에 `/` 없이) | `keepalive.yml` — `/api/health` 호출로 Supabase 정지 방지 |

- `DIRECT_URL` 에는 비밀번호가 들어 있으니 반드시 **Secret** 입니다.
- `SITE_URL` 은 비밀이 아니고 눈으로 확인·수정할 수 있어야 하므로 **Variable** 탭입니다.
  (Secret에 넣으면 워크플로가 값을 못 찾아 실패합니다 — `vars.SITE_URL` 로 읽습니다.)
- `ci.yml` 은 등록할 값이 없습니다. 러너 안에 Postgres 컨테이너를 띄워 두 URL을 직접 만들어 씁니다.
- **연락처·계좌(`NEXT_PUBLIC_PHONE_*`·`NEXT_PUBLIC_ACCOUNT_*`)는 여기 넣지 않습니다.**
  빌드 시점에 번들로 박히는 값이고 배포 빌드는 Vercel에서만 돌기 때문입니다. Vercel 환경변수에 등록하세요.

커스텀 도메인을 붙였다면 `SITE_URL` 도 함께 갱신하세요. 옛 주소가 아직 살아 있으면
keepalive는 계속 green이라 빼먹은 것을 알아채기 어렵습니다.

---

## 자주 하는 실수

| 증상 | 원인 |
|---|---|
| 하객 URL이 갑자기 안 열림 | `TOKEN_SECRET` 이 배포본과 다릅니다. Vercel 값을 복사해 오세요 |
| Vercel에서 로그인이 안 됨 | 환경변수 등록 후 **재배포**를 안 했습니다. 다음 배포부터 적용됩니다 |
| 로컬에서 `/admin` 이 500 | `DATABASE_URL` 이 없거나 마이그레이션(`npm run db:migrate`)을 안 했습니다 |
| 공유 링크가 localhost로 나감 | 배포 환경의 `NEXT_PUBLIC_SITE_URL` 이 localhost로 되어 있습니다 |
| 로컬 링크가 배포 주소로 나옴 | `vercel env pull` 후 `NEXT_PUBLIC_SITE_URL` 을 안 고쳤습니다 (정상 동작이지만 헷갈립니다) |
| 배포에서 편지·방명록만 죽음 | `DATABASE_URL` 을 Vercel에 등록하지 않았습니다. **Supabase는 자동 주입이 아니라 직접 등록**입니다 (Neon을 쓰던 시절과 반대입니다) |
| 배포에서 DB 질의가 계속 실패 | `DATABASE_URL` 에 session pooler(5432)나 direct 연결을 넣었습니다. 런타임은 **transaction pooler(6543)** 입니다 |
| 마이그레이션이 실패하거나 도중에 멈춤 | `DIRECT_URL` 에 transaction pooler(6543)를 넣었을 수 있습니다. **session pooler(5432)** 로 바꾸세요 |
| 접속이 비밀번호 오류로 거부됨 | 비밀번호의 `@` `#` `/` 를 URL 인코딩하지 않았습니다 (`%40` `%23` `%2F`) |
| 한동안 방치한 뒤 DB가 전부 에러 | Supabase 프로젝트가 **7일 무활동으로 일시정지**됐습니다. 대시보드에서 복구하고 keepalive 워크플로가 도는지 확인하세요 |

---

## 참고: 파일 이름 규칙

Next.js가 읽는 순서 때문에 파일 이름이 중요합니다.

| 파일 | `npm run dev` | `next build/start` | 커밋 |
|---|---|---|---|
| `.env.local` | ✅ 읽음 | ✅ 읽음 | ❌ |
| `.env.production.local` | ❌ 무시 | ✅ 읽음 | ❌ |
| `.env.example` | ❌ | ❌ | ✅ (값 없는 견본) |

마이그레이션을 배포 DB에 적용할 때 `.env.production.local` 로 받는 이유가 이것입니다 —
`npm run dev` 에는 영향을 주지 않으면서 스크립트에만 넘길 수 있습니다.

```bash
vercel env pull .env.production.local
npm run db:migrate -- .env.production.local
```

> 평소에는 이렇게 할 필요가 없습니다. 배포 DB 마이그레이션은 GitHub Actions의 `Migrate`
> 워크플로가 대신합니다 ([deploy.md](deploy.md) 6번). 위 방법은 폴백입니다.
