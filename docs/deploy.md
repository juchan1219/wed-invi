# 배포 가이드 — 그대로 따라 하면 됩니다

Vercel + Supabase + Blob, 전부 무료. 카드 등록 필요 없습니다. 처음이면 **30분쯤** 걸립니다.

준비물: GitHub 계정, [Vercel 계정](https://vercel.com/signup),
[Supabase 계정](https://supabase.com/dashboard), [카카오 개발자 계정](https://developers.kakao.com)

전체 순서는 이렇습니다.

```
1. Vercel에 프로젝트 올리기        ← 환경변수 없이도 배포는 성공합니다
2. Supabase(DB) 만들어 연결        → 연결 문자열 2개를 직접 등록  ⚠️ 자동 주입이 없습니다
3. Blob(이미지 저장소) 만들기       → BLOB_READ_WRITE_TOKEN 자동 주입  ⚠️ Public 필수
4. 나머지 환경변수 4개 직접 등록
5. 재배포
6. DB 테이블 만들기 (마이그레이션) → GitHub Actions 워크플로
7. Keepalive 켜기                  ⚠️ 안 하면 7일 뒤 DB가 잠듭니다
8. 카카오톡 공유 설정
9. 확인
```

---

## 1. Vercel에 프로젝트 올리기

1. [vercel.com/new](https://vercel.com/new) 접속
2. **Import Git Repository** 에서 `juchan1219/wed-invi` 옆 **Import** 클릭
   - 목록에 없으면 **Adjust GitHub App Permissions** → 저장소 접근 허용
3. Framework Preset이 **Next.js** 로 자동 인식됩니다. 나머지는 건드리지 말고 **Deploy**
4. 2~3분 뒤 배포 완료. 축하 화면의 주소(`https://wed-invi-xxxx.vercel.app`)를 열어보면
   **청첩장이 이미 보입니다**

> 이 시점엔 DB가 없어서 `/admin`은 아직 동작하지 않습니다. 정상입니다.
> 배포 주소는 나중에 계속 쓰니 메모해 두세요.

---

## 2. Supabase 연결 (데이터베이스)

편지·방명록이 저장될 곳입니다.

> ### ⚠️ 이 단계는 자동 주입이 없습니다
> Neon을 쓸 때는 Vercel이 `DATABASE_URL` 을 알아서 넣어줬지만, Supabase는 **연결 문자열을
> 직접 등록해야** 합니다. 그것도 용도가 다른 **두 개**입니다. 이번 절차에서 가장 손이 가는 곳이라
> 천천히 따라 하세요.

### 2-1. 프로젝트 만들기

1. [supabase.com/dashboard](https://supabase.com/dashboard) 로그인 → **New project**
2. 설정:
   - **Name**: 아무거나 (예: `wed-invi`)
   - **Database Password**: 생성 버튼을 쓰고 **어딘가에 복사해 두세요.** 나중에 다시 볼 수 없고,
     잊으면 재설정해야 합니다
   - **Region**: **Seoul (`ap-northeast-2`)** — 하객이 한국에서 접속합니다
   - **Plan**: **Free**
3. **Create new project** → 프로비저닝이 끝날 때까지 1~2분 기다립니다

> 무료 플랜은 **조직당 활성 프로젝트 2개**까지입니다. 이미 두 개를 쓰고 있다면 하나를
> 정지하거나 조직을 새로 만들어야 합니다.

### 2-2. 연결 문자열 두 개 복사

프로젝트 화면 상단의 **Connect** 를 누르면 접속 경로가 여러 개 나옵니다.
**두 개를 쓰고, 용도가 다릅니다.**

| 경로 | 포트 | 넣을 환경변수 | 쓰는 곳 |
|---|---|---|---|
| **Transaction pooler** | **6543** | `DATABASE_URL` | 배포된 사이트(서버리스 함수) |
| **Session pooler** | **5432** | `DIRECT_URL` | 마이그레이션·`db:generate`·`db:studio` |
| Direct connection | 5432 | 안 씀 | — |

복사한 문자열의 `[YOUR-PASSWORD]` 자리에 2-1에서 받은 비밀번호를 채워 넣습니다.

두 문자열은 **포트만 다르고 호스트·사용자·비밀번호는 같습니다.** 그래서 눈으로는 구분이 안 됩니다
— 끝의 `:6543` / `:5432` 만 보세요.

```
postgresql://postgres.[프로젝트ref]:[비밀번호]@[풀러호스트]:6543/postgres   ← DATABASE_URL
postgresql://postgres.[프로젝트ref]:[비밀번호]@[풀러호스트]:5432/postgres   ← DIRECT_URL
```

> ### ⚠️ 풀러 호스트는 **반드시 대시보드에서 복사**하세요
> 이 문서의 예시에 나오는 `aws-0-ap-northeast-2.pooler.supabase.com` 같은 주소를 리전 이름으로
> 조합해서 만들면 안 됩니다. 공식 문서가 "풀러 호스트는 조합할 수 없으니 대시보드에서 복사하라"고
> 명시합니다. 프로젝트마다 다릅니다.

> ### ⚠️ Direct connection을 쓰면 안 됩니다
> Supabase의 direct 연결은 **IPv6 전용**입니다(무료 플랜에서 IPv4는 유료 애드온).
> Vercel 함수도, GitHub Actions 러너도 IPv4라 아예 붙지 못합니다.
> 호스트가 `...pooler.supabase.com` 인 쪽(pooler)을 쓰세요 — **shared pooler는 모든 플랜에서 IPv4**입니다.
>
> 참고로 Supabase 공식 문서는 **마이그레이션에 direct 연결을 권장**합니다. 이 프로젝트가 대신
> session pooler를 쓰는 이유가 위의 IPv4 제약입니다. session 모드는 진짜 세션을 유지하므로
> DDL은 정상 동작합니다.

> ### ⚠️ 비밀번호에 `@` `#` `/` 가 있으면 URL 인코딩하세요
> 연결 문자열은 URL이라 이 문자들이 구분자로 읽혀 접속이 실패합니다.
> `@` → `%40`, `#` → `%23`, `/` → `%2F`.
> 헷갈리면 **Settings → Database → Reset database password** 에서 특수문자 없는 비밀번호로
> 다시 만드는 편이 빠릅니다.

### 2-3. Vercel 환경변수에 등록

Vercel 프로젝트 → **Settings** → **Environment Variables** → 두 개를 각각 **Add**.
Environment는 **Production / Preview / Development 모두 체크**하세요.

| Key | Value |
|---|---|
| `DATABASE_URL` | Transaction pooler 문자열 (포트 **6543**) |
| `DIRECT_URL` | Session pooler 문자열 (포트 **5432**) |

**두 값의 포트를 바꿔 넣으면** 런타임 질의나 마이그레이션 중 하나가 깨집니다. 등록한 뒤
포트 숫자를 한 번 더 확인하세요.

---

## 3. Blob 만들기 (편지에 넣을 이미지 저장소)

1. Vercel 프로젝트 화면 상단 **Storage** 탭 → **Create Database** → **Blob**
2. **Store Name**: 아무거나 (예: `wed-invi-images`)
3. **Access mode**: ⚠️ **반드시 `Public` 을 선택하세요**
4. **Region**: 하객이 있는 곳에 가까운 아시아 리전 (2번의 Seoul과 맞추면 됩니다)
5. 환경 선택: **Production / Preview / Development 전부 체크**
6. **Create** → 프로젝트에 연결

> ### ⚠️ Public을 꼭 골라야 하는 이유
> 편지 속 이미지는 하객이 로그인 없이 봐야 해서 코드가 `access: "public"` 으로 업로드합니다.
> **Private 스토어는 생성 후 Public으로 바꿀 수 없습니다.** 잘못 만들었다면 지우고 다시 만드세요.

`BLOB_READ_WRITE_TOKEN` 이 자동으로 등록됩니다.

> Blob을 건너뛰어도 됩니다. 그 경우 편지에 이미지만 못 넣고 나머지는 전부 정상 동작합니다
> (관리자 화면에서 이미지 버튼을 누르면 안내 문구가 뜹니다).

---

## 4. 나머지 환경변수 4개 등록

2번에서 넣은 두 개까지 합해 **전부 6개**가 됩니다.

터미널에서 시크릿 두 개를 먼저 만듭니다.

```bash
openssl rand -base64 32   # 첫 번째 → SESSION_SECRET
openssl rand -base64 32   # 두 번째 → TOKEN_SECRET
```

Vercel 프로젝트 → **Settings** → **Environment Variables** → 하나씩 **Add** 합니다.
Environment는 전부 **Production / Preview / Development 모두 체크**하세요.

| Key | Value | 설명 |
|---|---|---|
| `ADMIN_PASSWORD` | 직접 정한 긴 비밀번호 | 예찬·주은이 `/admin` 로그인에 씁니다. **20자 이상** |
| `SESSION_SECRET` | `openssl` 결과 1 | 로그인 쿠키 서명용 |
| `TOKEN_SECRET` | `openssl` 결과 2 | **하객 URL 생성용 (아래 경고)** |
| `NEXT_PUBLIC_SITE_URL` | `https://wed-invi-xxxx.vercel.app` | 1번에서 받은 배포 주소. **끝에 `/` 없이** |

> ### ⚠️ `TOKEN_SECRET` 은 한 번 정하면 절대 바꾸지 마세요
> 하객 URL(`/i/<토큰>`)이 이 값으로 만들어집니다. 바꾸는 순간 **이미 카톡으로 보낸 링크가 전부
> 열리지 않습니다.** 비밀번호 관리 앱 같은 곳에 따로 백업해 두세요.
>
> `ADMIN_PASSWORD`는 반대로 언제든 바꿔도 됩니다. 바꾸고 재배포하면 끝입니다.

---

## 5. 재배포

환경변수는 **다음 배포부터** 적용됩니다. 지금 배포된 것에는 반영이 안 돼 있습니다.

1. **Deployments** 탭 → 맨 위 배포의 오른쪽 **⋯** → **Redeploy**
2. **Use existing Build Cache** 체크 해제하고 **Redeploy**

---

## 6. DB 테이블 만들기 (마이그레이션)

배포된 DB는 아직 **비어 있습니다.** 테이블을 만들어야 관리자 페이지가 동작합니다.
**GitHub Actions의 `Migrate` 워크플로**가 이 일을 합니다. 노트북에 아무것도 설치하지 않아도 됩니다.

### 6-1. 저장소 시크릿 등록 (한 번만)

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**

| Name | Value |
|---|---|
| `DIRECT_URL` | 2-2에서 복사한 **session pooler (포트 5432)** 문자열 |

> 런타임용 `DATABASE_URL`(6543)을 넣지 마세요. transaction 모드에서는 DDL과 advisory lock이
> 불안정해서 마이그레이션이 실패하거나 도중에 멈출 수 있습니다.

### 6-2. 워크플로 실행

저장소 → **Actions** 탭 → 왼쪽 목록의 **Migrate** → 오른쪽 **Run workflow** → **Run workflow**

로그가 이렇게 끝나면 성공입니다.

```
  env : (환경변수)
  대상: aws-0-ap-northeast-2.pooler.supabase.com:5432
✓ 마이그레이션 적용 완료
```

**`대상:` 에 표시된 호스트가 Supabase 주소이고 포트가 `5432` 인지 확인하세요.**

다음부터는 **자동입니다.** `drizzle/` 아래 파일이 바뀐 커밋을 `main` 에 push하면 이 워크플로가
알아서 돕니다. 스키마를 바꿨다면 `npm run db:generate` 로 마이그레이션 파일을 만들어 커밋하면 끝입니다.

> ### ⚠️ 이 워크플로는 Vercel 배포와 병렬로 돕니다
> 어느 쪽이 먼저 끝날지 보장되지 않습니다. 그래서 스키마 변경은 **기존 코드가 그대로 돌아가는
> 추가(additive)** 위주로 만드세요. 컬럼 삭제·이름 변경이 필요하면 두 번에 나눠 배포합니다.

### 폴백 — 노트북에서 직접 실행

Actions가 막혔거나 급할 때는 손으로도 됩니다.

```bash
# Vercel CLI 설치 (한 번만)
npm i -g vercel

# 프로젝트 폴더에서
vercel login
vercel link                                   # 물어보면 기존 프로젝트(wed-invi) 선택
vercel env pull .env.production.local          # 배포 환경변수를 파일로 받아옴

npm run db:migrate -- .env.production.local
```

**`대상:` 이 `localhost:55432` 로 나오면** 로컬 도커 DB에 적용한 것이라 배포본에는 반영되지 않습니다.
(`.env.production.local` 에 `DIRECT_URL` 이 제대로 들어 있는지 보세요.)

> `.env.production.local` 에는 실제 비밀번호가 들어 있습니다. `.gitignore` 에 걸려 있어
> 커밋되지 않지만, 작업이 끝나면 지워도 됩니다.

---

## 7. Keepalive 켜기 (Supabase가 잠들지 않게)

Supabase 무료 플랜은 **7일간 DB 활동이 없으면 프로젝트를 일시정지**합니다. 정지되면 하객이
편지·방명록에서 에러를 보고, 사람이 대시보드에 들어가 복구해야 돌아옵니다.

`Keepalive` 워크플로가 **매일 03:00 UTC**(한국 낮 12시)에 `/api/health` 를 두드려
이 일이 일어나지 않게 막습니다. Supabase가 안내하는 "최근 일주일 동안 매일 몇 차례의 요청"에
가깝게 유지하기 위한 주기입니다.

### 7-1. 저장소 Variable 등록

시크릿이 아니라 **Variable** 입니다. 비밀이 아니고, 눈으로 확인·수정할 수 있어야 하니까요.

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** →
**Variables** 탭 → **New repository variable**

| Name | Value |
|---|---|
| `SITE_URL` | `https://wed-invi-xxxx.vercel.app` — 1번의 배포 주소. **끝에 `/` 없이** |

### 7-2. 한 번 수동으로 돌려서 확인

**Actions** 탭 → **Keepalive** → **Run workflow**. 초록색(✓)이면 끝입니다.

로그 마지막에 `✓ DB가 응답했습니다.` 가 나오면 사이트를 넘어 **DB까지** 살아 있다는 뜻입니다.
빨간색이면 `SITE_URL` 오타 · `DATABASE_URL` 미등록이나 포트 오류(2-3번) · 재배포 안 함(5번)
중 하나입니다.

이후 keepalive가 실패하면 워크플로가 red가 되고 GitHub이 메일을 보냅니다. **그 메일을 무시하지 마세요.**

> 🚨 **이 저장소는 public 이라 GitHub의 "60일 무활동 시 schedule 자동 비활성화" 정책 대상입니다.**
> (2026-10-08 정정 — 이전에는 private이라 대상이 아니라고 적혀 있었습니다.)
> 60일 공백 → cron 중지 → 7일 뒤 Supabase 정지 → 편지·방명록 사망. 예식 전까지 공백을 만들지 마세요.
> 커밋 1개나 **Run workflow** 수동 실행으로도 활동이 인정됩니다.
> 매월 1일 최근 실행이 green인지 확인하고, 실패 메일은 당일 처리하세요.
> `/api/health`가 503이면 Supabase에서 **Resume**한 뒤 **Run workflow**를 다시 누릅니다.

---

## 8. 카카오톡 공유 설정

1. [developers.kakao.com](https://developers.kakao.com) 로그인 → 우상단 **내 애플리케이션**
2. **애플리케이션 추가하기**
   - 앱 이름: `예찬♥주은 청첩장`
   - 사업자명: 본인 이름
3. 만든 앱 클릭 → 왼쪽 메뉴 **앱 키** → **JavaScript 키** 복사
4. Vercel → Settings → Environment Variables → **Add**
   - Key: `NEXT_PUBLIC_KAKAO_JS_KEY`
   - Value: 복사한 JavaScript 키
   - Environment: 전부 체크
5. 카카오 앱 화면으로 돌아와 왼쪽 메뉴 **플랫폼** → **Web 플랫폼 등록**
   - 사이트 도메인: `https://wed-invi-xxxx.vercel.app` (1번의 배포 주소)
6. Vercel에서 **다시 Redeploy** (5번과 같은 방법)

> ### ⚠️ 5번(도메인 등록)을 빼먹으면 공유 버튼이 동작하지 않습니다
> 가장 흔한 실수입니다. 키만 넣고 도메인을 등록 안 하면 버튼을 눌러도 아무 일도 안 일어납니다.

카카오 **로그인 활성화는 필요 없습니다.** 공유하기는 로그인 없이 동작합니다.

키를 안 넣으면 카카오톡 버튼만 숨겨지고, OS 공유·링크 복사는 그대로 씁니다.

---

## 9. 확인

브라우저에서:

| 주소 | 기대 결과 |
|---|---|
| `https://<도메인>/` | 청첩장이 보인다 |
| `https://<도메인>/admin` | 로그인 화면 → `ADMIN_PASSWORD` 로 들어가진다 |
| `https://<도메인>/api/health` | `{"ok":true}` — DB까지 연결됐다는 뜻 (`ok:false` 면 `DATABASE_URL` 문제입니다. 2-3번) |

그다음 **자기 자신에게 편지를 하나 써보세요.**

1. `/admin` → **편지 쓰기** → 본인 이름 + 본인 번호 뒷 4자리 → 아무 내용
2. **저장** → 발급된 URL을 **카카오톡 나에게 보내기**로 전송
3. 확인할 것: 링크 미리보기 이미지·제목이 뜨는가 / 링크를 열면 편지가 보이는가

마지막으로 [todo.md](todo.md) 의 **실기기 확인 목록**을 폰에서 한 번씩 눌러보세요.
지도 버튼과 복사 기능은 실제 폰에서만 검증됩니다.

---

## 10. 커스텀 도메인 — `주은예찬.com`

가비아에서 구입한 **`주은예찬.com`** 을 붙입니다.

### 한글 도메인이라 먼저 알아야 할 것

DNS는 ASCII만 이해하므로 한글 도메인은 **퓨니코드**로 변환되어 처리됩니다.

```
주은예찬.com  →  xn--2j5b9vb2blxf.com
```

**Vercel과 카카오 개발자 콘솔에는 퓨니코드 형태로 입력하세요.** 가비아 DNS 화면에서도
퓨니코드로 표시될 수 있습니다.

> ### ⚠️ 이것부터 확인하세요 — 인증서가 안 나올 수 있습니다
> Vercel에서 **한글 IDN 도메인의 SSL 인증서 발급이 `Generating SSL Cert` 상태로 멈추는**
> 사례가 보고돼 있습니다. 하객에게 링크를 보내기 **한참 전에** 붙여서 인증서가 정상 발급되는지
> 확인하세요. 안 되면 대안을 찾을 시간이 필요합니다.
>
> `*.vercel.app` 주소는 계속 살아 있으므로 최후 폴백은 있습니다.

### 절차

1. Vercel → 프로젝트 → Settings → **Domains**에서 루트와 `www` 퓨니코드 도메인을 추가합니다.
   이 프로젝트는 루트를 `www`로 308 리디렉션하고 `www`를 Production에 연결했습니다.
2. Cloudflare의 사용할 계정에 `주은예찬.com`을 추가하고, **Vercel 화면에 뜨는 값을 그대로**
   루트(`@`)와 `www` CNAME으로 등록합니다. 둘 다 **DNS only**로 둡니다.
   - 현재 프로젝트에서 확인한 대상: `e74cec6c5b12c324.vercel-dns-017.com`
   - 이 값은 프로젝트마다 달라질 수 있으므로 새로 연결할 때는 다시 확인합니다.
3. 가비아 → 도메인 관리 → 네임서버 설정에서 Cloudflare가 배정한 두 네임서버로 교체합니다.
   현재 배정값은 `elaine.ns.cloudflare.com`, `sonny.ns.cloudflare.com`입니다.
4. Cloudflare가 **Active**가 된 뒤 Vercel Domains 화면과 실제 HTTPS 응답을 함께 확인합니다.
   2026-09-30 `www` 200, 루트 → `www` 308, SSL 발급을 확인했습니다.

### 연결 후 세 곳을 반드시 함께 갱신

| 곳 | 넣을 값 | 이유 |
|---|---|---|
| Vercel 환경변수 `NEXT_PUBLIC_SITE_URL` | `https://주은예찬.com` (한글) | OG 태그는 코드가 자동으로 퓨니코드로 바꿔 내보내고, **공유·링크 복사에는 한글 주소가 그대로** 나갑니다 |
| GitHub 저장소 Variable `SITE_URL` | `https://xn--2j5b9vb2blxf.com` (퓨니코드) | curl이 쓰는 값이라 확실한 쪽으로 |
| 카카오 개발자 → 플랫폼 → Web | **퓨니코드와 한글 둘 다** 등록 | 어느 형태로 매칭하는지 확인되지 않아, 되는 쪽이 살아남게 |

그리고 **Redeploy** — 환경변수는 다음 배포부터 적용됩니다.

> 옛 주소(`*.vercel.app`)도 계속 살아 있으면 `SITE_URL`을 안 바꿔도 keepalive는 green이라
> 빼먹은 걸 알아채기 어렵습니다.

> ### 실기기에서 확인할 것
> **카카오톡 공유가 한글 도메인에서 동작하는지**는 실제로 눌러봐야 압니다.
> `Kakao.Share.sendDefault({url})` 의 도메인이 콘솔에 등록된 사이트 도메인과 맞아야 하는데,
> 한글/퓨니코드 매칭 동작이 확인되지 않았습니다.
> 안 되면 `NEXT_PUBLIC_SITE_URL` 만 퓨니코드로 바꾸면 됩니다 — 코드 수정은 필요 없습니다.

---

## 그 뒤로는

`main` 브랜치에 push하면 Vercel이 알아서 배포합니다.

```bash
git add -A
git commit -m "인사말 문구 수정"
git push
```

사진을 바꿨다면 `npm run photos:prep` 을 먼저 돌리고, 생성물까지 함께 커밋하세요
(`src/assets/photos/` 와 `public/og.jpg` 는 커밋 대상입니다).

같은 push에서 GitHub Actions도 함께 돕니다 — `CI` 가 타입 검사와 테스트를, `drizzle/` 이
바뀌었으면 `Migrate` 가 배포 DB에 마이그레이션을 적용합니다. **배포 자체는 Actions가 아니라
Vercel이 합니다.**

---

## 안 될 때

| 증상 | 원인과 해결 |
|---|---|
| **빌드가 `TypeError: Invalid URL` 로 실패** (`Failed to collect page data for /_not-found`) | 환경변수를 **이름만 등록하고 값을 비워둔** 것이 있습니다. 특히 `NEXT_PUBLIC_SITE_URL`. 값을 채우거나 **변수 자체를 지우세요.** (코드는 빈 값을 폴백 처리하도록 고쳤지만, 값 없는 변수는 애초에 만들지 않는 게 낫습니다) |
| `/admin` 에서 500 에러 | 마이그레이션(6번)을 안 했거나 로컬 DB에 실행했습니다. `대상:` 호스트를 확인하고 다시 실행 |
| 한동안 방치한 뒤 편지·방명록이 전부 에러 | **Supabase 프로젝트가 일시정지**됐습니다(7일 무활동). 대시보드에서 복구(Resume) 후, keepalive 워크플로가 왜 안 돌았는지 확인하세요 — cron이 비활성화됐을 가능성이 큽니다(7번) |
| 배포는 됐는데 편지·방명록만 죽음 | `DATABASE_URL` 이 없거나 포트가 틀렸습니다. 런타임은 **transaction pooler(6543)** 여야 합니다(2-3번). `/api/health` 가 `ok:false` 면 여기입니다 |
| 마이그레이션이 실패하거나 도중에 멈춤 | `DIRECT_URL` 에 transaction pooler(6543)를 넣었을 수 있습니다. **session pooler(5432)** 로 바꾸세요 |
| 연결이 비밀번호 오류로 거부됨 | 비밀번호의 `@` `#` `/` 를 URL 인코딩하지 않았습니다(`%40` `%23` `%2F`). 특수문자 없는 비밀번호로 재설정하는 게 빠릅니다 |
| 로그인이 안 됨 | `ADMIN_PASSWORD` 등록 후 **재배포(5번)** 를 안 했을 가능성. 환경변수는 다음 배포부터 적용됩니다 |
| 카카오톡 버튼이 안 보임 | `NEXT_PUBLIC_KAKAO_JS_KEY` 미등록. 키가 없으면 버튼을 아예 숨깁니다 |
| 카카오톡 버튼을 눌러도 반응 없음 | 카카오 개발자 → 플랫폼 → **사이트 도메인 미등록** (8-5번) |
| 카톡 링크 미리보기 이미지가 안 뜸 | [캐시 초기화 도구](https://developers.kakao.com/tool/clear/og)에 URL 입력. 카카오는 미리보기를 일정 시간 캐싱합니다 |
| 미리보기에 옛날 이미지가 뜸 | 위와 동일. `og.jpg` 를 바꿨다면 캐시 초기화가 필요합니다 |
| 편지 이미지 업로드 실패 | Blob 스토어가 **Private** 로 만들어졌을 수 있습니다(3번). 지우고 Public으로 다시 생성 |
| 하객 URL이 갑자기 안 열림 | `TOKEN_SECRET` 이 바뀌었습니다. 백업해 둔 원래 값으로 되돌리세요 |

---

## 무료 티어 한도

| 항목 | 한도 | 청첩장 실사용 |
|---|---|---|
| Vercel 대역폭 | 100 GB/월 | 하객 300명 기준 여유 |
| Vercel 이미지 변환 | 5,000회/월 | 사진 40장 기준 약 500회 |
| Vercel Blob | 1 GB 저장 · 10 GB/월 전송 | 편지 이미지는 업로드 전 1600px로 줄입니다 |
| Vercel 배포 | 100회/일 | push 단위라 여유 |
| Vercel 빌드 | 6,000분/월 | 한 번에 2~3분 |
| Supabase DB | 500 MB | 편지·방명록은 텍스트라 거의 안 씁니다 |
| Supabase 전송(egress) | 5 GB/월 | 하객 트래픽은 Vercel이 받고, DB는 질의만 오갑니다 |
| Supabase 파일 저장소 | 1 GB | **안 씁니다** — 이미지는 Vercel Blob에 올립니다 |
| Supabase 활성 프로젝트 | 조직당 2개 | 청첩장 하나면 충분합니다 |

Vercel Hobby 플랜은 **개인·비상업 용도** 한정입니다. 청첩장은 여기에 해당합니다.

### Supabase에는 한도 말고 시간 제약이 하나 더 있습니다

무료 플랜은 **7일간 DB 활동이 없으면 프로젝트를 일시정지**합니다. 삭제는 아니고 데이터는
그대로 남지만, 사람이 대시보드에서 복구(Resume)해야 다시 열립니다.
(현재 정책상 대시보드에서 복구할 수 있습니다.)

7번의 `Keepalive` 워크플로가 매일 `/api/health` 를 호출해 이 정지를 막습니다.
따라서 **신경 쓸 것은 딱 하나** — 매월 한 번 최근 실행이 green인지 확인하고 실패 메일을
당일 처리하는 것입니다.

GitHub Actions 분은 **이 저장소에서는 무제한**입니다 — public 저장소의 표준 러너는 무료입니다
(2026-10-08 정정: 이전에는 "private이라 월 2,000분"으로 적혀 있었습니다. private Free 플랜이 2,000분입니다).
CI가 `npm run build` 를 돌리지 않는 이유는 분을 아끼기 위해서가 아니라, Vercel이 이미 하는 빌드를
두 번 하면서 피드백만 늦어지기 때문입니다.
