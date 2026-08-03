<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 이 프로젝트에 대해

예찬 ♥ 주은 모바일 청첩장. 하객마다 다른 URL을 발급해 개인화된 편지를 보여주는 것이 핵심 기능이다.

설치·배포·사용법은 [README.md](README.md)에 있다. 이 문서는 **코드를 고치기 전에 알아야 할 것**만 적는다.

---

## 먼저 실행해 보기

```bash
npm install
cp .env.example .env.local          # 값 채우기 (아래 참고)
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run dev
```

`.env.local`에 최소한 이 넷은 채워야 한다:

```bash
DATABASE_URL="postgres://postgres:postgres@db.localtest.me:4444/wedinvi"
ADMIN_PASSWORD="아무거나"
SESSION_SECRET="$(openssl rand -base64 32)"
TOKEN_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

> ⚠️ **이미 배포된 프로젝트라면 시크릿을 새로 만들지 말 것.**
> `TOKEN_SECRET` 이 배포본과 다르면 이미 하객에게 나간 URL이 전부 열리지 않는다.
> `vercel env pull .env.local` 로 받아오고 `NEXT_PUBLIC_SITE_URL` 만 localhost로 고친다.
> 변수별 상세와 상황별 가이드는 [docs/env.md](docs/env.md).

- 청첩장 `/` · 개인화 청첩장 `/i/<토큰>` · 관리자 `/admin`
- 사진이 없으면 "사진을 넣어주세요" 안내가 뜨는 게 정상이다 (`npm run photos:prep`)

---

## Next.js 16에서 달라진 것 (이 프로젝트가 실제로 밟은 지점)

| 항목 | 내용 |
|---|---|
| `middleware.ts` → **`proxy.ts`** | 함수 이름도 `proxy`. 런타임은 nodejs 고정이라 `node:crypto`를 쓸 수 있다 |
| `params` / `searchParams` | **Promise**다. `await props.params` |
| 라우트 타입 | `PageProps<"/i/[token]">`. 새 라우트를 만들면 `npx next typegen` |
| `images.qualities` | 기본값이 `[75]`로 제한됐다. 다른 값을 쓰려면 `next.config.ts`에 등록해야 한다 |
| `images.minimumCacheTTL` | 기본 4시간 |
| Turbopack | dev·build 모두 기본. `--turbopack` 플래그 불필요 |

---

## 아키텍처에서 헷갈리기 쉬운 곳

### 청첩장 `/` 와 `/i/[token]` 은 같은 컴포넌트다

[`Invitation.tsx`](src/components/invitation/Invitation.tsx)를 둘 다 쓰고, 차이는 `letterSlot` prop 하나뿐이다.
섹션을 추가할 땐 여기만 고치면 양쪽에 반영된다.

**편지가 없을 때 404를 내면 안 된다.** 잘못된 토큰·미등록 하객·편지 0통은 전부
"편지 섹션 없는 평범한 청첩장"으로 떨어진다. 하객이 에러 화면을 보는 것보다 낫기 때문이다.

### 편지 미리보기와 실제 화면은 컴포넌트를 공유한다

[`LetterMarkdown.tsx`](src/components/letter/LetterMarkdown.tsx) 하나를 청첩장과 관리자 에디터가 같이 쓴다.
**여기를 고치면 양쪽이 같이 바뀐다** — 그게 의도다. 따로 만들지 말 것.

`rehype-sanitize`는 절대 빼지 말 것. 편지 본문의 raw HTML이 그대로 렌더되면 XSS 경로가 된다.

### 하객 URL 토큰

`HMAC(TOKEN_SECRET, "정규화된이름|뒷자리4")` → base64url 앞 12자. [`src/lib/token.ts`](src/lib/token.ts)

- 같은 입력 → 항상 같은 URL (재발급이 안정적)
- 이름의 공백 차이(`홍 길동`/`홍길동`)는 정규화로 흡수한다. 이게 없으면 같은 하객에게 URL이 두 개 발급된다
- **`TOKEN_SECRET`을 바꾸면 배포된 URL이 전부 죽는다.** 절대 로테이션하지 말 것

### 사진 파이프라인

```
photos/          원본 (git 제외)
  ↓ npm run photos:prep   ← sharp: EXIF 회전 반영, 긴 변 2400px, 메타 제거
src/assets/photos/  축소본 + manifest.ts (자동 생성, 커밋 대상)
public/og.jpg       1200×630 (자동 생성, 커밋 대상)
  ↓ next/image (정적 import)
브라우저          AVIF/WebP + srcset + blurDataURL
```

`manifest.ts`는 **생성물이다. 직접 고치지 말 것.** 파일 이름 규칙(`hero` / `gallery-NN` / `map` / `og`)은
[`scripts/prep-photos.ts`](scripts/prep-photos.ts) 상단 주석에 있다.

편지에 첨부하는 이미지는 파일명에 크기를 박는다 (`letters/<uuid>-1200x900.jpg`).
원격 이미지는 `next/image`가 크기를 모르는데, 파일명에서 읽어오면 레이아웃이 밀리지 않는다.
→ `addRandomSuffix`를 켜면 확장자 앞에 무작위 문자열이 끼어 이 규칙이 깨진다. 켜지 말 것.

### 관리자 인증

`ADMIN_PASSWORD` 하나를 예찬·주은이 공유 → HMAC 서명 쿠키 30일. [`src/lib/auth.ts`](src/lib/auth.ts)

**"내가 예찬인지 주은인지"는 로그인이 아니라 chip으로 고른다.** localStorage에 저장되어
목록·작성·수정 화면에서 유지된다. [`AuthorChip.tsx`](src/components/admin/AuthorChip.tsx)

서버리스라 로그인 시도 횟수 제한을 메모리에 둘 수 없다. 방어선은 비밀번호 길이뿐이다.

### 로컬 DB에 Neon 프록시를 쓰는 이유

프로덕션은 Neon serverless 드라이버(**HTTP**)로 붙는다. 평범한 Postgres는 HTTP를 못 알아들어서
`docker-compose.dev.yml`이 중계 프록시를 함께 띄운다. 덕분에 **로컬에서도 배포와 똑같은 코드 경로**를 탄다.
[`src/db/index.ts`](src/db/index.ts)의 `configureLocalProxy`는 호스트가 `db.localtest.me`일 때만 동작한다.

`drizzle-kit push`는 websocket으로 붙어서 이 프록시와 맞지 않는다. **`db:generate` + `db:migrate`를 쓸 것.**

---

## 실수하기 쉬운 지점

- **개인화 URL을 공유 버튼에 넣지 말 것.** 청첩장 하단 "공유하기"는 항상 기본 주소(`/`)를 보낸다.
  현재 주소를 쓰면 하객이 자기 편지 링크를 남에게 전달하게 된다. [`ShareFooter.tsx`](src/components/invitation/ShareFooter.tsx)
- **OG 태그에 수신자 이름을 넣지 말 것.** 같은 이유다. 개인화 문구는 관리자가 카톡 공유를 보낼 때
  `Kakao.Share.sendDefault`의 title에만 들어간다.
- **`htmlLimitedBots: /.*/`를 지우지 말 것.** 카카오톡 스크래퍼는 Next의 기본 봇 목록에 없어서,
  streaming metadata가 켜져 있으면 링크 미리보기가 비어 보일 수 있다.
- **`Reveal` 컴포넌트의 `rootMargin: "100000px ..."`을 줄이지 말 것.**
  IntersectionObserver는 교차 비율이 threshold를 넘을 때만 콜백을 부른다. 앵커 이동이나 뒤로가기
  스크롤 복원처럼 요소가 화면 아래(비율 0)에서 위(비율 0)로 건너뛰면 콜백이 **아예 안 불려서**
  섹션이 영구히 opacity 0으로 남는다. root를 위로 크게 늘려 이 구멍을 막았다.
- **`npm audit fix --force` 금지.** `postcss`·`sharp`·`esbuild` 경고는 Next.js와 drizzle-kit이 물고 있는
  빌드 도구의 것이다. force를 실행하면 Next.js가 9.x로 다운그레이드된다.
- **날짜는 반드시 `Asia/Seoul`로 포맷할 것.** 서버는 UTC, 하객은 어디에 있을지 모른다.
  [`src/lib/date.ts`](src/lib/date.ts)의 헬퍼를 쓰고 `new Date().toLocaleString()`을 직접 부르지 말 것.

---

## 작업 후 확인

```bash
npm run typecheck && npm run build
```

그리고 **요구사항 대조와 문서 갱신은 생략하지 않습니다.**
[docs/todo.md](docs/todo.md)의 체크박스와 [docs/requirements.md](docs/requirements.md)의 구현 매핑을
갱신한 뒤에 완료를 보고하세요. 자세한 절차는 [CLAUDE.md](CLAUDE.md)에 있습니다.

**실기기에서만 검증되는 것** — 개발 환경이나 데스크톱 브라우저로는 확인할 수 없다:
지도 앱 딥링크, 클립보드 복사, `navigator.share`, 카카오톡 공유·링크 미리보기, `.ics` 캘린더 연결.
README 하단의 체크리스트를 볼 것.

## 콘텐츠만 바꾸고 싶다면

코드를 볼 필요 없다. [`src/config/wedding.ts`](src/config/wedding.ts) 한 파일에 이름·일시·장소·좌표·계좌·인사말이 전부 있다.
작성자 이름(예찬·주은)은 [`src/config/admins.ts`](src/config/admins.ts).
