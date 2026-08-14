# Scroll Wedding Story Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예찬과 주은의 이야기를 최소 24개 분리 레이어와 100개 키프레임으로 구성된 6챕터·16숏 스크롤 애니메이션으로 전면 재구축한다.

**Architecture:** React는 시맨틱 마크업과 레이어 DOM만 렌더링한다. 순수 함수 타임라인 엔진이 전체 0~1 진행률에서 각 레이어 상태를 샘플링하고, `useStoryTimeline`이 rAF에서 transform·opacity·clip-path를 직접 갱신한다. 모바일과 데스크톱은 같은 시간축을 공유하되 좌표 트랙을 별도로 오버라이드한다.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, TypeScript, CSS Modules, requestAnimationFrame, Next Image, node:test via tsx

**Spec:** `docs/superpowers/specs/2026-08-14-scroll-wedding-story-rebuild-design.md`

## Global Constraints

- `/`와 `/i/[token]`은 계속 같은 `Invitation` 컴포넌트를 사용한다.
- 개인화 URL을 공유 버튼이나 OG 태그에 넣지 않는다.
- `TOKEN_SECRET`, 토큰 생성 로직, `rehype-sanitize`, `Reveal.rootMargin`을 변경하지 않는다.
- 날짜는 `Asia/Seoul`로 결정적으로 포맷한다.
- 스토리는 6개 챕터, 16개 숏, 최소 24개 독립 레이어와 100개 키프레임을 갖는다.
- React state를 매 애니메이션 프레임 갱신하지 않는다.
- reduced motion에서는 sticky 타임라인을 제거한다.
- 390×844 모바일과 1440×900 데스크톱을 모두 시각 검수한다.

---

### Task 1: 날짜 포맷 hydration 오류 제거

**Files:**
- Modify: `src/lib/date.ts`
- Create: `src/lib/date.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `formatCeremonyTime(): string`이 ICU의 dayPeriod 번역에 의존하지 않고 항상 `오후 12시 30분`을 반환한다.

- [ ] **Step 1: 로캘 독립 계약의 실패 테스트 작성**

```ts
test("formatCeremonyTime returns deterministic Korean meridiem text", () => {
  assert.equal(formatCeremonyTime(), "오후 12시 30분");
});
```

- [ ] **Step 2: 브라우저에서 재현한 hydration 오류를 기록하고 테스트 실패 확인**

Run: `npx tsx --test src/lib/date.test.ts`

Expected: 현재 ICU가 `PM 12시 30분`을 반환하는 환경에서는 FAIL. 테스트 환경에서 이미 통과하면 `Intl.DateTimeFormat`을 대체하는 테스트용 formatter 주입으로 `dayPeriod="PM"` 케이스를 재현한다.

- [ ] **Step 3: 서울 기준 24시간제 숫자에서 오전/오후를 직접 계산**

```ts
const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).formatToParts(ceremonyDate());
```

`hour24 < 12 ? "오전" : "오후"`와 `hour24 % 12 || 12`를 사용한다.

- [ ] **Step 4: 날짜 테스트와 기존 스토리 테스트 통과 확인**

Run: `npx tsx --test src/lib/date.test.ts src/components/invitation/story/storyCopy.test.ts`

Expected: PASS

---

### Task 2: 순수 타임라인 샘플러

**Files:**
- Create: `src/components/invitation/story/timelineMath.ts`
- Create: `src/components/invitation/story/timelineMath.test.ts`
- Modify: `src/components/invitation/story/scrollMath.ts`

**Interfaces:**
- Produces: `easeProgress`, `sampleNumberTrack`, `sampleClipTrack`, `dampedProgress`, `shouldSnapPlayhead`

```ts
export type EaseName = "linear" | "easeIn" | "easeOut" | "easeInOut" | "hold";
export type NumberFrame = { at: number; value: number; ease?: EaseName };
export type Clip = readonly [number, number, number, number, number, number, number, number];
export type ClipFrame = { at: number; value: Clip; ease?: EaseName };
```

- [ ] **Step 1: 경계·easing·hold·역방향·점프를 검증하는 실패 테스트 작성**

리터럴 기대값으로 `at=0`, 중간, `at=1`, 프레임 전후, `hold`, 역순 호출을 각각 검증한다.

- [ ] **Step 2: 테스트가 함수 부재로 실패하는지 확인**

Run: `npx tsx --test src/components/invitation/story/timelineMath.test.ts`

Expected: FAIL because exports are missing.

- [ ] **Step 3: 이진 탐색 없이 작은 프레임 배열을 선형 탐색하는 최소 구현**

트랙 길이가 수십 개 이하이므로 읽기 쉬운 선형 탐색을 사용한다. 값은 현재 프레임의 easing으로 다음 프레임까지 보간한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsx --test src/components/invitation/story/timelineMath.test.ts`

Expected: PASS

---

### Task 3: 스토리 타임라인 계약과 불변 조건

**Files:**
- Create: `src/components/invitation/story/storyTimeline.ts`
- Create: `src/components/invitation/story/storyTimeline.test.ts`
- Replace: `src/components/invitation/story/storyCopy.ts`
- Replace: `src/components/invitation/story/storyCopy.test.ts`

**Interfaces:**
- Produces: `STORY_CHAPTERS`, `STORY_SHOTS`, `LAYER_TRACKS`, `assertTimelineInvariant`

```ts
export type StoryChapter = { id: string; title: string; start: number; end: number };
export type StoryShot = { id: string; chapterId: string; start: number; end: number; copy: string };
export type LayerTrack = {
  id: string;
  x?: readonly NumberFrame[];
  y?: readonly NumberFrame[];
  scale?: readonly NumberFrame[];
  rotate?: readonly NumberFrame[];
  opacity?: readonly NumberFrame[];
  clip?: readonly ClipFrame[];
  mobile?: Partial<Omit<LayerTrack, "id" | "mobile" | "desktop">>;
  desktop?: Partial<Omit<LayerTrack, "id" | "mobile" | "desktop">>;
};
```

- [ ] **Step 1: 6챕터·16숏·24레이어·100키프레임 및 구간 연속성 실패 테스트 작성**

테스트는 정확한 배열 소스가 아니라 소비자 계약을 검사한다: 고유 ID, 오름차순, 0~1 범위, 챕터 간 틈 없음, 문구 구간 겹침 없음, 배경 불투명 구간 연속.

- [ ] **Step 2: 기존 11비트 데이터가 새 계약을 만족하지 못하는 실패 확인**

Run: `npx tsx --test src/components/invitation/story/storyTimeline.test.ts`

Expected: FAIL because new timeline exports do not exist.

- [ ] **Step 3: 6개 챕터와 16개 숏 카피를 먼저 정의**

날짜·장소는 `formatCeremonyDateShort()`, `formatCeremonyTime()`, `wedding.venue.name`에서 만든다.

- [ ] **Step 4: 레이어 트랙을 챕터 단위로 추가해 모든 불변 조건 충족**

각 레이어는 실제 DOM `data-layer` ID와 1:1로 일치한다. 장면별 페이드 대신 전환 레이어가 앞·뒤 챕터를 연결한다.

- [ ] **Step 5: 타임라인 테스트 통과 확인**

Run: `npm run test:story`

Expected: PASS

---

### Task 4: 분리형 일러스트 자산 제작

**Files:**
- Create: `src/assets/story/rebuild/*.png`
- Create: `src/assets/story/rebuild/*.webp`
- Create: `src/components/invitation/story/storyAssets.ts`
- Preserve: `public/story/*-v2.webp`

**Interfaces:**
- Produces: `STORY_ASSETS` 정적 import 레지스트리와 최소 24개 독립 레이어 자산

- [ ] **Step 1: 기존 v2 이미지를 모두 시각 검사하고 스타일·인물 불변 조건 기록**

예찬의 검은 가르마 머리·넓은 웃음, 주은의 묶은 검은 머리·가는 눈매, 브라운 수트와 화이트 드레스를 유지한다.

- [ ] **Step 2: 배경, 캐릭터 표정, 오토바이, 소품, 종이 마스크를 한 자산씩 생성**

배경은 인물·문구 없이 만들고, 움직이는 인물·오토바이·소품은 실제 투명 배경으로 생성한다. 이미지 안에 글자를 넣지 않는다.

- [ ] **Step 3: alpha, 잘린 손·바퀴, 캐릭터 일관성, 텍스트 혼입을 시각 검수**

실패 자산은 한 가지 수정만 지정해 다시 생성한다.

- [ ] **Step 4: 긴 변 2,400px 이하로 최적화하고 정적 import 레지스트리 작성**

투명도가 필요한 자산은 PNG alpha를 유지한다. 불투명 배경은 WebP로 변환한다.

- [ ] **Step 5: 자산 수와 고정 크기 계약 검사**

`storyAssets.ts`의 각 항목은 `src`, `alt`, `role`을 제공한다. 장식 자산의 alt는 빈 문자열이다.

---

### Task 5: 렌더링 셸과 full-bleed 반응형 무대

**Files:**
- Replace: `src/components/invitation/story/WeddingStory.tsx`
- Create: `src/components/invitation/story/StoryLayer.tsx`
- Create: `src/components/invitation/story/StoryFallback.tsx`
- Replace: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `src/components/invitation/Invitation.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `STORY_ASSETS`, `STORY_CHAPTERS`, `STORY_SHOTS`
- Produces: 모든 `LAYER_TRACKS.id`와 일치하는 `[data-story-layer]` DOM, `contentTargetId` 건너뛰기

- [ ] **Step 1: 타임라인 레이어와 DOM 레이어 ID가 1:1인지 검사하는 실패 테스트 작성**

렌더링 구현과 분리된 `STORY_LAYER_IDS`를 `storyAssets.ts`에서 내보내고 타임라인 테스트가 집합 동등성을 검사한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:story`

- [ ] **Step 3: SSR에서 첫 장면과 전체 읽기용 카피가 존재하는 시맨틱 셸 작성**

첫 화면은 JS 전에도 보이도록 CSS 기본값을 가진다. 모든 애니메이션 이미지는 장식이며 이야기 문구는 별도 HTML이다.

- [ ] **Step 4: 데스크톱 full-bleed와 모바일 전체 폭 무대 구현**

스토리는 `width: 100vw; margin-left: calc(50% - 50vw)`로 26rem 래퍼를 탈출하고, 본문은 기존 폭을 유지한다.

- [ ] **Step 5: reduced-motion 6장 문서 흐름 구현**

media query와 `matchMedia`가 모두 reduce일 때 sticky 높이를 제거하고 대표 컷과 문구를 순서대로 보여준다.

---

### Task 6: rAF 재생 헤드와 레이어 스타일 적용

**Files:**
- Create: `src/components/invitation/story/useStoryTimeline.ts`
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`

**Interfaces:**
- Consumes: `LAYER_TRACKS`, `sampleNumberTrack`, `sampleClipTrack`, `storyProgress`
- Produces: scroll/resize/pageshow/orientationchange에 안전한 타임라인 실행

- [ ] **Step 1: 재생 헤드 스냅 임계값과 감쇠의 실패 테스트를 Task 2 테스트에 추가**

0.18 이상 점프는 즉시 목표로 이동하고, 작은 변화는 프레임 시간 기반 감쇠로 수렴해야 한다.

- [ ] **Step 2: 실패 확인 후 최소 수학 구현**

Run: `npx tsx --test src/components/invitation/story/timelineMath.test.ts`

- [ ] **Step 3: 이벤트는 목표 진행률만 갱신하고 rAF 한 개만 유지**

오프스크린에서는 IntersectionObserver로 루프를 멈추되, 다시 들어올 때 즉시 현재 스크롤을 샘플링한다.

- [ ] **Step 4: 레이어별 transform·opacity·clip-path 직접 적용**

```ts
node.style.transform = `translate3d(${x}vw, ${y}vh, 0) rotate(${rotate}deg) scale(${scale})`;
node.style.opacity = String(opacity);
node.style.clipPath = clipToPolygon(clip);
```

- [ ] **Step 5: 빠른 점프와 역방향에서 빈 배경이 없는지 브라우저 확인**

---

### Task 7: 6챕터 연출 완성

**Files:**
- Modify: `src/components/invitation/story/storyTimeline.ts`
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`

**Interfaces:**
- Produces: 16숏 전체 타임라인과 100개 이상의 검증된 키프레임

- [ ] **Step 1: 오프닝 제목 글자, 오토바이, 3단 패럴랙스 구현**
- [ ] **Step 2: 찢어진 종이 전환과 T타워 카드→창문 줌 구현**
- [ ] **Step 3: 회사 동료 투샷과 어색한 여백·소품 등장 구현**
- [ ] **Step 4: 만화 패널 분할, 말풍선, 3단 표정, 폭소 타이포 구현**
- [ ] **Step 5: 실제 엽서 프레임 3장, 점선 경로, 미니 사이드카 이동 구현**
- [ ] **Step 6: 제주 엽서→전체 풍경 확대와 가장 깊은 패럴랙스 구현**
- [ ] **Step 7: 아펠가모 진입, 문 열림, 날짜·장소 문구 구현**
- [ ] **Step 8: 세로 종이 띠 매치컷, 웨딩 의상, 깊이별 꽃가루 구현**
- [ ] **Step 9: 초대장 종이가 실제 본문으로 이어지는 sticky 해제 구현**
- [ ] **Step 10: 타임라인 불변 조건과 키프레임 수 테스트 통과 확인**

Run: `npm run test:story`

Expected: PASS with `LAYER_TRACKS.length >= 24` and keyframes `>= 100`.

---

### Task 8: 접근성·성능·회귀 보강

**Files:**
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/StoryFallback.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `next.config.ts` only if an image quality outside the registered set is required

**Interfaces:**
- Produces: 키보드 건너뛰기, 챕터 진행도, reduced motion, 이미지 로딩 정책

- [ ] **Step 1: 진행도는 챕터 변경 시에만 React state와 ARIA 값을 갱신**
- [ ] **Step 2: 첫 배경만 preload하고 나머지 자산의 sizes와 고정 비율 지정**
- [ ] **Step 3: 320px, 390×844, 430px, 1440×900에서 오버플로 검사**
- [ ] **Step 4: reduced motion에서 sticky·transform 애니메이션이 없는지 검사**
- [ ] **Step 5: `/`, `/i/<잘못된 토큰>`, `/admin/login` 응답과 기존 청첩장 섹션 순서 확인**

---

### Task 9: 브라우저 시각 QA와 문서 매핑

**Files:**
- Modify: `docs/todo.md`
- Modify: `docs/requirements.md`
- Modify: `docs/scroll-story-reference-analysis.md` if implementation findings differ

**Interfaces:**
- Produces: 요구사항 대비 검증 기록과 남은 실기기 항목

- [ ] **Step 1: 개발 서버에서 390×844와 1440×900의 0~100%를 10% 단위로 확인**
- [ ] **Step 2: 아래/위/큰 점프, 새로고침 복원, 건너뛰기, reduced motion 확인**
- [ ] **Step 3: 콘솔의 hydration·runtime error가 0개인지 확인**
- [ ] **Step 4: 자동 검증 실행**

Run: `npm run test:story && npm run typecheck && npm run build`

Expected: 모두 exit 0.

- [ ] **Step 5: 요구사항 전체를 다시 대조하고 문서 상태 갱신**

`docs/todo.md`에는 iOS Safari·카카오톡 인앱 브라우저 실기기 검증만 미완료로 남긴다. `docs/requirements.md`에는 새 파일과 타임라인·자산·반응형·접근성 구현을 매핑한다.
