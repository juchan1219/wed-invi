# 모바일 청첩장

예찬 ♥ 주은 결혼식 청첩장. 하객마다 다른 URL을 발급해 **개인화된 편지**를 보여줄 수 있습니다.

- 기본 주소(`/`)는 평범한 청첩장
- `/i/<토큰>`으로 들어오면 춤이 끝날 즈음 "{이름}님께 편지가 왔어요" 버튼이 보이고, 누르면 접힌 편지지가 펼쳐지며 그 사람에게 쓴 편지가 나옴
  (캘린더부터는 오른쪽 위 플로팅 편지 버튼 — 안 읽었으면 레드닷, 누르면 그 편지 버튼이 있는 장면으로 이동)
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

필요한 것: **Node 20.9+**, 그리고 DB용으로 **Docker** 또는 **Supabase 프로젝트** 중 하나.

```bash
git clone https://github.com/juchan1219/wed-invi.git
cd wed-invi
npm install
```

환경변수(`.env.local`)는 저장소에 없으므로 **직접 만들어야 합니다.**
어떤 값을 어디서 구하는지는 **[docs/env.md](docs/env.md)** 에 전부 정리돼 있습니다.
상황에 따라 두 갈래입니다.

### 아직 한 번도 배포하지 않았다면

```bash
cp .env.example .env.local
openssl rand -base64 32     # 두 번 실행 → SESSION_SECRET, TOKEN_SECRET 에 각각
```

`.env.local` 을 이렇게 채웁니다.

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
DIRECT_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
ADMIN_PASSWORD="아무거나-길게"
SESSION_SECRET="<openssl 결과 1>"
TOKEN_SECRET="<openssl 결과 2>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

> DB 주소가 두 개인 이유: 앱은 `DATABASE_URL`, 마이그레이션·drizzle-kit은 `DIRECT_URL` 로 붙습니다.
> 로컬 도커에서는 **같은 값**이고, 배포(Supabase)에서만 포트가 갈립니다.

### 이미 배포한 뒤라면 — 🚨 시크릿을 새로 만들지 마세요

`TOKEN_SECRET` 이 배포본과 다르면 **이미 카톡으로 보낸 하객 URL이 전부 열리지 않습니다.**
직접 옮겨 적지 말고 Vercel에서 통째로 받아오세요.

```bash
npm i -g vercel
vercel login
vercel link                    # 물어보면 기존 프로젝트(wed-invi) 선택
vercel env pull .env.local     # 올바른 값이 전부 채워집니다
```

받은 뒤 `NEXT_PUBLIC_SITE_URL` 만 `http://localhost:3000` 으로 고칩니다.
실제 배포 DB에 붙으므로 Docker 없이 바로 `npm run dev` 하면 되고,
로컬 DB로 안전하게 작업하고 싶다면 [docs/env.md](docs/env.md) 의 **상황 C** 를 보세요.

### 실행

```bash
docker compose -f docker-compose.dev.yml up -d   # 로컬 DB를 쓸 때만
npm run db:migrate
npm run dev
```

> 로컬 DB를 쓰는데 `/admin`에서 `Failed query` 에러가 나면 Docker가 꺼져 있는 것입니다(따로 띄울 백엔드 서버는 없습니다).
> Docker Desktop을 켜고 첫 줄부터 다시 실행하세요. 끌 때는 `docker compose -f docker-compose.dev.yml stop` —
> `down`을 쓰면 다음에 새 DB로 시작해 로컬에 쓴 편지가 사라집니다.

http://localhost:3000 (청첩장) · http://localhost:3000/admin (관리자)

코드를 고칠 계획이라면 [AGENTS.md](AGENTS.md)를 먼저 읽어주세요. 구조와 함정이 정리돼 있습니다.

---

## 처음 한 번만 하는 준비

### 1. 사진 넣기

`photos/` 폴더에 원본을 넣고 아래를 실행하면, 웹용으로 줄인 사진과 OG 이미지가 자동으로 만들어집니다.

| 파일 이름 | 쓰이는 곳 |
|---|---|
| `hero.jpg` | 첫 화면 큰 사진 (없으면 갤러리 첫 장으로 대체) |
| `gallery-01.jpg`, `gallery-02.jpg`, … | 갤러리 (이름순 정렬) |
| `map.jpg` | 오시는 길 지도 썸네일 (현재는 네이버 지도 웹 캡처) |

```bash
npm run photos:prep
```

원본은 저장소에 올라가지 않고(`.gitignore`), 결과물인 `src/assets/photos/`와 `public/og.jpg`만 커밋됩니다.
OG 이미지는 갤러리 첫 장을 두 사람 중심으로 1200×630 크롭합니다. 사진을 바꿀 때마다 이 명령을
다시 실행하고, 축소본만 있는 상태에서 OG만 다시 만들 때는 `npm run og:build`를 실행하세요.

> 지금 들어 있는 사진은 레이아웃 확인용 **색 견본**입니다. `photos/`에 진짜 사진을 넣고 위 명령을 실행하면 통째로 교체됩니다. (`photos/`가 비어 있는 상태로 실행하면 사진이 전부 지워지고 "사진을 넣어주세요" 안내가 뜹니다.)

현재 지도 썸네일은 네이버 지도 웹에서 `아펠가모 잠실`을 검색해 장소 핀과 하단 NAVER 표기가 포함되도록
직접 캡처한 이미지입니다. 지도 카드 전체는 네이버지도로 연결됩니다. 장소가 바뀌면 네이버 지도 화면을 다시
캡처해 `photos/map.jpg`로 두고 `npm run photos:prep`을 실행하세요. 지도 서비스 버튼은 App Store 공식 배포본의
네이버지도·카카오맵·티맵 앱 아이콘을 로컬 자산으로 사용합니다.

### 1-1. 배경음악 준비

현재 배경음악은 제공 MP3의 49초부터 끝까지를 AAC 128kbps M4A로 변환한
`public/audio/merry-go-round-49s-128k-v1.m4a`입니다. 파일명에 변환 조건과 버전을 넣고 1년 캐시하므로,
음원을 교체할 때는 파일명 버전과 `MusicControl.tsx`·`next.config.ts` 경로도 함께 올립니다.
macOS에서는 다음처럼 다시 생성합니다.

```bash
swift scripts/prepare-audio.swift /absolute/path/to/source.mp3 public/audio/merry-go-round-49s-128k-v2.m4a
```

브라우저 정책상 소리 있는 자동재생은 차단될 수 있습니다. 앱은 진입 시 재생을 시도하고 차단되면 첫 페이지
상호작용에서 다시 시도하며, 우측 상단 음악 버튼으로 언제든 켜고 끌 수 있습니다. 공개 배포 전에는 해당 음원을
웹사이트에서 사용할 권리가 있는지 별도로 확인하세요.

### 2. 내용 채우기

[`src/config/wedding.ts`](src/config/wedding.ts) 한 파일에 전부 모여 있습니다. `PLACEHOLDER` 주석이 붙은 곳이 반드시 바꿔야 할 값입니다.

- 신랑·신부·혼주 이름과 연락처
- 예식 일시 (`startsAt` — **반드시 `+09:00` 오프셋 포함**)
- 식장 이름·주소·**위경도 좌표** (지도 앱 연결에 쓰임)
- 계좌 목록, 인사말 문구

작성자 이름(예찬·주은)을 바꾸려면 [`src/config/admins.ts`](src/config/admins.ts)를 수정하세요.

### 3. 웨딩 댄스 자산

첫 화면은 원본 참조 이미지 프레임을 canvas에 그려 GSAP ScrollTrigger로 제어합니다.
Rive 벡터 재작화는 원본 캐릭터와 다르다는 사용자 피드백으로 기본 비활성화했습니다.
64개 생성 그림을 사용해 80개 프레임 위치를 구성합니다(턴 복귀 16개는 역순 재사용).
프레임마다 같은 바닥선에 정렬하며, 얼굴 잔상이 생기는 이미지 crossfade는 하지 않습니다.
생성 이미지의 동일성·동작 품질은 최종 사용자 시각 승인 전인 시안입니다.
`pose-1.webp`~`pose-6.webp`는 모션 축소/정적 fallback 레퍼런스로 유지합니다.
새 2×3 원화로 정적 그림을 교체할 때만 아래 명령을 사용합니다.

```bash
npm run dance:prep -- /absolute/path/to/2x3-reference.png
```

이미지 시트 원본은 `assets/dance-frames/`에 보관합니다. 원본 셀이 약 313px이라 그대로 쓰면
화면에서 늘어나 선이 흐려지므로, Real-ESRGAN(anime 모델)으로 4배 키운 뒤 720px 셀로
줄여 씁니다. 그림 자체는 바꾸지 않고 선만 또렷해집니다(머리·정장의 연필 질감은 매끈해짐).

```bash
# 1회: 공식 배포본(v0.2.5.0 realesrgan-ncnn-vulkan-*-macos.zip) 압축 해제 후
REALESRGAN=/absolute/path/to/realesrgan-ncnn-vulkan npm run dance:upscale  # → assets/dance-frames/upscaled/ (git 제외, 장당 ~16MB)
npm run dance:frames   # → public/story/wedding-dance/frames/ WebP atlas 5장 (720px 셀, q50/a75, 엔딩 포함 3MB 이하)
npm run dance:ending   # → public/story/wedding-dance/frames/dance-6.webp 엔딩 그림 한 장 (assets/dance-frames/ending.png, 업스케일 불필요)
```

춤이 끝나면(마지막 장면이 시작되는 스크롤 84%부터) 엔딩 그림 한 장으로 바뀌어 멈춥니다. 정면을 보며 신랑은 한 팔로 신부를 안고
다른 팔을 들고, 신부는 부케를 든 그림입니다. `dance:ending`이 신랑 키·신발 위치·선 굵기를 춤 마지막 프레임과 같게 맞춥니다.

현재 atlas 한 장만 우선 로딩하고 마지막 4프레임에서 다음 구간을 미리 읽으며 화면에서 먼 디코딩 이미지는 해제합니다.
제작 조건과 품질 제한: [`assets/dance-frames/README.md`](assets/dance-frames/README.md).

보관한 실험용 Rive의 안무는 `scripts/dance/choreography.mjs`, 벡터 그림/본/의상 변형은
`scripts/build-dance-rive.mjs`에서 수정합니다. 공식 Rive CLI 1.0.4로 재생성:

```bash
RIVE_CLI=/absolute/path/to/rive npm run dance:build
npm run test:dance
```

생성되는 `assets/rive/wedding-dance/scene.rml`과 배포용 `.riv`를 함께 보관합니다.
Luau 스크립트를 포함하지 않아 로그인·유료 에디터·서명 없이 로컬 컴파일됩니다.
WASM은 설치된 canvas 런타임과 같은 버전을 복사해 자체 호스팅하므로 CDN이 필요 없습니다.
Rive 패키지 업데이트 후에는 `dance:build`를 다시 실행하세요.
실험용 Rive를 다시 보려면 `NEXT_PUBLIC_DANCE_RIVE_SRC=/story/wedding-dance/wedding-dance.riv`를 설정합니다.
계약은 `WeddingDance` state machine + 기본 View Model `Dance`의
`danceProgress` Number(0–100)입니다. 구식 state machine input이 아닙니다.
수정 방법과 QA: [`assets/rive/wedding-dance/README.md`](assets/rive/wedding-dance/README.md).

### 4. 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 값을 채웁니다.

```bash
cp .env.example .env.local
openssl rand -base64 32   # SESSION_SECRET, TOKEN_SECRET 각각에 사용
```

> ⚠️ **`TOKEN_SECRET`은 한 번 정하면 바꾸지 마세요.** 이 값이 바뀌면 이미 하객에게 보낸 URL이 전부 무효가 됩니다.

---

## 로컬에서 실행하기

DB가 필요합니다. 두 가지 방법 중 하나를 고르세요.

**A. 로컬 Docker (권장 — 실제 데이터를 건드리지 않습니다)**
```bash
docker compose -f docker-compose.dev.yml up -d
```
`.env.local`에 두 값을 **같게** 넣습니다.
```bash
DATABASE_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
DIRECT_URL="postgres://postgres:postgres@localhost:55432/wedinvi"
```

> 배포(Supabase)도 평범한 Postgres 프로토콜로 붙기 때문에 로컬은 Postgres 컨테이너 하나면 됩니다. 중계 프록시는 없습니다. (Neon HTTP 드라이버를 쓰던 시절에는 HTTP↔Postgres 프록시가 하나 더 있었습니다.)

**B. Supabase 프로젝트를 쓰기 (배포와 같은 환경)**
[supabase.com](https://supabase.com)에서 무료 프로젝트를 만들고(리전 **Seoul `ap-northeast-2`**),
**Connect** 에서 연결 문자열 두 개를 가져옵니다.

| 경로 | 포트 | 넣을 곳 |
|---|---|---|
| Transaction pooler | 6543 | `DATABASE_URL` |
| Session pooler | 5432 | `DIRECT_URL` |

> **Direct connection은 쓰지 마세요** — IPv6 전용이라 Vercel 함수에서 못 붙습니다.
> 비밀번호에 `@` `#` `/` 가 있으면 URL 인코딩해야 합니다(`%40` `%23` `%2F`).
>
> 무료 플랜은 **7일간 활동이 없으면 프로젝트가 일시정지**되고(데이터는 보존), 대시보드에서 복구합니다.

그다음:

```bash
npm install
npm run db:migrate
npm run dev
```

- 청첩장: http://localhost:3000
- 관리자: http://localhost:3000/admin
- 휴대폰으로 확인: 같은 와이파이에서 `http://<맥의 IP>:3000` (IP는 `ipconfig getifaddr en0`).
  Next 16은 localhost가 아닌 주소의 dev 리소스를 기본 차단하므로 `next.config.ts`의
  `allowedDevOrigins`에 사설 IP 대역을 등록해 뒀습니다. 이게 없으면 JS가 안 붙어서
  댄스 대신 정적 포즈 목록만 보입니다. 설정을 바꿨다면 dev 서버를 재시작하세요.

---

## 배포 (Vercel + Supabase, 전부 무료)

전체 절차는 **[docs/deploy.md](docs/deploy.md)** 에 있습니다. 요약하면:

1. GitHub 저장소를 [vercel.com/new](https://vercel.com/new)에서 import
2. [Supabase](https://supabase.com) 프로젝트 생성(리전 **Seoul**) → `DATABASE_URL`(transaction pooler **6543**)과
   `DIRECT_URL`(session pooler **5432**)을 Vercel 환경변수에 **직접 등록** ⚠️ 자동 주입이 없습니다
3. Storage → **Blob** 스토어 생성 (`BLOB_READ_WRITE_TOKEN` 자동 주입)
4. 환경변수 4개 등록 — `ADMIN_PASSWORD`, `SESSION_SECRET`, `TOKEN_SECRET`, `NEXT_PUBLIC_SITE_URL`
5. 저장소 Secret `DIRECT_URL` 등록 → **Migrate** 워크플로를 수동 실행해 테이블 생성
6. 저장소 Variable `SITE_URL` 등록 → **Keepalive** 워크플로를 한 번 돌려 green 확인
7. 카카오 JavaScript 키 발급 + **플랫폼 > Web > 사이트 도메인 등록**

그 뒤로는 `main`에 push하면 자동 배포됩니다. 배포는 **Vercel이** 합니다 — GitHub Actions는 배포하지 않습니다.

> ⚠️ 7번의 **도메인 등록을 빼먹으면 카카오톡 공유가 동작하지 않습니다.**
>
> ⚠️ 6번을 빼먹으면 **7일 뒤 Supabase가 일시정지**되어 편지·방명록이 죽습니다.

---

## GitHub Actions (워크플로 3개)

저장소에 워크플로 세 개가 있습니다. **배포는 하지 않습니다** — 배포는 Vercel이 `main` push마다 알아서 합니다.

| 워크플로 | 언제 도는가 | 무엇을 하는가 | 필요한 값 |
|---|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | `main` push · PR (`docs/`·`photos/`·`*.md`만 바뀐 건 제외) | 타입 검사 → 유닛 테스트 → 러너 안 Postgres에 마이그레이션 → DB 통합 테스트 | 없음 |
| [`migrate.yml`](.github/workflows/migrate.yml) | `main` push 중 `drizzle/` 변경 · 수동 실행 | 배포 DB(Supabase)에 마이그레이션 적용 | Secret `DIRECT_URL` |
| [`keepalive.yml`](.github/workflows/keepalive.yml) | 매일 03:00 UTC · 수동 실행 | `<SITE_URL>/api/health` 호출로 Supabase를 깨움 | Variable `SITE_URL` |

- CI는 **`npm run build`를 돌리지 않습니다.** Vercel이 push마다 빌드하고 실패를 알려주므로, 같은 일을 두 번 하면 Actions 한도만 먹습니다. CI의 고유 가치는 유닛 테스트와 DB 통합 테스트입니다.
- keepalive가 두드리는 `/api/health`는 DB에 `select 1`을 실행하고, 실패하면 **503**을 냅니다. `/api/guestbook`은 DB가 죽어도 하객에게 에러를 보이지 않으려고 200을 돌려주므로 keepalive 용도로 쓸 수 없습니다.
- 이 저장소는 private이므로 GitHub의 "public 저장소 60일 무활동 시 schedule 비활성화" 정책 대상이 아닙니다. 그래도 매월 한 번 최근 실행이 green인지 확인하고 실패 알림은 당일 처리하세요.

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/env.md](docs/env.md) | **환경변수** — 무엇을 어디에 넣고 어디서 구하는지, 상황별 가이드 |
| [docs/todo.md](docs/todo.md) | **남은 작업** — 채워야 할 내용, 인프라 연결, 실기기 확인 목록 |
| [docs/deploy.md](docs/deploy.md) | 배포 절차 (클릭 단위) + 안 될 때 + 무료 티어 한도 |
| [docs/requirements.md](docs/requirements.md) | 최초 요구사항과 구현 매핑, 기술 선택 근거 |
| [AGENTS.md](AGENTS.md) | 코드를 고치기 전에 읽을 것 — 구조와 함정 |

---

## 편지 쓰고 보내기

1. `/admin`에서 로그인 (`ADMIN_PASSWORD`)
2. 헤더의 **예찬 / 주은 chip**으로 내가 누구인지 선택 — 브라우저에 기억되어 목록·작성·수정 화면에서 계속 유지됩니다
3. **편지 쓰기** → 받는 분 이름 + 휴대폰 뒷 4자리 입력 → 마크다운으로 작성 (작성/미리보기 탭 전환)
4. 저장하면 URL이 발급됩니다 → **카카오톡 / 공유 / 링크 복사** 버튼으로 전달

목록에서는 하객마다 예찬·주은 각각의 편지 유무와 열람 여부가 표시되고, `전체 / 내가 쓴 / 내가 안 쓴`으로 걸러 볼 수 있습니다.

**URL은 이름과 뒷 4자리로 만들어집니다.** 같은 값을 넣으면 항상 같은 주소가 나오므로, 하객이 링크를 잃어버려도 다시 만들어 줄 수 있습니다. 이름 표기의 공백 차이(`홍 길동` / `홍길동`)는 무시됩니다.

편지가 없거나 · 등록되지 않은 하객이거나 · 잘못된 주소면 **편지 버튼 없이 평범한 청첩장**이 열립니다. 에러 화면은 나오지 않습니다.
편지가 2통(예찬·주은)이면 첫 편지지 끝의 "다음 편지"로 두 번째 편지지가 펼쳐집니다.

---

## 자주 쓰는 명령

```bash
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run typecheck      # 타입 검사
npm run photos:prep    # 사진 최적화 + OG 이미지 생성
npm run og:build       # 갤러리 첫 장으로 OG 이미지만 다시 생성
npm run dance:prep -- /path/to/reference.png # 2×3 원화를 6포즈 자산으로 분리
npm run db:generate    # 스키마 변경 → 마이그레이션 파일 생성
npm run db:migrate     # 마이그레이션 적용 (DIRECT_URL 로 붙습니다)
npm run db:studio      # DB 내용 눈으로 보기
npm run test:db        # DB 통합 테스트 (DATABASE_URL 이 없으면 건너뜁니다)
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
- [ ] **편지 열기** — iOS Safari·카카오톡 인앱에서 접힌 편지지가 3D로 펼쳐지는지(평면으로 꺼지거나 글씨가 흐리지 않은지), 열린 동안 뒤 화면이 스크롤되지 않는지, 안드로이드 뒤로가기로 편지만 닫히는지, 춤 마지막 장면의 편지 버튼이 그림을 가리지 않는지

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
