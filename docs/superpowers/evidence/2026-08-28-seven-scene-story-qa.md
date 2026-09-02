# Seven-scene wedding story QA

Date: 2026-09-03 (Asia/Seoul)
Target: `http://localhost:3000/` at `72c73f1`
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
| 1 | `[0,.08]` `jeju-opening` | 예찬과 주은의 결혼 이야기 | `bg-jeju`, `opening-island`, `title-shards` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-1.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-1.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-1.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-1.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-1.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-1.png) |
| 2 | `[.08,.18]` `same-direction` | 없음 (의도) | `opening-field`, `sidecar`, `wheel-front`, `wheel-back`, `opening-clouds` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-2.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-2.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-2.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-2.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-2.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-2.png) |
| 3 | `[.18,.34]` `office-coworkers` | 처음엔 회사 동기였던 두 사람 | `paper-tear`, `tower-card`, `bg-office`, `office-yechan`, `office-jueun`, `office-props` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-3.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-3.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-3.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-3.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-3.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-3.png) |
| 4 | `[.34,.50]` `joke-and-laughter` | 예찬의 재미난 농담에 주은은 배꼽이 빠질 뻔했던 적이 한두 번이 아니었습니다. | `bg-laugh`, `panel-left`, `panel-right`, `joke-yechan`, `jueun-expression`, `laugh-burst` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-4.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-4.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-4.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-4.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-4.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-4.png) |
| 5 | `[.50,.72]` `lifelong-partners` | midpoint은 두 cue 사이의 의도된 공백; `.55999` 그렇게 평생 웃겨주고 웃어주는, `.67008` 짝꿍이 되기로 했습니다. | `bg-journey`, `proposal-triptych`, `ring-glint`, `venue-reveal` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-5.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-5.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-5.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-5.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-5.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-5.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-partners-056.png](/private/tmp/wed-invi-seven-scene-final/430x932-partners-056.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-partners-067.png](/private/tmp/wed-invi-seven-scene-final/430x932-partners-067.png) |
| 6 | `[.72,.84]` `seoul-venue` | `src/config/wedding.ts`에서 파생한 예식 일시·잠실 아펠가모 문구 | `bg-venue`, `venue-reveal`, `venue-doors`, `casual-couple`, `matchcut-strip`, `wedding-couple` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-6.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-6.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-6.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-6.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-6.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-6.png) |
| 7 | `[.84,1]` `wedding-finale` | 예찬 ♥ 주은 / 소중한 분들과 함께, / 우리 결혼합니다!! | `bg-finale`, `wedding-couple`, `crowd-left`, `crowd-right`, `confetti-back`, `confetti`, `confetti-front`, `final-title`, `invitation-paper` | [/private/tmp/wed-invi-seven-scene-final/390x844-scene-7.png](/private/tmp/wed-invi-seven-scene-final/390x844-scene-7.png)<br>[/private/tmp/wed-invi-seven-scene-final/430x932-scene-7.png](/private/tmp/wed-invi-seven-scene-final/430x932-scene-7.png)<br>[/private/tmp/wed-invi-seven-scene-final/1280x720-scene-7.png](/private/tmp/wed-invi-seven-scene-final/1280x720-scene-7.png) |

## Visual and motion checks

- All inspected midpoint captures retain thick uneven ink and the
  colored-pencil/crayon treatment. No pseudo-text, stretched subject, clipped
  required focal content, blank scene, or horizontal overflow was observed.
- Scene 2 shows the existing two-rider sidecar above the opaque road at all
  three viewports; faces, glasses, hair, proportions, source crops, and wheel
  relationship are retained.
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
