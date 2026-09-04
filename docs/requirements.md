# 최초 요구사항과 구현 현황

이 프로젝트가 왜 이렇게 만들어졌는지 남겨두는 문서입니다. 기능을 고치거나 뺄 때
"이건 원래 왜 있었나"를 여기서 확인하세요.

## 배경

시중 모바일 청첩장 서비스에 없는 두 가지가 필요해서 직접 만들었습니다.

1. **하객별 개인화 편지** — 하객마다 다른 URL을 발급하고, 그 사람에게 쓴 손편지를 보여준다
2. **사진 서빙 최적화** — 스튜디오 원본을 그대로 올리면 모바일에서 수 MB씩 내려받게 된다

비용은 전부 무료 티어 안에서 해결하는 것이 조건이었습니다.

---

## 요구사항 → 구현 매핑

### 1. 최적화된 사진 서빙 ✅

| 요구 | 구현 |
|---|---|
| 사진 용량 최적화 | `npm run photos:prep`(sharp) — EXIF 회전 반영, 긴 변 2400px, 메타데이터 제거 |
| 포맷·해상도 최적화 | `next/image` 정적 import → AVIF/WebP 자동 변환 + `srcset` + `blurDataURL` |

검증: `Accept` 헤더별로 AVIF 960B / WebP 1916B / JPEG 3656B 응답 확인.
Vercel 무료 한도(월 5,000회 변환) 대비 실사용 500회 안팎.

### 2. URL로 수신자를 구분하는 개인화 편지 ✅

| 요구 | 구현 |
|---|---|
| "이름+휴대폰 뒷 4자리"를 인코딩한 URL | `HMAC(TOKEN_SECRET, "이름\|뒷자리4")` → base64url 12자 → `/i/<토큰>` |
| 마크다운 렌더링 | `react-markdown` + `remark-gfm`, `rehype-sanitize`로 XSS 차단 |
| 이미지도 렌더링 | Vercel Blob 업로드 → 파일명에 크기를 박아 `next/image`로 최적화 |
| 관리자가 편지 작성 + 이름/뒷자리 입력해 저장 | `/admin/letters/new` |
| 작성 중 마크다운 프리뷰 | 작성/미리보기 탭. **청첩장과 같은 `LetterMarkdown` 컴포넌트를 공유**해 화면이 어긋나지 않음 |
| URL 발급·조회·관리 | `/admin` 목록에서 발급 URL 확인, 열람 여부 표시, 수정·삭제 |
| 관리자 2명(예찬·주은) chip으로 전환 | 헤더 chip이 목록 필터와 작성자를 함께 결정. localStorage로 화면 간 유지 |

**HMAC을 고른 이유**: 같은 입력이면 항상 같은 URL이라 하객이 링크를 잃어버려도 재발급이 안정적이고,
URL만 보고 이름을 역산하거나 다른 하객의 편지를 찍어서 열 수 없습니다.
이름의 공백 차이(`홍 길동` / `홍길동`)는 정규화로 흡수해 같은 하객에게 URL이 두 개 발급되는 사고를 막습니다.

#### 2-1. 모바일 관리자 + OS 공유 + 카카오톡 공유 ✅

- 모바일 우선 레이아웃, 공용 비밀번호 로그인(30일 세션 쿠키)
- `navigator.share`(OS 공유 시트) / `Kakao.Share.sendDefault` / 링크 복사
- 카카오톡 메시지 제목만 `"○○님, 저희 결혼합니다"`로 개인화

#### 2-2. 편지가 없으면 섹션 미노출 ✅

잘못된 토큰 · 미등록 하객 · 편지 0통 · 기본 URL — **전부 404 없이 평범한 청첩장**으로 렌더됩니다.
하객이 에러 화면을 보는 것보다 낫기 때문입니다. 7가지 경우를 검증했습니다.

### 3. 주소와 지도 ✅

- 지도 썸네일(사용자 제공 `photos/map.jpg`) + 식장명/홀/주소
- **네이버지도 / 카카오맵 / 티맵** 버튼 — 앱 스킴 우선, 1.2초 뒤 웹으로 폴백
- 주소 클립보드 복사, 예식장 전화 걸기, 교통편(지하철·버스·주차) 아코디언

### 4. 갤러리 ✅

3열 그리드 → 탭하면 전체화면 스와이프 뷰어(embla). 디자인 디테일은 직접 수정할 수 있게 마크업을 단순하게 유지했습니다.

### 5. 신랑측·신부측 계좌 복사 ✅

아코디언 2개, 항목별 복사 버튼(은행 앱에 붙여넣기 좋게 **숫자만** 복사), 카카오페이 송금 링크(선택).

### 6. 소셜 공유 미리보기 ✅

- OG 1200×630 자동 생성(`photos/og.jpg` 없으면 hero를 크롭)
- `htmlLimitedBots: /.*/` — 카카오톡 스크래퍼가 Next의 기본 봇 목록에 없어서, 스트리밍 메타데이터를 끄고 항상 `<head>`에 태그가 박히게 함
- **수신자 이름은 OG에 넣지 않음** — 링크가 제3자에게 전달돼도 이름이 노출되지 않도록

### 추가로 넣은 것 (역제안 → 채택)

- **D-day + 캘린더 저장** — 예식월 달력, 남은 일수, `.ics` 다운로드
- **방명록** — 4자리 비밀번호로 본인 삭제, 관리자 숨김/삭제
- **연락처** — 신랑·신부·혼주 전화/문자 바로가기, 고인은 자동 제외
- **영화적 스크롤 웨딩 스토리** — 레퍼런스의 71개 고유 자산·197개 트랙·538개 키프레임 구조를
  공개 번들과 브라우저에서 조사한 뒤, 기존 8개 합성 이미지의 줌·크로스페이드 방식을 전면 교체했다.
  `storyTimeline.ts`에 7개 공개 장면·7개 transcript 항목·41개 분리 레이어·100개 이상 키프레임을 선언하고,
  `useStoryTimeline.ts`가 네이티브 스크롤을 감쇠 재생 헤드로 샘플링해 transform·opacity를 직접 갱신한다.
  종이 찢김, polygon reveal, 패널 확대, 카메라 이동, 의상 매치컷, 위/아래 역재생과 큰 점프 보정을 포함한다.
  스토리는 430×932 단일 논리 모바일 좌표를 px로 샘플링하고, 레이어별 독립 `scaleX`·`scaleY`와
  `transform-origin`으로 화면 비율 차이를 흡수한다. `stageShell`의 `ResizeObserver`는 실제 shell 크기에서
  `min(width / 430, height / 932, 1)`을 CSS custom property로만 갱신해, React 재렌더 없이 고정 논리 plane을
  contain한다. 따라서 데스크톱의 여백은 크림색 종이로 남고 타임라인 좌표는 언제나 비스케일 430×932 px다.
  plane 안의 크기·오프셋·제목 drop 값도 이 논리 px/백분율만 사용하므로 바깥 viewport 단위가 다시 적용되거나
  두 번 스케일되지 않는다.
  프로포즈 3단 장면은 좌/중/우 크롭을 사용한다.
  꽃가루는 서로 다른 속도와 크기의 전·중·후경으로 나누고, 타이틀 글자와 웃음 표정도 장면별 독립 상태로 구성했다. 함부르크 프로포즈, 반지, 도쿄타워 사진은 원본을
  공개 경로에 복사하지 않고 동일 화풍의 355KB WebP 장면을 만드는 참고로만 썼다. reduced-motion에서는
  sticky를 제거하고 최종 레지스트리의 오프닝·사이드카·오피스·웃음·프로포즈·예식장·피날레 배경과 캐릭터·전경을
  장면별 정적 합성으로 읽기 순서대로 보여준다. 장면 2는 공개 cue 없이 그림만 노출하며 나머지도 승인된 cue만 표시한다.
  서버 HTML과 첫 client render는 모두 `data-motion="pending"`인 같은 비스티키 fallback이므로 hydration
  불일치나 빈 첫 프레임이 없고, layout effect가 모션 허용을 확인한 뒤에만 430×932 sticky stage·`ResizeObserver`·
  rAF timeline을 활성화한다. reduced motion이면 `height:auto`와 fallback을 계속 유지해 tall scroll/rAF를 만들지 않는다.
  JavaScript 실행 전에도 대체 화면과 건너뛰기 링크가 DOM에 존재하며, 스크린리더에는 7개 장면 전체 대본을 제공한다.
  모든 애니메이션 래스터는 `alt=""`, `aria-hidden="true"`, `tabIndex={-1}`인 장식물이고, skip link가 청첩장 본문의
  첫 interactive control보다 앞선다. 진행률의 `aria-valuenow`·`aria-valuetext`·live text는 매 프레임이 아니라
  장면 id가 바뀌는 7개 경계에서만 갱신된다. Next.js 16의 `preload`/`loading` 동시 사용 금지에 맞춰 오프닝 배경과
  첫 sidecar 캐릭터 합성만 preload하고 다른 애니메이션 이미지는 native lazy loading한다. 정적 fallback에서는 화면에
  먼저 보이는 제주 배경만 eager load하고 이후 합성 레이어는 lazy load한다.

  `codex/doodle-wedding-story` 변형의 rough checkpoint는 같은 타임라인을 유지하면서 사진풍 배경과
  사람형 캐릭터를 흰 종이·굵은 검은 선·점눈의 콩 캐릭터로 교체했다. 당시 제주·오피스·웃음·예식장·
  피날레 배경은 소수의 평면색과 삐뚤한 CSS 선화였고, 이후 아래의 최종 래스터 자산과 generic renderer로
  교체했다. 1280×720와 390×844·430×932에서 rough 오프닝·오피스·프로포즈 위치를
  실제 DOM viewport 및 PNG 크기로 확인했다. 다만 네트워크 제한으로 `npm run build`는 완료하지 못했으므로,
  production build 근거는 최종 아트로 승격하기 전의 남은 검증 항목이다.

  최종 아트 승격용 shots 1–6 자산은 2배수 430×932 배경 5개와 실제 alpha 전경 2개로 제작했다.
  오프닝·사이드카 도로·종이 전환·타워 카드·사무실 배경은 불투명 WebP, 사무실 desk는 alpha WebP,
  sidecar는 alpha PNG로 등록했으며 각 레지스트리 크기는 실제 파일 메타데이터와 테스트로 고정한다.
  41개 타임라인 레이어와 같은 순서의 선언형 renderer definition이 이 자산들을 소비하고, 이미지 크기·fit·
  focal point는 typed inline CSS custom property로 전달한다. sprite는 512px intrinsic atlas cell과 256px 논리 표시
  cell을 분리해 1024×512 표시 atlas를 정확한 row/column offset으로 이동한다. couple 레이어 하나 안에는 예찬·주은
  두 sprite를 선언형 part로 합성하고, wheel 레이어는 1024×768 sidecar에서 서로 다른 224×224 영역을 56×56으로
  crop한다. generic 선언형 parent-child layer tree가 두 wheel DOM을 sidecar 안에 각각 한 번만 렌더링하며, 기존
  `data-story-layer`와 timeline query 계약을 유지한다. wheel CSS 기준점은 sidecar contain box 안의 source crop center에서
  계산한 parent-relative 전륜 `(123.171875, 305.26828125)`와 후륜 `(383.5234375, 305.26828125)`이다. 두 wheel의
  local x/y는 0, local scale은 1이고 각 rotate track과 crop만 독립적으로 유지하므로 sidecar가 이동·확대·기울기를 단독으로
  소유한다. shots 1–6의 세부 안무는 오프닝 배경의 36px 이동, sidecar의 520→30px 진입과 두 casual sprite
  합성, 우하단 coral paper corner를 원점으로 한 0.15→2.4배 종이 확대, 0.72×0.58→1 tower card 진입,
  51%/43% 창 원점의 1→4.8배 camera zoom, 그 아래 1.35→1배 office background와 desk 연결로 구현했다.

  shots 7–16용 최종 자산은 430×932 좌·우 웃음 패널, 실제 alpha 웃음 burst, 세 개의 정확한
  430×932 크롭으로 구성된 1290×932 프로포즈 삼연작, 430×932 예식장 외부·내부, 실제 alpha
  좌·우 하객 전경과 veil/paper sweep으로 제작했다. 삼연작은 함부르크 프로포즈·실내 반지 공개·
  도쿄타워 웨딩 스냅의 사건과 콩 캐릭터 얼굴을 유지한다. 투명 전경은 새 neon-magenta source만
  chroma-key하고 nearest-opaque edge 색으로 오염을 제거했으며, 실제 크기·alpha coverage·배경 sample·
  bounds를 자산 테스트로 고정했다. 이 자산의 renderer 연결은 완료했으며
  shots 7–9는 왼쪽 joke panel의 -430→0px 진입, 오른쪽 laugh panel의 우측 polygon reveal, 독립 캐릭터
  sprite, 양 패널의 `scaleX: 0.5` 압축·합류, 중앙·무회전 handoff 상태의 0.2→1.6배 laugh burst로
  안무했다. burst ray와 proposal 삼연작 divider의 pixel-level 정렬은 unit test가 증명하지 않으며 Task 12
  브라우저/image QA에 남긴다. shots 10–12는 같은 1290×932 `proposalTriptych` DOM을 opacity 0.98 이상으로 유지한 채
  x `0→-430→-860px`로 이동하고, 가운데 반지 상자만 같은 원화의 `(464,340,248,300)` crop으로 복제해
  `0.8→1.12→1` pulse한다. 도쿄 패널은 tower 원점 기준 `1→1.8`배가 되고, `1.35`배 예식장 외부의 coral diagonal
  polygon reveal과 2% 겹친다. 원화의 venue arch x=210은 허용 오차가 아닌 source 기준점이며, 각각의 pan·origin·scale을
  적용한 handoff 좌표는 tower x=210.0, arch x=208.5로 실제 차이 1.5px다. 테스트는 이 두 변환값의 차이가 12px 이하인지 고정한다.
  diagonal wipe는 `venueExterior`를 재사용하는 clipped `venue-reveal`(stack 12)이 opaque
  `proposal-triptych`(stack 11) 위에서 progress `0.69–0.72`에만 그린다. `0.72`에서 외부가 full clip이 된 뒤
  duplicate가 꺼지고 같은 외부 underlay로 인계되므로 hard cut이 없으며, 이후 doorway reveal을 우회하지 않는다.
  `StoryLayer`가 소비하는 explicit `stack/coverage` 합성 계약에서 예식장 full interior(0) < exterior(1) < clipped
  interior doorway(2) 순서를 고정한다. full interior는 doorway가 완전히 열린 뒤에만 활성화되므로 exterior가 유지된 채
  중앙 polygon만 넓어진다. shots 1–3의 opaque `opening-field`는 shots 10–12 동안 opacity 0이라 높은 foreground stack으로
  triptych를 다시 덮지 않는다. 평상복 커플은 y `660→610px`로 문까지 실제 이동하고, 평상복·웨딩 sprite는 정확히
  progress `[0.8175, 0.8225)`의 정확한 0.5%에서만 같은 x/y/scale로 동시에 보인다.
  양쪽 하객은 `-180/+180px`에서 20px 차등 parallax로 들어오고 웨딩 커플은 y `610→470px`로 전진한다.
  마지막 veil/paper는 `(390,-180,.35)→(-40,-20,2.2)`로 쓸며 예식장 배경 clip을 중앙으로 닫아 cream canvas와
  일반 청첩장 본문 사이를 공간적으로 연결한다. 노출되는 canvas의 마지막 CSS cascade는 본문과 같은
  `var(--color-paper)`(`#fdfbf7`)를 사용한다. 390×844·430×932·1280×720 브라우저 합성 검수는
  [`2026-08-28-seven-scene-story-qa.md`](superpowers/evidence/2026-08-28-seven-scene-story-qa.md)에 기록했다. 렌더러 자체는 모든 장면을
  `next/image` 기반 장식 이미지, 정확한 sprite crop, 스크린리더 중복을 피하는 HTML text로만 구성하며 기존
  CSS 사람·건물·사이드카·군중·예식장 placeholder 분기를 제거했다.

  shots 1–9의 모든 경계와 최소 9→10 handoff는 전체 진행률 1.5% 구간에서 outgoing/incoming layer가
  각각 opacity 0.25를 넘긴다. 3→4는 paper scale, 4→5는 4.8배 camera zoom, 8→9는 polygon clip을
  사용하므로 전체 화면 opacity만 바꾸는 crossfade가 아니다. overlap 증명은 각 1.5% interval의 양 끝과 그 안의
  모든 opacity keyframe, hold discontinuity 양쪽을 검사한다. 지원 easing이 단조이므로 이 점들이 piecewise segment
  전체의 최솟값을 완전히 덮는다. 경계 전후 정방향·역방향 표본과 0.02↔0.58 직접 점프에서 실제 sequence가 반환한
  destination state는 direct baseline과 동일하다. sidecar 자식 wheel의 center를 parent origin 기준으로 scale·rotate하는
  순수 기하 검증은 progress 0.065·0.1·0.13·0.15를 고정하며, 0.15의 이전 sibling 모델 오차 10.9px 이상을 포착한다.
  shots 10–16도 각 경계의 visible spatial connector, triptych no-fade, 2% tower/venue overlap, 0.5% wardrobe overlap,
  정방향·역방향·`0.521↔0.999` 직접 점프 destination 동등성을 고정한다. proposal pan의 두 quarter-point는
  명시적 `easeInOut` 보간값을 검증한다. fallback registry/order, loading policy, pending/reduced presentation,
  shot-boundary announcement throttling, 실제 Next Image 장식/비포커스 SSR markup도 회귀 테스트로 고정한다.
  실제 `WeddingStory` SSR/mount 테스트는 pending fallback·skip target·7개 장면 transcript와 reduced-motion에서
  rAF/IntersectionObserver/ResizeObserver/scroll listener 0회, full-motion에서 containment/timeline observer 활성화를
  대조한다. SSR 테스트는 실제 CSS module 원문을 jsdom에 주입해 pending fallback의 계산된 `display:grid`와 stage의
  `display:none`까지 확인한다. 테스트 DOM은 README의 Node 20.9+ 계약을 지키는 `jsdom@26.1.0`에 exact pin했다.
  농담 장면은 말풍선 원화를 사용하지 않고 office 배경과 두 캐릭터·웃음 선만 합성하며, 렌더 가능한 HTML text는 승인된
  공개 cue allowlist로 고정한다. 반지 crop은 opaque proposal strip보다 높은 명시적 stack에서 합성한다. 같은 경로의
  브라우저 back/forward 복원은 현재 `history.state` 엔트리를 우선하고 session storage는 유효한 엔트리가 없을 때만 쓴다.
  `npm run test:story` 90개,
  `npm run typecheck`, `npm run build`를 통과했다. 최종 viewport 시각 검수와 브라우저 back/forward 복원은 같은 QA 증적에 기록했다.

  다음 검증은 이전 사진풍 scroll-story rebuild에 대한 결과다: `npm run test:story` 20개, `npm run typecheck`,
  `npm run build`, 1440×900·390×844의 주요 진행률
  스크린샷, 역스크롤·큰 점프·새로고침 복원, `/i/not-a-valid-token`, `/admin/login`, 브라우저 콘솔 오류
  0건까지 수행했다. 이 결과를 현재 doodle rough prototype의 production build 검증으로 해석하지 않는다.
  조사 근거는 `docs/scroll-story-reference-analysis.md`, 구현 계약은
  `docs/superpowers/specs/2026-08-14-scroll-wedding-story-rebuild-design.md`에 있다.
  낙서 테마의 규칙은 `docs/superpowers/specs/2026-08-14-doodle-wedding-story-theme.md`에 있다.

#### 현재 공개 스토리 계약과 검증

| 요구 | 현재 구현·검증 |
|---|---|
| 공개 서사 | 정확히 7개 장면(`jeju-opening`부터 `wedding-finale`)과 7개 transcript 항목. 장면 5는 두 순차 cue 사이의 의도된 무문구 구간을 가진다. |
| 장면 엔진 | 기존 41개 레이어 선언형 renderer와 100개 이상 keyframe이 430×932 논리 canvas를 구동한다. 종이 찢김·polygon reveal·카메라 줌·패널 확대·매치컷을 포함한다. |
| 정적 대체 | `STORY_FALLBACK_PANELS`의 7개 카드가 pending/reduced motion에서 같은 장면 순서로 렌더된다. reduced motion은 sticky·rAF·observer를 만들지 않는 자동 component/jsdom 검증으로 확인했다. 데스크톱 브라우저의 reduced-motion media emulation은 사용할 수 없었다. |
| 장소 문구 | 장면 6 문구는 `src/config/wedding.ts`의 예식 일시와 `wedding.venue.name`에서 서버·브라우저 동일하게 파생된다. |
| 복원 | 정상 scroll은 현재 history/session 기록을 보존하며, reload와 `back_forward`는 layout 완료 뒤 저장 진행률로 복원하고 늦은 browser drift 동안 persistence를 suspend한다. 42%·82% reload와 `/admin → back → forward` 0px 복원을 브라우저에서 확인했다. |
| 낙서 자산 | 기존 sidecar·두 rider·wheel crop, sprite 얼굴/비율, thick uneven ink와 colored-pencil/crayon 원화는 유지한다. scene 2 sidecar는 opaque road 위 stack으로 합성되며, `316dc3b`에서 midpoint canvas clipping을 수정해 두 인물과 두 바퀴가 논리 canvas 안에 들어온다. |
| 검증 | 390×844·430×932·1280×720의 21개 장면 표본, 경계 역방향·직접 jump·route fallback·콘솔을 QA 증적에 기록했다. scene 2 fixed recapture는 세 viewport 모두 p≈.13에서 opacity 1/z19 및 focal content 전체 노출을 확인했다. 개발 모드의 Next LCP advisory는 비차단 경고이며 애플리케이션 오류는 관찰되지 않았다. |
| 실기기 보류 | 데스크톱에서는 iOS/KakaoTalk in-app sticky 체감, 지도 앱 deep link, 클립보드, `navigator.share`, Kakao 공유·미리보기, `.ics` handoff를 검증하지 않았다. |

### 제안했으나 제외한 것

- **RSVP(참석 의사 전달)** — 논의 후 제외. 필요해지면 테이블 하나와 폼으로 추가 가능
- BGM, 화환 안내

---

## 기술 선택 근거

### Vercel + Neon (Supabase 아님)

Supabase Free는 **7일간 DB 활동이 없으면 프로젝트를 일시정지**하고 대시보드에서 수동으로
Resume해야 합니다. 청첩장은 "개발 완료 → 실제 카톡 배포"까지 2주쯤 비는 게 흔한데,
그 사이 정지되면 첫 하객이 에러를 봅니다. 한 번뿐인 이벤트라 만회할 기회가 없습니다.

Neon은 5분 후 scale-to-zero → 다음 쿼리에 ~500ms 자동 복귀라 이 실패 모드가 없습니다.
Supabase의 강점인 Auth·Realtime·Storage는 이 프로젝트에 필요가 없었고(관리자 2명·공용 비밀번호),
무료 티어에서는 이미지 변환도 Pro 전용이라 이점이 없었습니다.

### 관리자 인증을 단순하게 둔 이유

사용자가 2명이고 서버에서 세션을 강제로 끊을 일이 없습니다. 지키는 대상도 "하객 명단과 편지"
수준이라 공용 비밀번호 + 서명 쿠키로 충분합니다. 대신 **비밀번호가 유일한 방어선**이므로
길게 잡아야 합니다([todo.md](todo.md)의 알려진 제약 참고).
