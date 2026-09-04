# Seven-scene wedding story QA

Date: 2026-09-04 (Asia/Seoul)
Target: `http://localhost:3000/`, final review fix wave based on `72ba821`
Browser: Codex in-app browser, DPR 1

## Viewport sampling

Each of the seven scene ranges was sampled just inside its start and end and
at its midpoint: 21 settled samples per viewport. Every sample resolved to the
expected scene, had no horizontal overflow, and retained a contained canvas.

| Viewport | Story height | Travel | Contained stage | Largest progress error | Horizontal overflow |
|---|---:|---:|---:|---:|---:|
| 390×844 | 15,614 px | 14,770 px | 389.399×844.000 px | .00009 | 0 px |
| 430×932 | 17,242 px | 16,310 px | 430×932 px | .00006 | 0 px |
| 1280×720 | 13,320 px | 12,600 px | 332.188×719.998 px | .00002 | 0 px |

| # | Range / active scene | Midpoint copy | Active-layer contract | Capture references |
|---:|---|---|---|---|
| 1 | `[0,.08]` `jeju-opening` | 예찬과 주은의 결혼 이야기 | `bg-jeju`, `opening-island`, `title-shards` | [390×844](2026-08-28-seven-scene-story/390x844-scene-1.png)<br>[430×932](2026-08-28-seven-scene-story/430x932-scene-1.png)<br>[1280×720](2026-08-28-seven-scene-story/1280x720-scene-1.png) |
| 2 | `[.08,.18]` `same-direction` | 없음 (의도) | `opening-field`, `sidecar`, `wheel-front`, `wheel-back`, `opening-clouds` | [390×844 fixed](2026-08-28-seven-scene-story/390x844-scene-2-fixed.png)<br>[430×932 fixed](2026-08-28-seven-scene-story/430x932-scene-2-fixed.png)<br>[1280×720 fixed](2026-08-28-seven-scene-story/1280x720-scene-2-fixed.png) |
| 3 | `[.18,.34]` `office-coworkers` | 처음엔 회사 동기였던 두 사람 | `paper-tear`, `tower-card`, `bg-office`, `office-yechan`, `office-jueun`, `office-props` | [390×844](2026-08-28-seven-scene-story/390x844-scene-3.png)<br>[430×932](2026-08-28-seven-scene-story/430x932-scene-3.png)<br>[1280×720](2026-08-28-seven-scene-story/1280x720-scene-3.png) |
| 4 | `[.34,.50]` `joke-and-laughter` | 예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다. | `bg-laugh`, `panel-left`, `panel-right`, `joke-yechan`, `jueun-expression`, `laugh-burst` | [430×932 final](2026-08-28-seven-scene-story/430x932-scene-4-final.png) |
| 5 | `[.50,.72]` `lifelong-partners` | midpoint은 두 cue 사이의 의도된 공백; `.55999` 그렇게 평생 웃겨주고 웃어주는, `.67008` 짝꿍이 되기로 했습니다. | `bg-journey`, `proposal-triptych`, `ring-glint`, `venue-reveal` | [390×844](2026-08-28-seven-scene-story/390x844-scene-5.png)<br>[430×932](2026-08-28-seven-scene-story/430x932-scene-5.png)<br>[1280×720](2026-08-28-seven-scene-story/1280x720-scene-5.png)<br>[430×932 Hamburg](2026-08-28-seven-scene-story/430x932-partners-056.png)<br>[430×932 Tokyo](2026-08-28-seven-scene-story/430x932-partners-067.png)<br>[430×932 ring final](2026-08-28-seven-scene-story/430x932-ring-final.png) |
| 6 | `[.72,.84]` `seoul-venue` | `src/config/wedding.ts`에서 파생한 예식 일시·잠실 아펠가모 문구 | `bg-venue`, `venue-reveal`, `venue-doors`, `casual-couple`, `matchcut-strip`, `wedding-couple` | [390×844](2026-08-28-seven-scene-story/390x844-scene-6.png)<br>[430×932](2026-08-28-seven-scene-story/430x932-scene-6.png)<br>[1280×720](2026-08-28-seven-scene-story/1280x720-scene-6.png) |
| 7 | `[.84,1]` `wedding-finale` | 예찬 ♥ 주은 / 소중한 분들과 함께, / 우리 결혼합니다!! | `bg-finale`, `wedding-couple`, `crowd-left`, `crowd-right`, `confetti-back`, `confetti`, `confetti-front`, `final-title`, `invitation-paper` | [1280×720 final](2026-08-28-seven-scene-story/1280x720-scene-7-final.png) |

## Visual and motion checks

- All inspected midpoint captures retain thick uneven ink and the
  colored-pencil/crayon treatment. No pseudo-text, stretched subject, clipped
  required focal content, blank scene, or horizontal overflow was observed.
- Scene 2 shows the existing two-rider sidecar above the opaque road at all
  three viewports; faces, glasses, hair, proportions, source crops, and wheel
  relationship are retained.
- The final scene-4 recapture uses the office background for both split panels,
  keeps the approved narration as the only public copy, and contains no legacy
  speech-balloon art or text.
- At the scene-5 ring reveal, `ring-glint` renders at stack 18 above the opaque
  proposal triptych at stack 11; the final 430×932 capture confirms the ring is
  visible rather than hidden behind the strip.
- The scene-2 clipping review was recaptured after `316dc3b`: at `p≈.13`,
  the scene remains `same-direction` with opacity 1 and z-index 19, and both
  riders plus both wheels are fully inside the logical canvas at 390×844,
  430×932, and 1280×720. No horizontal overflow was observed.
- At 430×932, all six boundaries (`.08`, `.18`, `.34`, `.50`, `.72`, `.84`)
  were sampled at `±.0075` in both directions: all 24 states were within
  `.00002` of target, transitioned to the expected adjacent scene, and kept
  visible layers without a blank or stale-hidden frame. The `.08` handoff
  shows the title plus incoming sidecar above the road.

| Navigation check | Result |
|---|---|
| top → 58% | `.58001`, `lifelong-partners` |
| 58% → 12% | `.12002`, `same-direction` |
| bottom → top | `1`, `wedding-finale` → `0`, `jeju-opening` |
| reload at 42% | `.41999`, y=6850, `joke-and-laughter` before/after; 0 px delta |
| reload at 82% | `.82002`, y=13374.5, `seoul-venue` before/after; 0 px delta |
| `/admin → back → forward` | before `.81999`, y=13374, `seoul-venue`; Back restored exactly `.81999`, y=13374 (0 px delta); Forward returned to `/admin/login?next=%2Fadmin` |

## Routes, accessibility, and console

| Check | Result |
|---|---|
| `/` | Normal seven-scene invitation rendered. |
| `/i/not-a-valid-token` | Normal invitation, no letter/error section, and seven transcript items. |
| `/admin` | Redirected to the expected password login page. |
| Reduced motion | This browser surface cannot emulate the media preference. Automated real-component/jsdom coverage verifies pending/reduced non-sticky seven-card fallback, zero timeline observers/listeners, skip link, SSR transcript, and decorative image behavior. This is not browser-emulation evidence. |
| Console | No application console errors observed. Next development mode emitted LCP advisory warnings for story background images after direct progress jumps; recorded as non-blocking warnings, not runtime failures. |

## Desktop-only handoff

Not verified here: iOS sticky-scroll feel, KakaoTalk in-app sticky feel, map-app
deep links, clipboard copy, `navigator.share`, Kakao share/link preview, and
`.ics` calendar handoff. These require real-device testing.

## Task 4 follow-up — scene 2 clipping review

After production fix commit `316dc3b` (`fix: keep scene two sidecar in frame`),
the controller recaptured the scene-2 midpoint at `p≈.13` in the same-direction
scene. All three captures show opacity `1`, the sidecar above the opaque road at
z-index `19`, and both protagonists plus both wheels fully visible inside the
logical canvas, with 0 px horizontal overflow:

- 390×844: [durable capture](2026-08-28-seven-scene-story/390x844-scene-2-fixed.png)
- 430×932: [durable capture](2026-08-28-seven-scene-story/430x932-scene-2-fixed.png)
- 1280×720: [durable capture](2026-08-28-seven-scene-story/1280x720-scene-2-fixed.png)

The review confirms the midpoint transform correction preserves the existing
sidecar source crops, rider relationship, and wheel layering while removing the
previous right-edge clipping. The prior unfixed scene-2 paths above are retained
only in repository history, not as current QA evidence.

### Task 4 minor follow-up

The requirements choreography note was corrected to match the implemented and
tested sidecar entry transform: `520→30px` (not the stale `520→70px` value).
