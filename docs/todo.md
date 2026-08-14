# 남은 작업

기능 구현은 끝났습니다. 남은 건 **내용 채우기**, **인프라 연결**, **실기기 확인** 세 가지입니다.

## 스크롤 웨딩 스토리

- [x] 레퍼런스 사이트의 DOM·공개 번들·데스크톱·모바일 스크롤을 분석해 자산·트랙·키프레임 구조 기록
- [x] 6챕터·16숏 전면 재구축 콘티와 타임라인·자산·접근성 설계 작성
- [x] 서버·브라우저 날짜 포맷 차이로 발생하는 hydration 오류 제거
- [x] 41개 분리 레이어와 100개 이상 키프레임 기반 타임라인 구현
- [x] 종이 찢김·polygon reveal·카메라 줌·패널 확대·의상 매치컷 구현
- [x] 430×932 단일 논리 모바일 좌표·비균일 scale·transform-origin 기반 구도 구현, `ResizeObserver` CSS 변수로 viewport contain 및 내부 viewport 단위 제거
- [x] 모션 축소 설정에서 6장 정적 대체 콘텐츠 제공
- [x] JavaScript 실행 전 대체 화면·건너뛰기와 스크린리더용 16숏 전체 대본 제공
- [x] 꽃가루 전·중·후경 분리, 예식장 문 로컬 진행률, 비활성 레이어 페인트 생략 적용
- [x] 390×844와 1440×900에서 아래/위/큰 점프/스크롤 복원 시각 검수
- [x] 기본 URL·잘못된 개인화 URL·관리자 로그인 회귀 확인
- [x] hydration·runtime 콘솔 오류 0개 확인
- [x] 함부르크 프로포즈·반지·도쿄타워 실제 사진을 참고한 개인화 여정 장면 추가
- [x] 별도 브랜치에서 첨부 레퍼런스 기반 콩 캐릭터·낙서 배경·낙서 프로포즈 3컷 rough prototype 체크포인트 생성
- [x] 낙서 rough prototype의 390×844·430×932 실 viewport 오프닝·오피스·프로포즈 baseline 캡처 확보
- [x] shots 1–6 오프닝·사이드카·종이 전환·타워·사무실 풀 일러스트 제작 및 실제 크기·alpha 레지스트리 등록
- [x] shots 7–16 웃음 패널·프로포즈 삼연작·예식장·하객·veil/paper 풀 일러스트 제작 및 실제 크기·alpha 레지스트리 등록
- [x] 41개 타임라인 레이어를 선언형 정의와 레지스트리 기반 image/sprite/HTML text 렌더러에 연결하고 CSS 주요 장면 placeholder 제거 — 256px sprite 표시 cell, 두 사람 couple 합성, sidecar wheel 부분 crop 포함
- [x] shots 1–9 오프닝→사이드카→종이 코너→타워 창 줌→사무실 desk→좌우 웃음 패널을 최종 아트 위 공간형 타임라인으로 승격하고 production build 통과
- [ ] shots 10–16 프로포즈 삼연작→예식장→하객→피날레 공간형 타임라인 구현
- [ ] 최종 아트 합성본을 390×844·430×932·1280×720 브라우저에서 아래/위/큰 점프와 laugh-burst ray/삼연작 divider 정렬 포함 시각 검수
- [ ] iOS Safari와 카카오톡 인앱 브라우저에서 긴 sticky 섹션 체감 확인

조사와 새 설계: [`scroll-story-reference-analysis.md`](scroll-story-reference-analysis.md),
[`2026-08-14-scroll-wedding-story-rebuild-design.md`](superpowers/specs/2026-08-14-scroll-wedding-story-rebuild-design.md)

---

## 1. 내용 채우기 (코드 수정 없음)

### 사진 — `photos/` 에 넣고 `npm run photos:prep`

- [ ] `hero.jpg` — 첫 화면 큰 사진 (세로 사진 권장)
- [ ] `gallery-01.jpg` ~ — 갤러리 (이름순 정렬, 개수 제한 없음)
- [ ] `map.jpg` — 오시는 길 지도 캡처 (네이버/카카오 지도 스크린샷)
- [ ] `og.jpg` — 카톡 미리보기용 (생략하면 hero를 1200×630으로 잘라 씀)

> 지금 들어 있는 건 레이아웃 확인용 **색 견본**입니다.

### [`src/config/wedding.ts`](../src/config/wedding.ts) — `PLACEHOLDER` 주석이 붙은 모든 곳

- [ ] `site.title`, `site.description` — 카톡 미리보기에 그대로 뜹니다
- [ ] 신랑·신부 이름, 관계(장남/차녀 등), 전화번호
- [ ] 혼주 이름·전화번호 (고인이면 `deceased: true` → 이름 앞에 `故`, 연락처에서 자동 제외)
- [x] `ceremony.startsAt` — `"2026-12-19T12:30:00+09:00"` 반영
- [x] 잠실 아펠가모 2층 단독홀·주소·전화번호 반영
- [x] **`venue.lat` / `venue.lng`** — 한국광고문화회관 건물 중심 좌표 반영. 지도 3종 버튼이 전부 이 좌표를 씁니다. 네이버지도에서
      장소 우클릭 → "이 위치의 좌표"로 확인
- [x] 교통편 문구 (지하철·버스·주차)
- [ ] 인사말 본문
- [ ] 계좌 목록 (은행·계좌번호·예금주) — 카카오페이 송금 링크는 선택

### [`src/config/admins.ts`](../src/config/admins.ts)

- [ ] 필요하면 작성자 이름 변경 (기본: 예찬 / 주은)
      — `id`를 바꾸면 이미 저장된 편지의 `author` 값과 어긋나니 주의

---

## 2. 인프라 연결

**클릭 단위 절차는 [deploy.md](deploy.md) 에 있습니다.** 여기서는 체크리스트만.

- [ ] **GitHub → Vercel import** ([vercel.com/new](https://vercel.com/new))
      — 환경변수가 없어도 첫 배포는 성공합니다. 청첩장 화면까지는 바로 보입니다
- [ ] **Neon 연결** — Storage → Create Database → Neon → **Free** 플랜.
      `DATABASE_URL` 이 자동 주입됩니다 (직접 입력할 필요 없음)
- [ ] **Blob 스토어 생성** — Storage → Create Database → Blob.
      ⚠️ **Access mode를 반드시 `Public` 으로** — 생성 후에는 바꿀 수 없습니다.
      (건너뛰면 편지에 이미지만 못 넣고 나머지는 정상)
- [ ] **환경변수 4개 직접 등록** — `ADMIN_PASSWORD`, `SESSION_SECRET`, `TOKEN_SECRET`,
      `NEXT_PUBLIC_SITE_URL`. Production/Preview/Development 전부 체크
- [ ] **재배포** — 환경변수는 다음 배포부터 적용됩니다
- [ ] **마이그레이션 실행** — `vercel env pull .env.production.local` 후
      `npm run db:migrate -- .env.production.local`.
      출력의 `대상:` 이 Neon 호스트인지 확인할 것
- [ ] **카카오 개발자 앱** — JavaScript 키를 `NEXT_PUBLIC_KAKAO_JS_KEY` 에 등록 +
      **플랫폼 > Web > 사이트 도메인 등록** (도메인 등록을 빼먹으면 공유가 동작하지 않습니다)
- [ ] 커스텀 도메인 (선택) — 붙였다면 `NEXT_PUBLIC_SITE_URL` **과** 카카오 사이트 도메인을 함께 갱신

---

## 3. 실기기 확인 — **이 환경에서는 검증 불가**

아래는 실제 사용자 조작이 필요해 개발 환경이나 데스크톱 브라우저로는 확인할 수 없습니다.
**배포 후 반드시 폰에서 한 번씩 눌러보세요.**

- [ ] **지도 3종 버튼** — iOS / Android 각각, 앱이 **있을 때와 없을 때**
- [ ] **카카오톡 인앱 브라우저**에서 지도 버튼 — 인앱 브라우저가 앱 스킴을 막는 경우가 있습니다.
      웹으로 넘어가는 폴백(1.2초)이 도는지 확인. 안 되면 [`src/lib/maps.ts`](../src/lib/maps.ts)의
      `openMapApp` 타이밍을 조정
- [ ] **주소·계좌번호 복사** — 클립보드 API는 실제 사용자 제스처가 있어야 동작합니다
- [ ] **공유하기** (`navigator.share`) — iOS Safari / Android Chrome
- [ ] **카카오톡 공유** — 관리자에서 실제로 메시지를 보내 제목·이미지 확인
- [ ] **링크 미리보기** — `/` 와 `/i/<토큰>` 을 실제 카톡방에 보내 썸네일 확인.
      안 뜨면 [카카오 캐시 초기화](https://developers.kakao.com/tool/clear/og)
- [ ] **캘린더 추가** — `.ics`가 iOS 캘린더 앱으로 넘어가는지
- [ ] **편지 이미지 업로드** — Vercel Blob 스토어 연결 후 실제 업로드.
      *(로컬에서는 `public/uploads/` 폴백으로 전 과정을 확인했습니다 — 2400×1600 사진이
      1600×1067로 축소되고 AVIF 1.8KB로 서빙됨. 다만 **Blob에 실제로 올라가는 것**은
      스토어가 있어야 검증됩니다)*

---

## 알려진 제약 (의도한 선택)

| 항목 | 내용 |
|---|---|
| 로그인 시도 횟수 제한 없음 | 서버리스라 인스턴스가 매번 새로 떠서 메모리에 카운터를 둘 수 없습니다. **방어선은 비밀번호 길이뿐** — 20자 이상 권장 |
| 방명록 스팸 방지가 약함 | 쿠키 기반 30초 쿨다운이라 우회 가능. 문제가 생기면 관리자 화면에서 숨기거나 `wedding.guestbook.enabled = false`로 차단 |
| Vercel Hobby | "개인·비상업 용도" 한정. 청첩장은 해당됩니다 |
| `TOKEN_SECRET` 로테이션 불가 | 바꾸면 배포된 하객 URL이 전부 죽습니다 |
| 동명이인 + 같은 뒷자리 | 토큰이 겹칩니다. 관리자 목록에서 이름이 이미 있는지 확인하고, 겹치면 뒷자리 대신 다른 4자리(예: 생일)를 쓰세요 |

---

## 나중에 필요해지면 (미구현)

- **RSVP(참석 의사 전달)** — 논의 후 제외했습니다. 테이블 1개 + 폼 + 관리자 집계 화면이면 됩니다
- BGM 자동재생 — iOS는 사용자 조작 없이는 재생이 막혀 있어 토글 버튼이 필요합니다
- 화환 사절 안내 문구 — `wedding.greeting.body`에 한 줄 추가하면 끝
- 갤러리 디자인 디테일 — 마크업을 단순하게 뒀으니 Tailwind 클래스만 고치면 됩니다
