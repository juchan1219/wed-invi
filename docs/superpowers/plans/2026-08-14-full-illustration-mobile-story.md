# Full-Illustration Mobile Wedding Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첨부 레퍼런스와 같은 굵은 손그림·크레용 질감으로 16개 장면을 다시 제작하고, 430×932 고정 모바일 무대 안에서 장면의 물체가 다음 장면의 물체로 이어지는 공간형 스크롤 스토리를 완성한다.

**Architecture:** `storyAssets.ts`가 모든 래스터 에셋과 크롭 정보를 단일 레지스트리로 관리하고, `storyTimeline.ts`가 16개 장면의 좌표·비균일 스케일·기준점·클립을 선언한다. `useStoryTimeline`은 네이티브 스크롤을 rAF로 샘플링해 DOM 스타일만 갱신하며 React state를 프레임마다 변경하지 않는다. `WeddingStory`는 뷰포트 중앙에 왜곡 없는 430×932 논리 캔버스를 고정하고, reduced motion에서는 같은 에셋으로 정적 읽기 흐름을 제공한다.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, TypeScript, CSS Modules, requestAnimationFrame, WebP/PNG raster assets, built-in ImageGen, node:test via tsx, in-app browser QA

**Spec:** `docs/superpowers/specs/2026-08-14-doodle-wedding-story-theme.md`

## Global Constraints

- 작업 시작 전에 `node_modules/next/dist/docs/`에서 현재 프로젝트에 해당하는 Image 및 CSS/asset 문서를 읽고 Next.js 16 규약을 따른다.
- `/`와 `/i/[token]`은 계속 `Invitation` 하나를 공유한다. 토큰·인증·공유·OG·편지 렌더링 경로를 건드리지 않는다.
- `rehype-sanitize`, `Reveal.rootMargin`, `TOKEN_SECRET`, 서울 시간 포맷 규칙을 유지한다.
- 모든 장면은 430×932 논리 좌표를 사용한다. 실제 무대는 비율을 유지해 뷰포트에 contain하고 데스크톱 여백은 크림색 종이로 채운다.
- 첨부된 삼연작은 스타일·인물 일관성의 기준이다. 기존 CSS 사람·CSS 건물·CSS 원형·체커보드 제거 스크립트 결과를 최종 비주얼로 사용하지 않는다.
- 이미지 생성물에는 문자를 넣지 않는다. 제목·날짜·장소·대사는 접근 가능한 HTML 텍스트로 렌더링한다.
- 예찬은 검은 안경을 쓴 콩 모양 캐릭터, 주은은 묶거나 땋은 머리의 콩 모양 캐릭터로 모든 장면에서 눈·몸 비율을 고정한다.
- 래스터 에셋은 `public/story/doodle-v2/`에 저장하고 긴 변 2400px 이하, 불투명 배경은 WebP, 실제 투명이 필요한 전경은 PNG/WebP alpha로 관리한다.
- 이미지 생성은 각 산출물별 개별 ImageGen 호출을 사용한다. 생성 결과를 먼저 시각 검수한 뒤 프로젝트 경로에 복사한다.
- 작업 중 현재의 미커밋 rough prototype 변경을 잃지 않는다. 첫 구현 커밋 전에 해당 상태를 별도 checkpoint 커밋으로 보존한다.
- 완료 전 `npm run test:story`, `npm run typecheck`, `npm run build`를 모두 실행하고 390×844, 430×932, 1280×720 브라우저 검수를 남긴다.
- 완료 보고 전 `docs/todo.md`, `docs/requirements.md`의 구현 매핑을 실제 상태와 맞춘다.

---

### Task 1: 현재 rough prototype 체크포인트와 Next.js 16 근거 확보

**Files:**
- Preserve and commit: 현재 수정·추가된 rough prototype 파일 전체
- Read: `node_modules/next/dist/docs/`
- Create: `docs/superpowers/evidence/2026-08-14-full-illustration-baseline.md`

**Interfaces:**
- Produces: 되돌아갈 수 있는 rough prototype 커밋과 Next.js 16 구현 근거 목록

- [ ] **Step 1: 현재 변경 범위를 확인하고 사용자의 기존 파일과 story prototype을 구분한다**

Run: `git status --short && git diff --stat && git diff --name-only`

Expected: story 관련 파일·문서·스크립트·두 WebP만 포함된다. 범위 밖 변경이 있으면 해당 파일은 stage하지 않는다.

- [ ] **Step 2: rough prototype만 체크포인트 커밋한다**

Run: `git add docs/requirements.md docs/todo.md scripts/remove-checker-background.mjs scripts/convert-story-image.mjs scripts/remove-white-background.mjs src/components/invitation/story/StoryFallback.tsx src/components/invitation/story/StoryLayer.tsx src/components/invitation/story/WeddingStory.module.css public/story/doodle-character-atlas-v1.webp public/story/doodle-proposal-triptych-v1.webp && git commit -m "wip: checkpoint doodle story prototype"`

Expected: commit succeeds and `git status --short` is clean except this implementation plan if it was not committed separately.

- [ ] **Step 3: Next.js 16 문서 위치를 검색하고 필요한 문서를 끝까지 읽는다**

Run: `rg -n "next/image|public folder|CSS Modules|static assets" node_modules/next/dist/docs -g '*.md' -g '*.mdx'`

Read the matched Image, public asset, and CSS Modules guides in full. Record exact paths and constraints in the evidence document.

- [ ] **Step 4: 현재 세 화면 기준 스크린샷을 저장한다**

Use the in-app browser at 390×844, 430×932, and 1280×720. Capture the opening, office, and proposal positions. Store screenshots under `/tmp/wed-invi-full-illustration-baseline/` and record route, viewport, and scroll percentage in the evidence document.

- [ ] **Step 5: evidence 문서만 커밋한다**

Run: `git add docs/superpowers/evidence/2026-08-14-full-illustration-baseline.md && git commit -m "docs: capture doodle story baseline"`

---

### Task 2: 에셋 레지스트리 계약을 테스트 우선으로 추가

**Files:**
- Create: `src/components/invitation/story/storyAssets.ts`
- Create: `src/components/invitation/story/storyAssets.test.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export const STORY_CANVAS = { width: 430, height: 932 } as const;

export type StoryImageAsset = {
  kind: "image";
  src: `/story/doodle-v2/${string}`;
  width: number;
  height: number;
  fit: "cover" | "contain";
  focalPoint?: { x: number; y: number };
  eager?: boolean;
};

export type StorySpriteAsset = {
  kind: "sprite";
  src: `/story/doodle-v2/${string}`;
  width: number;
  height: number;
  columns: number;
  rows: number;
  cell: { column: number; row: number };
};

export const STORY_ASSETS = {
  characterAtlasLegacy: {
    kind: "image",
    src: "/story/doodle-v2/legacy-character-atlas.webp",
    width: 2048,
    height: 2048,
    fit: "contain",
  },
  proposalTriptychLegacy: {
    kind: "image",
    src: "/story/doodle-v2/legacy-proposal-triptych.webp",
    width: 1536,
    height: 1024,
    fit: "cover",
  },
} satisfies Record<string, StoryImageAsset | StorySpriteAsset>;
```

- [ ] **Step 1: 존재 파일·크기·ID 고유성을 검사하는 실패 테스트를 작성한다**

```ts
test("every story asset exists under doodle-v2 and declares positive dimensions", () => {
  for (const [id, asset] of Object.entries(STORY_ASSETS)) {
    assert.match(asset.src, /^\/story\/doodle-v2\//, id);
    assert.ok(asset.width > 0 && asset.height > 0, id);
    assert.ok(existsSync(join(process.cwd(), "public", asset.src.slice(1))), id);
  }
});
```

- [ ] **Step 2: 테스트가 레지스트리 부재로 실패하는지 확인한다**

Run: `npx tsx --test src/components/invitation/story/storyAssets.test.ts`

Expected: FAIL because `storyAssets.ts` does not exist.

- [ ] **Step 3: 기존 두 v1 에셋을 v2 폴더의 legacy 이름으로 복사하고 최소 레지스트리로 테스트를 통과시킨다**

Run: `mkdir -p public/story/doodle-v2 && cp public/story/doodle-character-atlas-v1.webp public/story/doodle-v2/legacy-character-atlas.webp && cp public/story/doodle-proposal-triptych-v1.webp public/story/doodle-v2/legacy-proposal-triptych.webp`

초기 ID는 `characterAtlasLegacy`, `proposalTriptychLegacy`로 명시해 최종 v2 에셋과 혼동하지 않는다. 이미지 도구로 실제 크기를 확인해 예시의 2048×2048, 1536×1024가 다르면 레지스트리 값을 실제 픽셀 크기로 교정한다.

- [ ] **Step 4: story 테스트 명령에 새 테스트를 포함한다**

`package.json`의 `test:story`가 `src/components/invitation/story/*.test.ts` 전체를 실행하는지 확인하고 좁은 glob이면 수정한다.

- [ ] **Step 5: 테스트와 커밋**

Run: `npm run test:story`

Expected: PASS

Run: `git add public/story/doodle-v2/legacy-character-atlas.webp public/story/doodle-v2/legacy-proposal-triptych.webp src/components/invitation/story/storyAssets.ts src/components/invitation/story/storyAssets.test.ts package.json && git commit -m "test: define illustrated story asset contract"`

---

### Task 3: 타임라인을 단일 모바일 좌표와 비균일 변환으로 확장

**Files:**
- Modify: `src/components/invitation/story/timelineMath.ts`
- Modify: `src/components/invitation/story/timelineMath.test.ts`
- Modify: `src/components/invitation/story/storyTimeline.ts`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`
- Modify: `src/components/invitation/story/useStoryTimeline.ts`

**Interfaces:**

```ts
export type LayerState = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  opacity: number;
  originX: number;
  originY: number;
  clip: Clip;
};

export type LayerTrack = {
  id: string;
  x?: readonly NumberFrame[];
  y?: readonly NumberFrame[];
  scaleX?: readonly NumberFrame[];
  scaleY?: readonly NumberFrame[];
  rotate?: readonly NumberFrame[];
  opacity?: readonly NumberFrame[];
  originX?: readonly NumberFrame[];
  originY?: readonly NumberFrame[];
  clip?: readonly ClipFrame[];
};
```

- [ ] **Step 1: `scaleX`, `scaleY`, `originX`, `originY` 기본값과 보간을 검증하는 실패 테스트를 작성한다**

```ts
assert.deepEqual(sampleLayerState(trackWithoutOverrides, 0.5), {
  x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1,
  originX: 50, originY: 50, clip: FULL_CLIP,
});
```

또한 progress 0.5에서 `scaleX: 1.5`, `scaleY: 0.75`, `originX: 20`, `originY: 80`이 독립 보간되는 테스트를 추가한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx tsx --test src/components/invitation/story/timelineMath.test.ts src/components/invitation/story/storyTimeline.test.ts`

Expected: FAIL because the new state keys are absent.

- [ ] **Step 3: 기존 `scale`과 mobile/desktop override를 제거하고 모든 트랙을 논리 모바일 좌표 하나로 마이그레이션한다**

기존 `scale` 값은 동일한 `scaleX`/`scaleY` 프레임으로 복제한다. `sampleLayerState`의 viewport 분기를 제거한다.

- [ ] **Step 4: DOM 스타일 적용식을 비균일 변환과 기준점으로 바꾼다**

```ts
element.style.transformOrigin = `${state.originX}% ${state.originY}%`;
element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.rotate}deg) scale(${state.scaleX}, ${state.scaleY})`;
```

- [ ] **Step 5: 역스크롤·점프·clip 불변 조건을 다시 실행한다**

Run: `npm run test:story`

Expected: PASS; no `mobile`, `desktop`, or scalar-only `scale` track remains.

- [ ] **Step 6: 커밋**

Run: `git add src/components/invitation/story/timelineMath.ts src/components/invitation/story/timelineMath.test.ts src/components/invitation/story/storyTimeline.ts src/components/invitation/story/storyTimeline.test.ts src/components/invitation/story/useStoryTimeline.ts && git commit -m "feat: add spatial transforms to story timeline"`

---

### Task 4: 왜곡 없는 430×932 고정 모바일 무대 구현

**Files:**
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`

**Interfaces:**
- Produces: `stageShell` full viewport sticky wrapper and `stage` 430×932 aspect-contained logical canvas

- [ ] **Step 1: 캔버스 상수와 DOM 레이어 계약 실패 테스트를 추가한다**

`STORY_CANVAS`가 정확히 430×932이고 모든 `LAYER_TRACKS.id`가 렌더 가능한 레이어 ID와 일치하는지 검사한다.

- [ ] **Step 2: `WeddingStory`의 sticky root 안에 크림색 shell과 내부 stage를 분리한다**

```tsx
<div className={styles.stageShell}>
  <div className={styles.stage} ref={stageRef} data-story-canvas>
    {layers}
  </div>
</div>
```

- [ ] **Step 3: 논리 비율을 왜곡 없이 contain한다**

```css
.stageShell {
  position: sticky;
  top: 0;
  height: 100svh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f5eedc;
}

.stage {
  position: relative;
  width: min(100vw, 46.137svh, 430px);
  aspect-ratio: 430 / 932;
  overflow: hidden;
  background: #f5eedc;
}
```

- [ ] **Step 4: 타임라인 좌표가 CSS 스케일과 함께 움직이도록 stage 내부의 실제 좌표계를 430×932로 고정한다**

내부 `canvasPlane`을 `width:430px;height:932px`로 두고 stage 폭을 기준으로 `scale(var(--story-canvas-scale))`한다. `ResizeObserver`는 shell 크기에서 `min(width/430, height/932, 1)`을 계산하되 React render가 아니라 CSS custom property를 갱신한다.

- [ ] **Step 5: 세 뷰포트에서 종횡비와 여백을 검증한다**

At 390×844: canvas width 389–390px and no horizontal overflow.  
At 430×932: canvas exactly 430×932.  
At 1280×720: canvas height 720px, width about 332px, centered with cream gutters.

- [ ] **Step 6: 테스트·커밋**

Run: `npm run test:story`

Run: `git add src/components/invitation/story/WeddingStory.tsx src/components/invitation/story/WeddingStory.module.css src/components/invitation/story/storyTimeline.test.ts && git commit -m "feat: contain story in fixed mobile canvas"`

---

### Task 5: 스타일 바이블과 공통 캐릭터 시트 제작

**Files:**
- Create: `public/story/doodle-v2/style-guide.webp`
- Create: `public/story/doodle-v2/characters-casual.webp`
- Create: `public/story/doodle-v2/characters-wedding.webp`
- Modify: `src/components/invitation/story/storyAssets.ts`
- Modify: `src/components/invitation/story/storyAssets.test.ts`

**Interfaces:**
- Produces: 모든 후속 ImageGen 호출에서 함께 참조할 3개 기준 자산

- [ ] **Step 1: 첨부 삼연작을 style-guide 기준 이미지로 정리한다**

Reference input: `/Users/juju/.codex/attachments/acc6f259-e039-4040-ac0f-6777be471b2a/image-1.png`

ImageGen edit prompt:

```text
Create a clean 430x932 vertical style bible from this reference, not a finished story scene. Preserve the exact charming handmade language: thick slightly wobbly black marker outlines, visible crayon and colored-pencil grain, warm cream paper, simplified bean-shaped people, imperfect hand-cut borders, no gradients, no photorealism, no 3D, no typography. Show color swatches for sky blue, coral red, grass green, warm yellow and paper cream; show two full-body turnaround views of the same couple. The groom is a tall bean character with black side-parted hair and thick black glasses. The bride is a shorter bean character with tied or braided black hair. Keep identical dot-eye spacing and body proportions in every view. Leave generous blank paper margins.
```

- [ ] **Step 2: casual 4×2 transparent sprite sheet를 생성한다**

ImageGen prompt with `style-guide.webp` and the attached triptych as references:

```text
On a truly transparent background, create a precise 4-column by 2-row sprite sheet of the exact same doodle couple from the references. Thick wobbly black marker line, crayon fill, cream-free transparent gaps, no shadows, no text. Top row is Yechan: neutral standing, sidecar driving, talking with one hand raised, laughing with eyes squeezed. Bottom row is Jueun: neutral standing, sidecar passenger, talking with one hand raised, laughing with tied hair bouncing. Every cell has the full uncropped body, identical scale, identical bean proportions, and at least 80 pixels of transparent padding. Yechan always has black glasses; Jueun always has tied or braided hair. 2048x1024 output.
```

- [ ] **Step 3: wedding 4×2 transparent sprite sheet를 생성한다**

ImageGen prompt with the same references:

```text
On a truly transparent background, create a 4-column by 2-row wedding sprite sheet for the same two bean-shaped doodle characters. Thick handmade black marker, colored-pencil texture, no text, no scenery, no cast shadow. Top row: Yechan in a simple black doodle tuxedo, neutral, walking, waving, cheering. Bottom row: Jueun in a simple white crayon wedding dress and veil, neutral, walking, waving, cheering. Full bodies never cropped, identical eye placement and proportions to the casual sheet, 80 pixels transparent padding, 2048x1024.
```

- [ ] **Step 4: 이미지 각각을 시각 검사한다**

Reject and regenerate if glasses disappear, hair shape changes, any limb or veil is cropped, checkerboard is baked in, background is not transparent, or the line becomes smooth vector art.

- [ ] **Step 5: 레지스트리에 실제 크기와 sprite cell을 등록하고 테스트한다**

Run: `npm run test:story`

Expected: PASS and all three files exist with positive dimensions.

- [ ] **Step 6: 커밋**

Run: `git add public/story/doodle-v2/style-guide.webp public/story/doodle-v2/characters-casual.webp public/story/doodle-v2/characters-wedding.webp src/components/invitation/story/storyAssets.ts src/components/invitation/story/storyAssets.test.ts && git commit -m "art: establish wedding story style bible"`

---

### Task 6: 오프닝·사이드카·타워·사무실 풀 일러스트 제작

**Files:**
- Create: `public/story/doodle-v2/01-opening-background.webp`
- Create: `public/story/doodle-v2/02-sidecar-road.webp`
- Create: `public/story/doodle-v2/03-paper-turn.webp`
- Create: `public/story/doodle-v2/04-tower-card.webp`
- Create: `public/story/doodle-v2/05-office-background.webp`
- Create: `public/story/doodle-v2/06-office-desk.webp`
- Create: `public/story/doodle-v2/sidecar.png`
- Modify: `src/components/invitation/story/storyAssets.ts`

**Interfaces:**
- Produces: shots 1–6용 배경 6개와 독립 sidecar 전경 1개

- [ ] **Step 1: 공통 참조를 첨부해 opening 배경을 생성한다**

Prompt:

```text
430x932 portrait full-scene illustration on warm cream paper in the exact supplied doodle style. A wide Hamburg-like riverside road at early morning, pale blue crayon sky, distant harbor cranes, tiny yellow windows, green verge and coral route line entering from the lower right. No people, no motorcycle, no words. Compose clear empty sky in the upper third for HTML title. Thick irregular black marker, visible crayon grain, intentionally naive perspective, full bleed with hand-drawn paper edges, no gradients, no vector smoothness.
```

- [ ] **Step 2: sidecar road와 독립 sidecar를 생성한다**

Background prompt:

```text
430x932 portrait continuation of the same riverside doodle road, camera lower and closer, coral road curving from bottom right toward center, harbor and trees sliding left, no characters, no vehicle, no text. Match the exact supplied paper, line weight, palette and naive crayon texture.
```

Transparent sidecar prompt:

```text
Transparent-background cutout in the exact supplied doodle style: a small coral vintage motorcycle with sidecar, complete wheels and handlebars, seen three-quarter from the left, no rider, no text, thick wobbly black marker and crayon fill. Center the entire vehicle with generous transparent padding, no baked checkerboard, no shadow.
```

- [ ] **Step 3: paper turn과 T-tower card 배경을 생성한다**

`03-paper-turn.webp` is a cream paper sheet with a coral painted lower-right corner and rough torn upper-left edge, no text.  
`04-tower-card.webp` is a cream postcard containing a naive red T-shaped broadcast tower, blue sky, tiny city blocks and black hand-drawn border, leaving the central tower window visibly open for the zoom transition, no text.

- [ ] **Step 4: office background와 desk foreground를 생성한다**

Office prompt:

```text
430x932 portrait whimsical office interior in the exact supplied doodle style, viewed through the red tower window. Warm cream walls, slightly crooked pale-blue windows, coral filing cabinet, two facing desks, potted plant and tiny paper notes without legible writing. No people. Leave the lower 28 percent available for a separate desk foreground and the center open for two characters. Thick marker line, crayon grain, imperfect perspective, no gradients.
```

Desk prompt:

```text
Transparent foreground cutout spanning a 430x260 canvas: hand-drawn office desk edge, two mugs, scattered blank papers, keyboard shapes and a small plant, exact supplied marker-and-crayon style, no words, no people, complete uncropped objects, real alpha background.
```

- [ ] **Step 5: 자산을 실제 출력 크기로 최적화하고 레지스트리에 등록한다**

Opaque scenes are 860×1864 or 430×932 WebP. Transparent props keep alpha and are at most 1720px on the long edge.

- [ ] **Step 6: 자산 테스트와 커밋**

Run: `npm run test:story`

Run: `git add public/story/doodle-v2 src/components/invitation/story/storyAssets.ts && git commit -m "art: create opening and office story scenes"`

---

### Task 7: 웃음 패널·프로포즈·웨딩홀 풀 일러스트 제작

**Files:**
- Create: `public/story/doodle-v2/07-joke-panel.webp`
- Create: `public/story/doodle-v2/08-laugh-panel.webp`
- Create: `public/story/doodle-v2/09-laugh-burst.webp`
- Create: `public/story/doodle-v2/10-12-proposal-triptych.webp`
- Create: `public/story/doodle-v2/13-venue-exterior.webp`
- Create: `public/story/doodle-v2/14-venue-interior.webp`
- Create: `public/story/doodle-v2/15-crowd-left.webp`
- Create: `public/story/doodle-v2/15-crowd-right.webp`
- Create: `public/story/doodle-v2/16-paper-veil.webp`
- Modify: `src/components/invitation/story/storyAssets.ts`

**Interfaces:**
- Produces: shots 7–16용 배경·전경과 공통 proposal triptych

- [ ] **Step 1: 좌우 joke/laugh panel을 생성한다**

Left prompt:

```text
430x932 portrait comic panel in the supplied handmade doodle style, warm cream paper, crooked black frame, coral speech-bubble shape with no text, small office props at the edges, empty center for the consistent Yechan sprite, energetic black motion marks entering from the right. No people, no typography, crayon grain and rough marker only.
```

Right prompt mirrors the composition for Jueun with a pale-blue empty speech-bubble shape and motion marks entering from the left. `09-laugh-burst.webp` is a transparent radial burst of irregular black marker rays, coral and yellow crayon flecks, with the center fully transparent and no characters.

- [ ] **Step 2: proposal triptych를 v2 기준 자산으로 만든다**

Use the attached triptych and style-guide as references. Edit only for a clean 1290×932 horizontal strip with three equal 430px panels: Hamburg proposal at sunset, shy ring reveal indoors, Tokyo Tower wedding-snap pose. Preserve the couple’s exact bean faces and all meaningful scene content. Remove any generated words. Extend cropped edges with matching cream paper and crayon texture; do not redraw into realistic people.

- [ ] **Step 3: venue exterior와 interior를 생성한다**

Exterior prompt:

```text
430x932 portrait approach to a tiny whimsical wedding hall on cream paper, exact supplied marker-and-crayon style. A red Tokyo Tower line from the upper background naturally bends into the coral outline of a wedding arch and closed double doors. Blue sky, green crayon grass, hand-drawn flower dots, centered path leading upward, no people, no words, open lower foreground for walking characters.
```

Interior prompt:

```text
430x932 portrait view through now-open wedding hall doors, exact supplied doodle style. Warm yellow ceremony room, simple coral arch, green plants, cream aisle, irregular black outlines, blank center aisle for the couple, no people, no readable signs, no gradients. Door-edge shapes align with the exterior composition so a mask can reveal this image underneath.
```

- [ ] **Step 4: 좌우 하객 전경과 마지막 veil/paper를 생성한다**

Crowd prompts create separate transparent left and right strips of 8–10 diverse bean-shaped guests in colorful crayon clothes, full bodies or intentional waist crop only at the bottom edge, cheering toward the center aisle, no signs or text.  
Final veil prompt creates a large translucent-looking white crayon veil/paper sweep on real alpha, entering from upper right and becoming opaque cream paper at lower left, rough black pencil edge, no people or text.

- [ ] **Step 5: 일관성 검수와 레지스트리 갱신**

Reject any scene whose paper hue, line weight, groom glasses, bride hair, or bean proportions differ from the style bible. Verify proposal left/center/right crops each retain the intended focal point at 430×932.

- [ ] **Step 6: 자산 테스트와 커밋**

Run: `npm run test:story`

Run: `git add public/story/doodle-v2 src/components/invitation/story/storyAssets.ts && git commit -m "art: create proposal and finale story scenes"`

---

### Task 8: `StoryLayer`를 레지스트리 기반 래스터 렌더러로 교체

**Files:**
- Replace: `src/components/invitation/story/StoryLayer.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `src/components/invitation/story/storyAssets.ts`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`

**Interfaces:**
- Consumes: `STORY_ASSETS[assetId]`
- Produces: `data-story-layer`, optional sprite crop, object-position focal point

- [ ] **Step 1: 타임라인 layer ID와 asset ID 매핑의 실패 테스트를 작성한다**

```ts
test("every raster layer resolves to a registered asset", () => {
  for (const layer of STORY_LAYER_DEFINITIONS) {
    if (layer.assetId) assert.ok(STORY_ASSETS[layer.assetId], layer.id);
  }
});
```

- [ ] **Step 2: 선언형 layer definition을 추가한다**

```ts
export type StoryLayerDefinition = {
  id: string;
  assetId?: keyof typeof STORY_ASSETS;
  className?: "background" | "midground" | "character" | "foreground" | "mask";
  text?: { kind: "title" | "caption"; value: string };
};
```

- [ ] **Step 3: `DoodleScene`, CSS sidecar, CSS crowd, CSS venue, CSS 캐릭터 분기를 삭제한다**

`StoryLayer`는 이미지, sprite crop, HTML text만 렌더링한다. 자산 크기·focal point는 inline custom properties로 전달한다.

- [ ] **Step 4: sprite crop 구현**

Sprite wrapper 크기는 한 cell 크기이며, 내부 이미지를 `translate(-column*cellWidth, -row*cellHeight)`한다. 래퍼에는 `overflow:hidden`과 명시적 aria-hidden을 적용한다.

- [ ] **Step 5: CSS placeholder 제거 검증**

Run: `rg -n "DoodleScene|doodlePerson|doodleBuilding|sidecarBody|crowdPerson|venueDoor|checker|border-radius:\s*50%" src/components/invitation/story`

Expected: no major background/character placeholder matches. `border-radius:50%` is allowed only for tiny UI dots such as progress indicators, documented beside the rule.

- [ ] **Step 6: 테스트·커밋**

Run: `npm run test:story`

Run: `git add src/components/invitation/story/StoryLayer.tsx src/components/invitation/story/WeddingStory.module.css src/components/invitation/story/storyAssets.ts src/components/invitation/story/storyTimeline.test.ts && git commit -m "refactor: render story from illustration registry"`

---

### Task 9: shots 1–9 공간형 전환 타임라인 구현

**Files:**
- Modify: `src/components/invitation/story/storyTimeline.ts`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`
- Modify: `src/components/invitation/story/WeddingStory.tsx`

**Interfaces:**
- Produces: opening→office→laugh triptych continuous transforms without full-frame crossfade

- [ ] **Step 1: 각 장면 경계의 실제 공간 연결을 검사하는 실패 테스트를 추가한다**

At each boundary, assert at least one outgoing and one incoming layer overlap with opacity > 0.25 for 1.5% of total progress. Assert boundary 3→4 uses clip or scale, 4→5 uses scale > 2, 8→9 uses polygon clip.

- [ ] **Step 2: shots 1–3을 구현한다**

Opening background drifts left 36px; sidecar enters x=520→70; casual sprites ride above it. At shot 3 the sidecar and camera move toward the lower-right coral paper corner. `03-paper-turn` scales from 0.15 to 2.4 around origin 84%/78%, becoming the whole frame.

- [ ] **Step 3: shots 4–6을 구현한다**

`04-tower-card` emerges from the paper turn with `scaleX 0.72→1`, `scaleY 0.58→1`, `rotate -5→0`. The tower window becomes the zoom origin. Card scales 1→4.8 at origin 51%/43% while `05-office-background` scales 1.35→1 underneath. `06-office-desk` rises y=280→665 and becomes the bottom edge of the next panel.

- [ ] **Step 4: shots 7–9을 구현한다**

Left joke panel enters x=-430→0, right laugh panel uses polygon clip from right. Character sprites occupy separate layers. Both panels compress to half-width using `scaleX`, then merge. `09-laugh-burst` expands 0.2→1.6; its black rays align with the proposal triptych panel dividers at the final keyframe.

- [ ] **Step 5: forward/reverse/jump tests**

For each boundary sample progress at start-0.002, start, start+0.002, then reverse the call order and assert deterministic identical states. Sample direct jumps 0.02→0.58 and 0.58→0.02.

- [ ] **Step 6: 테스트·커밋**

Run: `npm run test:story`

Run: `git add src/components/invitation/story/storyTimeline.ts src/components/invitation/story/storyTimeline.test.ts src/components/invitation/story/WeddingStory.tsx && git commit -m "feat: choreograph opening through laughter"`

---

### Task 10: shots 10–16 제안 삼연작·웨딩홀·초대장 전환 구현

**Files:**
- Modify: `src/components/invitation/story/storyTimeline.ts`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`
- Modify: `src/components/invitation/story/WeddingStory.tsx`

**Interfaces:**
- Produces: one continuous triptych pan and Tokyo Tower→venue arch→invitation paper match cuts

- [ ] **Step 1: proposal triptych가 단일 에셋 인스턴스로 사용되는 계약 테스트를 추가한다**

Shots 10–12 must reference the same `proposalTriptych` asset and animate x from 0 to -430 to -860 without opacity dropping below 0.98.

- [ ] **Step 2: shots 10–12 horizontal pan 구현**

Triptych is rendered at 1290×932. Shot 10 x=0, shot 11 x=-430, shot 12 x=-860. A separate ring-box emphasis layer scales 0.8→1.12 around center panel and returns to 1. The camera pan uses easeInOut and never crossfades the panels.

- [ ] **Step 3: Tokyo Tower line을 venue arch로 연결한다**

At shot 12 end, triptych scales 1→1.8 around the red tower. `13-venue-exterior` begins at scale 1.35 and clip-reveals along the same red diagonal. Both overlap for 2% progress; the tower red line and venue arch differ by no more than 12 logical pixels at the handoff.

- [ ] **Step 4: venue doors와 의상 match cut 구현**

`13-venue-exterior` holds while a center polygon widens like doors. `14-venue-interior` is underneath. Casual character sprites walk to the door, then wedding sprites replace them at the same x/y/body height within a 0.5% overlap.

- [ ] **Step 5: crowd와 마지막 paper/veil 전환 구현**

Left/right crowd strips enter from ±180px with 20px differential parallax. Couple walks y=610→470. `16-paper-veil` sweeps from x=390,y=-180,scale=.35 to x=-40,y=-20,scale=2.2, leaving the final frame cream and matching the invitation content background.

- [ ] **Step 6: 전체 경계 invariant·커밋**

Run: `npm run test:story`

Expected: 16 shots, all boundaries spatially bridged, proposal opacity invariant, direct jump deterministic.

Run: `git add src/components/invitation/story/storyTimeline.ts src/components/invitation/story/storyTimeline.test.ts src/components/invitation/story/WeddingStory.tsx && git commit -m "feat: choreograph proposal and wedding finale"`

---

### Task 11: reduced motion·fallback·접근성·이미지 로딩 완성

**Files:**
- Replace: `src/components/invitation/story/StoryFallback.tsx`
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/StoryLayer.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `src/components/invitation/story/storyAssets.ts`

**Interfaces:**
- Produces: JS off/reduced-motion에서도 6장 요약과 모든 이야기 문구가 읽히는 흐름

- [ ] **Step 1: fallback이 CSS 사람/건물을 사용하지 않고 registry 이미지 6장을 소비하도록 바꾼다**

Opening, office, laughter, proposal, venue, finale 대표 컷과 해당 챕터 카피를 순서대로 렌더링한다.

- [ ] **Step 2: 이미지 접근성 규칙을 적용한다**

애니메이션 레이어 이미지는 `alt="" aria-hidden="true"`; 이야기 의미는 숨겨진 16-shot transcript와 화면 카피가 제공한다. Skip link는 invitation content target으로 유지한다.

- [ ] **Step 3: 초기 로딩 우선순위를 제한한다**

Opening background, initial title, initial character only eager/preload. Remaining images use lazy loading. 화면 진입 직전 chapter 단위 preload를 하되 네트워크 실패가 스크롤을 막지 않는다.

- [ ] **Step 4: `prefers-reduced-motion`에서 sticky 높이와 rAF를 제거한다**

JS media query와 CSS media query가 모두 같은 fallback을 선택하도록 하고, mount 전에는 첫 장면 또는 fallback 중 하나가 보이게 한다.

- [ ] **Step 5: 키보드·스크린리더 검증**

Tab order includes skip control then invitation interactive controls; no decorative layer is focusable; progress announcement is throttled by shot boundary and not every frame.

- [ ] **Step 6: 테스트·커밋**

Run: `npm run test:story`

Run: `git add src/components/invitation/story/StoryFallback.tsx src/components/invitation/story/WeddingStory.tsx src/components/invitation/story/StoryLayer.tsx src/components/invitation/story/WeddingStory.module.css src/components/invitation/story/storyAssets.ts && git commit -m "feat: complete accessible illustrated story fallback"`

---

### Task 12: 브라우저 전수 검수·문서 매핑·최종 검증

**Files:**
- Modify: `docs/todo.md`
- Modify: `docs/requirements.md`
- Create: `docs/superpowers/evidence/2026-08-14-full-illustration-qa.md`
- Modify only if defects are found: story implementation files

**Interfaces:**
- Produces: 각 장면 start/mid/end, 역스크롤, 점프, 리로드, reduced-motion에 대한 재현 가능한 검증 기록

- [ ] **Step 1: 자동 검증을 새 셸에서 실행한다**

Run: `npm run test:story`

Expected: all tests PASS.

Run: `npm run typecheck`

Expected: exit 0 with no TypeScript errors.

Run: `npm run build`

Expected: exit 0 and `/`, `/i/[token]`, `/admin` routes build successfully.

- [ ] **Step 2: 개발 서버를 실행하고 실제 응답을 확인한다**

Run: `npm run dev`

Expected: server listening on localhost. Verify `curl -I http://localhost:3000` returns 200 before opening the browser.

- [ ] **Step 3: 16개 shot의 start/mid/end를 세 뷰포트에서 검사한다**

Use 390×844, 430×932, and 1280×720. For each shot record 48 samples per viewport in the QA document. Screenshots are required at shots 1, 4, 6, 9, 10, 11, 12, 13, 15, 16.

Acceptance for every sample: no blank frame, no hard full-frame crossfade at spatial boundaries, no clipped face/limb/vehicle, no text inside raster art, no canvas distortion, no horizontal page overflow.

- [ ] **Step 4: interaction edge cases를 검사한다**

Reverse scroll through every boundary; jump from top to 58%, 58% to 12%, and bottom to top; refresh at 42% and 82%; use browser back/forward scroll restoration. Confirm no layer remains opacity 0 and no stale transform survives.

- [ ] **Step 5: route·motion variants를 검사한다**

Verify `/`, an invalid `/i/not-a-valid-token`, and `/admin` load without regression. Emulate reduced motion and confirm static six-panel flow. Real-device-only share, Kakao, clipboard, calendar and map deep links remain explicitly unverified.

- [ ] **Step 6: 레퍼런스와 품질 대조한다**

Compare the final screenshots beside the attached triptych and the observed spatial behavior of `endspeciesism.org`. Record specific pass/fail notes for line weight, crayon grain, character invariants, scene density, and transition direction. Fix failures and rerun the affected viewport plus automated checks.

- [ ] **Step 7: 요구사항 문서를 실제 상태로 갱신한다**

`docs/todo.md` checks only completed items. `docs/requirements.md` maps fixed mobile canvas, asset registry, 16 scenes, spatial boundaries, reduced motion, and QA evidence to exact files.

- [ ] **Step 8: 최종 placeholder·working tree 검증**

Run: `rg -n "TODO|TBD|placeholder|DoodleScene|doodlePerson|doodleBuilding|sidecarBody|crowdPerson|venueDoor" src/components/invitation/story public/story/doodle-v2 docs/superpowers/evidence/2026-08-14-full-illustration-qa.md`

Expected: no implementation placeholders. Narrative use of the word “placeholder” in QA acceptance notes is acceptable only if it states none remain.

Run: `git status --short && git diff --check`

Expected: only intended docs/evidence changes before final commit; no whitespace errors.

- [ ] **Step 9: 최종 검증 커밋**

Run: `git add docs/todo.md docs/requirements.md docs/superpowers/evidence/2026-08-14-full-illustration-qa.md && git commit -m "docs: verify full illustration wedding story"`

- [ ] **Step 10: 완료 보고 형식을 맞춘다**

Report in Korean under exactly these categories: `구현`, `검증`, `미검증`, `문서 갱신`, `남은 것`. Include the active branch, final commit range, localhost URL if the server remains running, and absolute clickable paths to the style guide and QA evidence.
