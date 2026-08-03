# 모바일 청첩장

예찬 ♥ 주은 결혼식 청첩장. 하객마다 다른 URL을 발급해 **개인화된 편지**를 보여줄 수 있습니다.

- 기본 주소(`/`)는 평범한 청첩장
- `/i/<토큰>`으로 들어오면 그 사람에게 쓴 편지가 인사말 뒤에 추가로 보임
- 편지는 관리자 페이지에서 마크다운으로 작성 (이미지 첨부 가능)

| 주소 | 누가 보는가 |
|---|---|
| `/` | 하객 — 기본 청첩장 |
| `/i/<토큰>` | 하객 — 편지가 붙은 청첩장 |
| `/admin` | 예찬·주은 — 편지 관리 🔒 |
| `/admin/guestbook` | 예찬·주은 — 방명록 관리 🔒 |

청첩장 어디에도 `/admin` 링크는 없습니다. 주소를 직접 입력해야 닿고, 비밀번호가 필요합니다.

---

## 새 컴퓨터에서 시작하기 (5분)

필요한 것: **Node 20.9+**, 그리고 DB용으로 **Docker** 또는 **Neon 계정** 중 하나.

```bash
git clone https://github.com/juchan1219/wed-invi.git
cd wed-invi
npm install
cp .env.example .env.local
```

`.env.local`을 열어 최소 4개를 채웁니다. 시크릿 두 개는 이렇게 만들면 됩니다:

```bash
openssl rand -base64 32
```

```bash
DATABASE_URL="postgres://postgres:postgres@db.localtest.me:4444/wedinvi"   # 아래 Docker 방식 기준
ADMIN_PASSWORD="아무거나-길게"
SESSION_SECRET="<openssl 결과 1>"
TOKEN_SECRET="<openssl 결과 2>"        # ⚠️ 이미 배포했다면 기존 값을 그대로 써야 합니다
```

DB를 띄우고 실행합니다.

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run dev
```

http://localhost:3000 (청첩장) · http://localhost:3000/admin (관리자)

> **이미 배포한 뒤라면** `TOKEN_SECRET`은 Vercel에 등록된 값과 반드시 같아야 합니다. 다르면 이미 하객에게 보낸 URL이 전부 열리지 않습니다. `DATABASE_URL`도 Neon 주소를 그대로 쓰면 실제 편지를 로컬에서 그대로 볼 수 있습니다(그 경우 Docker는 필요 없습니다).

코드를 고칠 계획이라면 [AGENTS.md](AGENTS.md)를 먼저 읽어주세요. 구조와 함정이 정리돼 있습니다.

---

## 처음 한 번만 하는 준비

### 1. 사진 넣기

`photos/` 폴더에 원본을 넣고 아래를 실행하면, 웹용으로 줄인 사진과 OG 이미지가 자동으로 만들어집니다.

| 파일 이름 | 쓰이는 곳 |
|---|---|
| `hero.jpg` | 첫 화면 큰 사진 (없으면 갤러리 첫 장으로 대체) |
| `gallery-01.jpg`, `gallery-02.jpg`, … | 갤러리 (이름순 정렬) |
| `map.jpg` | 오시는 길 지도 썸네일 (네이버/카카오 지도 캡처) |
| `og.jpg` | 카카오톡 링크 미리보기 (없으면 `hero.jpg`를 1200×630으로 잘라 씀) |

```bash
npm run photos:prep
```

원본은 저장소에 올라가지 않고(`.gitignore`), 결과물인 `src/assets/photos/`와 `public/og.jpg`만 커밋됩니다. 사진을 바꿀 때마다 이 명령을 다시 실행하세요.

> 지금 들어 있는 사진은 레이아웃 확인용 **색 견본**입니다. `photos/`에 진짜 사진을 넣고 위 명령을 실행하면 통째로 교체됩니다. (`photos/`가 비어 있는 상태로 실행하면 사진이 전부 지워지고 "사진을 넣어주세요" 안내가 뜹니다.)

### 2. 내용 채우기

[`src/config/wedding.ts`](src/config/wedding.ts) 한 파일에 전부 모여 있습니다. `PLACEHOLDER` 주석이 붙은 곳이 반드시 바꿔야 할 값입니다.

- 신랑·신부·혼주 이름과 연락처
- 예식 일시 (`startsAt` — **반드시 `+09:00` 오프셋 포함**)
- 식장 이름·주소·**위경도 좌표** (지도 앱 연결에 쓰임)
- 계좌 목록, 인사말 문구

작성자 이름(예찬·주은)을 바꾸려면 [`src/config/admins.ts`](src/config/admins.ts)를 수정하세요.

### 3. 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 값을 채웁니다.

```bash
cp .env.example .env.local
openssl rand -base64 32   # SESSION_SECRET, TOKEN_SECRET 각각에 사용
```

> ⚠️ **`TOKEN_SECRET`은 한 번 정하면 바꾸지 마세요.** 이 값이 바뀌면 이미 하객에게 보낸 URL이 전부 무효가 됩니다.

---

## 로컬에서 실행하기

DB가 필요합니다. 두 가지 방법 중 하나를 고르세요.

**A. Neon을 그대로 쓰기 (권장, 간단함)**
[neon.com](https://neon.com)에서 무료 프로젝트를 만들고 connection string을 `DATABASE_URL`에 넣습니다.

**B. 로컬 Docker**
```bash
docker compose -f docker-compose.dev.yml up -d
```
`.env.local`에 `DATABASE_URL="postgres://postgres:postgres@db.localtest.me:4444/wedinvi"`

> 프로덕션은 Neon serverless 드라이버(HTTP)로 DB에 붙습니다. 평범한 Postgres는 HTTP를 못 알아듣기 때문에 compose가 중계 프록시를 함께 띄웁니다. 덕분에 로컬에서도 **배포와 똑같은 코드 경로**로 테스트됩니다.

그다음:

```bash
npm install
npm run db:migrate
npm run dev
```

- 청첩장: http://localhost:3000
- 관리자: http://localhost:3000/admin

---

## 배포 (Vercel + Neon, 전부 무료)

1. **저장소를 GitHub에 올리고** [vercel.com/new](https://vercel.com/new)에서 import
2. **Neon 연결** — Vercel 프로젝트 → Storage → Neon 추가. `DATABASE_URL`이 자동 주입됩니다
3. **Blob 스토어 생성** — Storage → Blob. `BLOB_READ_WRITE_TOKEN`이 자동 주입됩니다
   (없어도 배포는 되지만 편지에 이미지를 넣을 수 없습니다)
4. **나머지 환경변수 등록** — Settings → Environment Variables에 `ADMIN_PASSWORD`, `SESSION_SECRET`, `TOKEN_SECRET`, `NEXT_PUBLIC_SITE_URL`(실제 도메인)
5. **마이그레이션 실행** — 로컬 `.env.local`의 `DATABASE_URL`을 배포용 Neon 주소로 잠깐 바꾸고 `npm run db:migrate`
6. **카카오톡 공유 설정** — 아래 참고

### 카카오톡 공유 설정

1. [developers.kakao.com](https://developers.kakao.com) → 애플리케이션 추가
2. 앱 키 → **JavaScript 키**를 `NEXT_PUBLIC_KAKAO_JS_KEY`에 등록
3. 플랫폼 → Web → **사이트 도메인에 배포 주소를 등록** ← 이걸 빼먹으면 공유가 동작하지 않습니다

카카오 로그인 활성화는 필요 없습니다. 키를 넣지 않으면 카카오톡 버튼만 숨겨지고 OS 공유·링크 복사는 그대로 동작합니다.

> 링크 미리보기 이미지를 바꿨는데 카카오톡에 반영되지 않으면 [캐시 초기화 도구](https://developers.kakao.com/tool/clear/og)에서 URL을 넣어 갱신하세요.

---

## 편지 쓰고 보내기

1. `/admin`에서 로그인 (`ADMIN_PASSWORD`)
2. 헤더의 **예찬 / 주은 chip**으로 내가 누구인지 선택 — 브라우저에 기억되어 목록·작성·수정 화면에서 계속 유지됩니다
3. **편지 쓰기** → 받는 분 이름 + 휴대폰 뒷 4자리 입력 → 마크다운으로 작성 (작성/미리보기 탭 전환)
4. 저장하면 URL이 발급됩니다 → **카카오톡 / 공유 / 링크 복사** 버튼으로 전달

목록에서는 하객마다 예찬·주은 각각의 편지 유무와 열람 여부가 표시되고, `전체 / 내가 쓴 / 내가 안 쓴`으로 걸러 볼 수 있습니다.

**URL은 이름과 뒷 4자리로 만들어집니다.** 같은 값을 넣으면 항상 같은 주소가 나오므로, 하객이 링크를 잃어버려도 다시 만들어 줄 수 있습니다. 이름 표기의 공백 차이(`홍 길동` / `홍길동`)는 무시됩니다.

편지가 없거나 · 등록되지 않은 하객이거나 · 잘못된 주소면 **편지 섹션 없이 평범한 청첩장**이 열립니다. 에러 화면은 나오지 않습니다.

---

## 자주 쓰는 명령

```bash
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run typecheck      # 타입 검사
npm run photos:prep    # 사진 최적화 + OG 이미지 생성
npm run db:generate    # 스키마 변경 → 마이그레이션 파일 생성
npm run db:migrate     # 마이그레이션 적용
npm run db:studio      # DB 내용 눈으로 보기
```

---

## 배포 후 실기기 확인 목록

아래 항목은 **실제 폰에서만** 확인할 수 있습니다. 개발 환경이나 데스크톱 브라우저로는 검증이 안 됩니다.

- [ ] **지도 3종 버튼** (네이버지도 / 카카오맵 / 티맵) — iOS·Android 각각, 앱이 있을 때와 없을 때
- [ ] **카카오톡 인앱 브라우저**에서 지도 버튼 — 인앱 브라우저가 앱 스킴을 막는 경우가 있어, 웹으로 넘어가는 폴백이 도는지 확인
- [ ] **주소·계좌번호 복사** — 클립보드 API는 사용자 조작이 있는 실제 환경에서만 동작합니다
- [ ] **공유하기 버튼** (`navigator.share`) — iOS Safari / Android Chrome
- [ ] **카카오톡 공유** — 관리자 페이지에서 실제로 메시지를 보내 미리보기 이미지와 제목 확인
- [ ] **링크 미리보기** — `/`와 `/i/<토큰>`을 실제 카톡방에 보내 썸네일 확인
- [ ] **캘린더 추가** — `.ics` 다운로드가 iOS 캘린더 앱으로 넘어가는지
- [ ] **편지 이미지 업로드** — 관리자 페이지를 폰에서 열어 사진 첨부

---

## 구조

```
photos/                  사진 원본 (git 제외)
src/
  assets/photos/         photos:prep 결과물 + manifest.ts (자동 생성)
  config/
    wedding.ts           ← 청첩장 내용 전부
    admins.ts            ← 작성자(예찬·주은) 정의
  app/
    (site)/              청첩장 — / 와 /i/[token] 이 같은 컴포넌트를 공유
    admin/               관리자 (login은 헤더 없는 별도 그룹)
    api/
  components/
    invitation/          청첩장 섹션들
    letter/              LetterMarkdown ← 청첩장과 에디터 미리보기가 공유
    admin/
    ui/
  lib/
    token.ts             HMAC 기반 하객 URL
    maps.ts              지도 앱 딥링크 + 웹 폴백
    kakao.ts             카카오톡 공유 SDK (첫 클릭 때 지연 로드)
  db/                    Drizzle 스키마
  proxy.ts               관리자 영역 보호 (Next 16에서 middleware → proxy로 개명)
```

### 알아두면 좋은 것

- **사진 최적화**: 원본은 `photos:prep`이 긴 변 2400px으로 줄이고, 브라우저에는 `next/image`가 AVIF/WebP로 변환해 화면 크기에 맞는 것만 내려줍니다. Vercel 무료 한도(월 5,000회 변환)에 비해 실사용량은 500회 안팎입니다.
- **편지 미리보기 = 실제 화면**: 관리자 에디터와 청첩장이 `LetterMarkdown` 컴포넌트 하나를 공유합니다.
- **XSS 방어**: 편지 마크다운은 `rehype-sanitize`를 거칩니다. 본문에 `<script>`를 넣어도 제거됩니다.
- **개인화 URL은 공유하면 안 됩니다**: 청첩장 하단의 "공유하기"는 항상 기본 주소(`/`)를 보냅니다. 하객이 자기 편지 링크를 남에게 전달하는 사고를 막기 위해서입니다.
- **npm audit 경고**: `postcss`·`sharp`·`esbuild` 관련 경고는 모두 Next.js와 drizzle-kit이 내부적으로 물고 있는 빌드 도구의 것입니다. `npm audit fix --force`를 실행하면 Next.js가 9.x로 다운그레이드되므로 실행하지 마세요.
