# Seven-Scene Wedding Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 16-shot public narrative with the approved seven-scene 제주→회사→웃음→함부르크·도쿄→잠실 아펠가모→결혼식 story while preserving the existing doodle characters, colored-pencil artwork, and deterministic scroll engine.

**Architecture:** Keep the approved `430 × 932` canvas, existing raster registry, 41-layer renderer, and one `0..1` playhead. Move user-facing scene/copy data into a focused narrative module, retime the existing layer choreography through an explicit piecewise mapping, and let the renderer consume seven scenes plus seven animated copy cues. Reuse every approved character and background asset; the current Tokyo-to-venue diagonal reveal becomes the 서울→잠실 connector, so no character regeneration or new art model is introduced.

**Tech Stack:** Next.js 16.2.12, React 19.2.4, TypeScript 5, CSS Modules, `next/image`, Node test runner via `tsx`, jsdom 26.1.0.

**Spec:** `docs/superpowers/specs/2026-08-28-seven-scene-wedding-story-design.md`

## Global Constraints

- Public narrative is exactly seven ordered scenes; internal animation may have more keyframes but must not expose extra progress steps or transcript items.
- Exact copy includes `짝꿍이 되기로 했습니다.` and never `짝꿍이 되기도 했습니다.`.
- Ceremony copy comes from `src/config/wedding.ts`; approved values are `2026-12-19T12:30:00+09:00`, `잠실 아펠가모`, and `2층 단독홀`.
- Reuse the current casual and wedding sprite atlas cells without changing crop, face, body proportion, glasses, or hair.
- Preserve the current off-white paper, thick uneven black ink, and colored-pencil/crayon texture; do not replace major art with CSS shapes.
- Preserve the `430 × 932` logical canvas, desktop contain behavior, reduced-motion non-sticky fallback, skip link, SSR transcript, reload restoration, and deterministic reverse/jump behavior.
- Do not change authentication, token generation, personalized-letter behavior, share URLs, sanitization, database code, account data, or secrets.
- Read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`, `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, and `node_modules/next/dist/docs/03-architecture/accessibility.md` before changing production components.
- Do not run `npm audit fix --force`.

---

### Task 1: Define the seven-scene narrative contract

**Files:**
- Create: `src/components/invitation/story/storyNarrative.ts`
- Create: `src/components/invitation/story/storyNarrative.test.ts`

**Interfaces:**
- Produces: `StoryScene`, `StoryCopyCue`, `STORY_SCENES`, `STORY_COPY_CUES`, `CHAPTERS`, `getStoryProgressAnnouncement(progress)`, and `nextStoryProgressAnnouncement(previousSceneId, progress)`.
- Consumes: `wedding`, `formatCeremonyDateShort`, and `formatCeremonyTime` for the approved venue line.
- Compatibility: the current 16-shot exports remain untouched until Task 2, so this task ends with the entire existing suite green.

- [ ] **Step 1: Write the failing narrative tests**

Create `storyNarrative.test.ts` with exact scene IDs, boundaries, visible cues, typo protection, and config-derived venue copy:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { STORY_COPY_CUES, STORY_SCENES, getStoryProgressAnnouncement } from "./storyNarrative";

test("the public story contains the approved seven scenes", () => {
  assert.deepEqual(STORY_SCENES.map(({ id, start, end }) => [id, start, end]), [
    ["jeju-opening", 0, 0.08],
    ["same-direction", 0.08, 0.18],
    ["office-coworkers", 0.18, 0.34],
    ["joke-and-laughter", 0.34, 0.5],
    ["lifelong-partners", 0.5, 0.72],
    ["seoul-venue", 0.72, 0.84],
    ["wedding-finale", 0.84, 1],
  ]);
  assert.equal(STORY_SCENES[1]?.copyCues.length, 0);
  assert.equal(STORY_COPY_CUES.length, 7);
});

test("approved copy and configured ceremony details remain exact", () => {
  assert.deepEqual(STORY_COPY_CUES.map(({ copy }) => copy), [
    "예찬과 주은의 결혼 이야기",
    "처음엔 회사 동기였던 두 사람",
    "예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다.",
    "그렇게 평생 웃겨주고 웃어주는",
    "짝꿍이 되기로 했습니다.",
    "2026.12.19 오후 12시 30분,\n잠실 아펠가모에서요!",
    "예찬 ♥ 주은\n소중한 분들과 함께,\n우리 결혼합니다!!",
  ]);
  assert.equal(STORY_COPY_CUES.some(({ copy }) => copy.includes("되기도")), false);
  assert.equal(getStoryProgressAnnouncement(0.83).sceneId, "seoul-venue");
  assert.equal(getStoryProgressAnnouncement(1).value, 7);
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run `node --import tsx --test src/components/invitation/story/storyNarrative.test.ts`.

Expected: FAIL because `storyNarrative.ts` does not exist.

- [ ] **Step 3: Implement the narrative types and exact scene data**

Create these types in `storyNarrative.ts`:

```ts
export type StoryCopyCue = { id: string; start: number; end: number; copy: string };
export type StoryScene = {
  id: string;
  title: string;
  start: number;
  end: number;
  narration: string;
  copyCues: readonly StoryCopyCue[];
  layerIds: readonly string[];
};
```

Use scene boundaries from Step 1. Use cue ranges `0.004–0.064`, `0.235–0.325`, `0.365–0.485`, `0.515–0.605`, `0.625–0.708`, `0.742–0.825`, and `0.875–0.985`. Scene 2 has no cue and uses narration `사이드카 오토바이를 타고 같은 방향을 바라보는 두 사람`.

Use this exact ownership map; titles are also the chapter-nav labels:

| Scene | Title | Narration | `layerIds` |
|---|---|---|---|
| `jeju-opening` | 제주 오프닝 | 예찬과 주은의 결혼 이야기 | `bg-jeju`, `opening-island`, `title-shards` |
| `same-direction` | 같은 방향을 바라보는 두 사람 | 사이드카 오토바이를 타고 같은 방향을 바라보는 두 사람 | `opening-field`, `sidecar`, `wheel-front`, `wheel-back`, `opening-clouds` |
| `office-coworkers` | 처음엔 회사 동기 | 처음엔 회사 동기였던 두 사람 | `paper-tear`, `tower-card`, `bg-office`, `office-yechan`, `office-jueun`, `office-props` |
| `joke-and-laughter` | 농담과 웃음 | 예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다. | `bg-laugh`, `panel-left`, `panel-right`, `joke-yechan`, `jueun-expression`, `laugh-burst` |
| `lifelong-partners` | 평생의 짝꿍 | 그렇게 평생 웃겨주고 웃어주는 짝꿍이 되기로 했습니다. | `bg-journey`, `proposal-triptych`, `ring-glint`, `venue-reveal` |
| `seoul-venue` | 서울로 돌아와 결혼식장으로 | `2026.12.19 오후 12시 30분, 잠실 아펠가모에서요!` | `bg-venue`, `venue-reveal`, `venue-doors`, `casual-couple`, `matchcut-strip`, `wedding-couple` |
| `wedding-finale` | 하객들과 함께하는 결혼식 | 예찬 ♥ 주은, 소중한 분들과 함께 우리 결혼합니다!! | `bg-finale`, `wedding-couple`, `crowd-left`, `crowd-right`, `confetti-back`, `confetti`, `confetti-front`, `final-title`, `invitation-paper` |

Build scene 6 from config:

```ts
const ceremonyCopy = `${formatCeremonyDateShort().replaceAll(" ", "")} ${formatCeremonyTime()},\n${wedding.venue.name}에서요!`;
```

Export `STORY_COPY_CUES = STORY_SCENES.flatMap(({ copyCues }) => copyCues)`. Build `CHAPTERS` from the seven scenes. Announcements return `{ sceneId, value, text }` with values `1..7`.

- [ ] **Step 4: Keep the old renderer contract isolated until Task 2**

Do not edit `storyTimeline.ts`, `WeddingStory.tsx`, or `useStoryTimeline.ts` yet. The new module is additive in Task 1; this keeps both the focused test and all existing runtime tests passing at the commit boundary.

- [ ] **Step 5: Verify and commit**

Run:

```bash
node --import tsx --test src/components/invitation/story/storyNarrative.test.ts
npm run test:story
```

Both the focused test and the full existing suite must pass.

Commit:

```bash
git add src/components/invitation/story/storyNarrative.ts src/components/invitation/story/storyNarrative.test.ts
git commit -m "feat: define seven-scene wedding narrative"
```

---

### Task 2: Render seven scenes and seven copy cues accessibly

**Files:**
- Modify: `src/components/invitation/story/WeddingStory.tsx`
- Modify: `src/components/invitation/story/StoryFallback.tsx`
- Modify: `src/components/invitation/story/WeddingStory.module.css`
- Modify: `src/components/invitation/story/storyAssets.ts`
- Modify: `src/components/invitation/story/storyTimeline.ts`
- Modify: `src/components/invitation/story/useStoryTimeline.ts`
- Modify: `src/components/invitation/story/storyPresentation.test.ts`
- Modify: `src/components/invitation/story/storyAssets.test.ts`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`

**Interfaces:**
- Consumes: `STORY_SCENES`, `STORY_COPY_CUES`, `CHAPTERS`, and announcement helpers from Task 1.
- Produces: seven SSR transcript items, seven progress steps, seven fallback panels, and copy cards keyed by cue ID.
- Preserves: skip link, motion handshake, reload ownership, layer tree, and canvas containment.

- [ ] **Step 1: Read local Next.js 16 guidance**

Read completely:

```bash
cat node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md
cat node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
cat node_modules/next/dist/docs/03-architecture/accessibility.md
```

- [ ] **Step 2: Change actual component tests and verify RED**

Assert seven transcript items, seven `[data-story-copy]` nodes, seven fallback articles, `aria-valuemax="7"`, exact approved copy, and absence of `짝꿍이 되기도 했습니다.`. Run `node --import tsx --test src/components/invitation/story/storyPresentation.test.ts` and expect failure against the 16-shot/six-panel implementation.

- [ ] **Step 3: Migrate `WeddingStory` to scenes and copy cues**

Render `STORY_SCENES` in the hidden transcript and `STORY_COPY_CUES` in `.storyCopy`:

```tsx
<ol className={styles.transcript} aria-label="결혼 이야기 전체 대본">
  {STORY_SCENES.map((scene) => <li key={scene.id}>{scene.narration}</li>)}
</ol>

{STORY_COPY_CUES.map((copyCue, index) => (
  <article key={copyCue.id} data-story-copy={copyCue.id}
    data-copy-start={copyCue.start} data-copy-end={copyCue.end}
    className={styles.copyCard}
    style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}>
    <p className={styles.copyLine}>{copyCue.copy}</p>
  </article>
))}
```

Set `aria-valuemax={STORY_SCENES.length}` and add `white-space: pre-line` to `.copyLine`.

In `useStoryTimeline.ts`, replace `SHOTS` lookup with `STORY_SCENES`, rename local `lastShot`/`shot` variables to `lastScene`/`scene`, and set the existing `data-shot` attribute to `announcement.sceneId` for DOM compatibility. Keep chapter lookup and all paint logic unchanged.

In `storyTimeline.ts`, remove the old `StoryShot`, `SHOTS`, chapter/copy arrays, and announcement helpers. Import `STORY_SCENES` for `assertStoryTimeline()`, validate scene contiguity plus every `scene.layerIds` entry, and stop requiring the removed `chapterId` field. Update `storyTimeline.test.ts` imports and public-count assertions to `STORY_SCENES` while retaining every layer/math assertion.

- [ ] **Step 4: Expand reduced-motion fallback to seven scenes**

Use this exact mapping:

```ts
export const STORY_FALLBACK_PANELS = [
  { assetId: "openingBackground", sceneId: "jeju-opening" },
  { assetId: "sidecarRoad", sceneId: "same-direction" },
  { assetId: "officeBackground", sceneId: "office-coworkers" },
  { assetId: "laughPanel", sceneId: "joke-and-laughter" },
  { assetId: "proposalTriptych", sceneId: "lifelong-partners" },
  { assetId: "venueExterior", sceneId: "seoul-venue" },
  { assetId: "paperVeil", sceneId: "wedding-finale" },
] as const;
```

Resolve scene title/narration from `STORY_SCENES`. Keep the first fallback image eager with `fetchPriority="low"`; keep six images lazy and do not add fallback preloads.

- [ ] **Step 5: Verify and commit**

Run:

```bash
node --import tsx --test src/components/invitation/story/storyPresentation.test.ts src/components/invitation/story/storyAssets.test.ts
npm run test:story
```

All presentation/asset tests must pass; no production/test expectation may require six fallback panels or 16 transcript items.

Commit:

```bash
git add src/components/invitation/story/WeddingStory.tsx src/components/invitation/story/StoryFallback.tsx src/components/invitation/story/WeddingStory.module.css src/components/invitation/story/storyAssets.ts src/components/invitation/story/storyTimeline.ts src/components/invitation/story/useStoryTimeline.ts src/components/invitation/story/storyPresentation.test.ts src/components/invitation/story/storyAssets.test.ts src/components/invitation/story/storyTimeline.test.ts
git commit -m "feat: present seven illustrated story scenes"
```

---

### Task 3: Retime existing artwork into seven-scene choreography

**Files:**
- Modify: `src/components/invitation/story/storyTimeline.ts`
- Modify: `src/components/invitation/story/storyTimeline.test.ts`
- Create: `src/components/invitation/story/storySevenScene.test.ts`

**Interfaces:**
- Consumes: seven boundaries from Task 1 and current `STORY_LAYER_DEFINITIONS` IDs.
- Produces: `retimeLegacyStoryProgress(at: number): number` and retimed `LAYER_TRACKS`.
- Preserves: sidecar-wheel tree, triptych crops, venue stacks, wardrobe match cut, crowd parallax, and veil.

- [ ] **Step 1: Write retiming/choreography tests and verify RED**

Create tests that assert:

```ts
assert.deepEqual(
  [0, 0.05, 0.15, 0.33, 0.52, 0.7, 0.86, 1].map(retimeLegacyStoryProgress),
  [0, 0.08, 0.18, 0.34, 0.5, 0.72, 0.84, 1],
);
assert.equal(track("wheel-front").parentId, "sidecar");
assert.equal(track("wheel-back").parentId, "sidecar");
assert.ok(sampleLayerState(track("office-yechan"), 0.27).opacity > 0.5);
assert.ok(sampleLayerState(track("jueun-expression"), 0.45).opacity > 0.5);
assert.ok(sampleLayerState(track("proposal-triptych"), 0.55).opacity > 0.98);
assert.ok(sampleLayerState(track("proposal-triptych"), 0.68).opacity > 0.98);
assert.ok(sampleLayerState(track("bg-venue"), 0.74).opacity > 0.98);
assert.ok(sampleLayerState(track("venue-doors"), 0.8).opacity > 0.002);
assert.ok(sampleLayerState(track("wedding-couple"), 0.9).opacity > 0.5);
```

Run `node --import tsx --test src/components/invitation/story/storySevenScene.test.ts`. Expected: FAIL because retiming does not exist.

- [ ] **Step 2: Implement piecewise retiming**

Add:

```ts
const LEGACY_TO_SEVEN_SCENE = [
  [0, 0], [0.05, 0.08], [0.15, 0.18], [0.33, 0.34],
  [0.52, 0.5], [0.7, 0.72], [0.86, 0.84], [1, 1],
] as const;

export function retimeLegacyStoryProgress(at: number) {
  const clamped = Math.min(1, Math.max(0, at));
  const upper = LEGACY_TO_SEVEN_SCENE.findIndex(([legacy]) => legacy >= clamped);
  if (upper <= 0) return 0;
  const [fromLegacy, fromNext] = LEGACY_TO_SEVEN_SCENE[upper - 1];
  const [toLegacy, toNext] = LEGACY_TO_SEVEN_SCENE[upper];
  const local = (clamped - fromLegacy) / (toLegacy - fromLegacy);
  return fromNext + (toNext - fromNext) * local;
}
```

Retiming happens once when tracks are created, never per animation frame.

- [ ] **Step 3: Retime every authored frame type**

Use:

```ts
const retimeNumberFrames = (frames?: readonly NumberFrame[]) =>
  frames?.map((frame) => ({ ...frame, at: retimeLegacyStoryProgress(frame.at) }));
const retimeClipFrames = (frames?: readonly ClipFrame[]) =>
  frames?.map((frame) => ({ ...frame, at: retimeLegacyStoryProgress(frame.at) }));
```

Apply the number helper to derived and explicit x/y/scale/rotate/opacity/origin frames and the clip helper to clip frames in `toLogicalTrack`. Preserve ease names, source coordinates, asset IDs, parent IDs, sprite crops, and composite stacks.

- [ ] **Step 4: Replace old public invariants with seven-scene invariants**

Assert seven contiguous scenes from 0 to 1. Sample all six boundaries at `boundary ± 0.0075`; require outgoing and incoming owned layers above opacity `0.25`, with `paper-tear` accepted as the scene-2→3 spatial bridge. Retain background coverage, reverse/direct-jump determinism, wheel attachment, triptych crop, diagonal venue reveal, wardrobe match cut, crowd, and veil assertions at retimed progress.

- [ ] **Step 5: Verify and commit**

Run:

```bash
node --import tsx --test src/components/invitation/story/storySevenScene.test.ts src/components/invitation/story/storyTimeline.test.ts
npm run test:story
npm run typecheck
npm run build
git diff --check
```

If sandbox IPC or Google Fonts blocks the exact command, rerun that command with approval. All commands must pass before commit.

Commit:

```bash
git add src/components/invitation/story/storyTimeline.ts src/components/invitation/story/storyTimeline.test.ts src/components/invitation/story/storySevenScene.test.ts
git commit -m "feat: retime doodle story into seven scenes"
```

---

### Task 4: Verify seven-scene experience and update project truth

**Files:**
- Create: `docs/superpowers/evidence/2026-08-28-seven-scene-story-qa.md`
- Modify: `docs/todo.md`
- Modify: `docs/requirements.md`
- Modify only after a failing test if browser QA exposes a production defect: the file named by that contract

**Interfaces:**
- Consumes: completed narrative, renderer, and timeline from Tasks 1–3.
- Produces: browser evidence, requirement mapping, clean verification, and real-device handoff.

- [ ] **Step 1: Reuse or start one dev server**

Run `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Start `npm run dev` only if port 3000 is free. Confirm `/` in the controller browser.

- [ ] **Step 2: Sample all scenes at three viewports**

At `390×844`, `430×932`, and `1280×720`, sample start/mid/end for `[0,.08]`, `[.08,.18]`, `[.18,.34]`, `[.34,.50]`, `[.50,.72]`, `[.72,.84]`, `[.84,1]`. Save seven midpoint screenshots per viewport. Record viewport/DPR, story height/travel, active scene, copy, active layers, and horizontal overflow.

- [ ] **Step 3: Verify boundaries, jumps, and restoration**

Reverse all six boundaries and test `top→58%`, `58%→12%`, `bottom→top`, refresh at 42% and 82%, and `/admin→back→forward`. Reload positions must return to the same scene within 1px after layout settles.

- [ ] **Step 4: Verify routes, fallback, style, and console**

Check `/`, `/i/not-a-valid-token`, and `/admin`. Use automated reduced-motion coverage if browser media emulation is unavailable and state that limitation. Confirm identical character faces/proportions, thick uneven ink, colored-pencil texture, no clipped focal content, exact copy, no pseudo-text, distortion, overflow, hidden required layers, or application console errors.

- [ ] **Step 5: Write evidence and update docs**

Create `docs/superpowers/evidence/2026-08-28-seven-scene-story-qa.md`. Update `docs/todo.md` from the former 6-chapter/16-shot public narrative to the approved seven scenes. Update `docs/requirements.md` to map seven scenes, seven transcript items, existing 41-layer engine, seven fallback cards, and config-derived venue copy. Keep iOS/Kakao sticky feel, map deep links, clipboard, `navigator.share`, Kakao preview, and `.ics` handoff explicitly unverified on desktop.

- [ ] **Step 6: Run final verification**

Run:

```bash
npm run test:story
npm run typecheck
npm run build
git diff --check
rg -n '짝꿍이 되기도|16숏|16개 숏|6챕터' src/components/invitation/story docs/todo.md docs/requirements.md
git status --short
```

Expected: commands pass and forbidden old public-copy matches are absent from production/current requirement statements. Historical specs/plans may keep old terms.

- [ ] **Step 7: Commit docs and request final review**

```bash
git add docs/superpowers/evidence/2026-08-28-seven-scene-story-qa.md docs/todo.md docs/requirements.md
git commit -m "docs: verify seven-scene wedding story"
```

Generate a review package from `fd0f063` through the final docs commit. The reviewer checks the spec, exact copy, seven-scene/public-vs-internal boundary, character asset identity, config-derived venue line, deterministic transitions, fallback/SSR behavior, browser evidence, and unrelated sensitive-path diffs. Resolve findings with RED→GREEN tests and request re-review.
