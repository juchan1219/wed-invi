# Full-illustration doodle story baseline

Date: 2026-08-14
Route: `/` (local development server)

## Checkpoint scope

- Prototype checkpoint: `d91d3ad` (`wip: checkpoint doodle story prototype`)
- The implementation-plan commit `578745d` was already in `HEAD` and is intentionally not part of that checkpoint.
- The checkpoint contains exactly the ten paths enumerated in Task 1: the two requirement/todo documents, three image scripts, three story components/styles, and the two generated doodle WebP assets.

## Next.js 16 implementation evidence

The following installed Next.js 16.2.12 references were searched and read in full:

1. `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
   - Local public paths are valid `src` values for `next/image`; `alt` is required (empty for decorative images).
   - A string source needs `width` and `height` unless it uses `fill`; a `fill` image requires a positioned parent. Responsive/fill images should provide `sizes`.
   - Next.js 16 deprecates `priority` in favor of `preload`, and restricts image quality values to the configured allowlist (default `[75]`).
   - The doodle sprite is deliberately a CSS `background-image`, rather than a `next/image` element. The proposal triptych remains rendered through the pre-existing `fill` image layer, whose positioned parent and `sizes` contract remain intact.

2. `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md`
   - Files under root `public/` are addressable from `/`; therefore the two assets are referenced as `/story/doodle-character-atlas-v1.webp` and `/story/doodle-proposal-triptych-v1.webp`.
   - `public/` assets default to `Cache-Control: public, max-age=0`; content-versioned filenames prevent ambiguity when replacing these generated art assets.

3. `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
   - `.module.css` files provide local class scoping and are intended for component-specific custom styles.
   - Production CSS chunk ordering follows JavaScript import order. The story changes stay in the already-imported `WeddingStory.module.css`, avoiding a new global stylesheet or a competing import path.

## Browser evidence

The in-app Browser was used against the local development route. Screenshots are stored outside the repository at `/tmp/wed-invi-full-illustration-baseline/`.

| Scene | Requested story progress | Observed scroll / progress | Observed shot | Actual viewport | Screenshot |
| --- | ---: | ---: | --- | --- | --- |
| Opening | 7% | 882px / 7.00% | `sidecar-arrives` | 1280x720 | `actual-1280x720-opening.png` |
| Office | 27% | 3402px / 27.00% | `awkward-desk` | 1280x720 | `actual-1280x720-office.png` |
| Proposal | 59% | 7434px / 59.00% | `route-connects` | 1280x720 | `actual-1280x720-proposal.png` |

Visual review of the three captures confirms the new visual direction is present: flat paper-color fields, heavy irregular black outlines, bean characters, CSS-built Jeju/office scenery, and the three-panel doodle proposal artwork.

### Verified mobile captures

The controller used the supported in-app Browser at `http://localhost:3000/`: it created each tab, then applied `browser.capabilities.get("viewport").set(...)`, navigated to the local page, measured the DOM viewport, and captured the viewport screenshot. `sips` independently confirmed every physical PNG dimension. The capability was reset after capture.

| Viewport | Scene | DOM viewport | Physical PNG | Scroll / progress | Observed shot | Screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 390x844 | Opening | 390x844 | 390x844 | 0px / 0% | `island-opens` | `actual-390x844-opening.png` |
| 390x844 | Office | 390x844 | 390x844 | 4063px / 27% | `through-window` | `actual-390x844-office.png` |
| 390x844 | Proposal | 390x844 | 390x844 | 8954px / 59% | `route-connects` | `actual-390x844-proposal.png` |
| 430x932 | Opening | 430x932 | 430x932 | 0px / 0% | `island-opens` | `actual-430x932-opening.png` |
| 430x932 | Office | 430x932 | 430x932 | 4704px / 28% | `awkward-desk` | `actual-430x932-office.png` |
| 430x932 | Proposal | 430x932 | 430x932 | 9960px / 59% | `route-connects` | `actual-430x932-proposal.png` |

### Earlier viewport no-op (troubleshooting history)

An earlier in-app Browser session accepted `viewport.set` before fresh-tab creation but kept the DOM and PNG output at 1280x720. Those nominal files (`390x844-opening.png`, `430x932-office.png`, and `1280x720-proposal.png`) remain diagnostic artifacts only. The controller-assisted captures above establish the valid mobile baseline; applying the supported override after each tab is created produced the requested dimensions.
