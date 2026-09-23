# Rendered job previews

The repository contains **16 category keys with two approved designs each**, not 32 distinct categories. All **32 designs** have a Remotion composition, H.264 MP4, VP9 WebM and frame-zero JPEG poster. Cards use each category's primary interaction demo. Secondary activity designs remain available explicitly; job-ID parity no longer selects them. Add a category in `lib/job-preview-config.ts` and artwork in `scripts/preview-artwork.mjs` to extend the library.

## Commands

From `Frontend`, after `npm ci` (include development dependencies on the rendering machine):

```sh
npm run video:studio
npm run video:render                  # all 32 designs, both codecs and posters
npm run video:render -- engineering   # both Engineering designs
npm run video:render -- engineering-1 # standalone editor/typing example
npm run video:render -- --resume      # skip completed nonempty files
npm run video:verify                 # verify every codec, duration, resolution and poster
npm run typecheck
npm test -- tests/hover-video-preview.test.tsx --pool=threads --maxWorkers=1
```

The first render downloads Chromium. Remotion includes its encoder binaries; no manual screen recording, After Effects, or separately installed FFmpeg is needed. All Remotion packages are pinned to the same version. `REMOTION_CONCURRENCY` controls frame workers (default 2). Allow several minutes per composition on a small machine. Render offline, not inside a page request or serverless function. Resume only with unchanged source/settings; after an artwork change, render the affected category without `--resume`.

The typed Node script bundles once, rasterizes each composition once into lossless PNG frames, and encodes both formats from the same frames. Outputs replace their destinations only after successful encoding. Unique temporary frame directories are cleaned up per composition. `render-report.json` records sizes for the requested batch. Resume checks existence and nonzero length, not content hashes.

## Files and behavior

- `remotion/CategoryPreview.tsx`: full typed composition and `EngineeringPreview` example. `useCurrentFrame` drives deliberate click-response workflows implemented in `remotion/interactions.ts`: Engineering opens a file, types and builds; Marketing inspects a chart tooltip, updates reach and opens a report; other fields select a relevant item and perform their own action. The cursor pauses on real controls. The timeline is six seconds at 30 fps. No CSS animation or wall-clock timer drives the render.
- `scripts/preview-artwork.mjs`: approved SVG geometry and palettes shared with the static asset generator. Only trusted local artwork is inserted in the offline renderer; employer content is never inserted as SVG.
- `remotion/index.tsx`: registers all 32 compositions.
- `scripts/render-job-previews.mts`: automated renderer for MP4, WebM and frame-zero JPEG.
- `app/components/hover-video-preview.tsx`: native muted/looping/inline video with `preload="none"`. Sources attach only during visible, fine-pointer hover. Leaving, scrolling offscreen, hiding the tab, reduced motion, or unmounting pauses, resets, and releases the video. A lazy JPEG remains beneath playback until `playing` and stays visible on errors. WebM comes first, MP4 second; a media error also gets one explicit MP4 retry.
- `app/components/job-card.tsx`: matching-opportunities card with the badge JSX removed, larger preview and compact supporting content. An employer screenshot can remain the idle poster.
- `lib/job-video-config.ts`: asset URLs and optional CDN base URL.

The completed UI appears at frame zero, giving reduced-motion users a useful poster. The loop returns to that state at the end. Coarse-pointer devices and browsers without IntersectionObserver also retain the poster. No Remotion code enters the card's client bundle. The legacy scrub component remains for compatibility but is no longer used in the matching grid.

## Quality and file sizes

The output library contains 64 videos and 32 posters. Run `npm run video:verify` to check all codecs, dimensions, durations and pixel formats; exact byte counts are in `render-report.json`.

960x720, 30 fps, six seconds, silent, 4:2:0. H.264 uses CRF 23 / slow; VP9 uses CRF 32. UI footage compresses well because most pixels remain stationary. Budget **100-500 KB per video** for planning; busier motion can exceed that. Read `public/job-previews/video/render-report.json` for the final batch's exact sizes. Outputs above 500 KB are flagged. VP9 is not guaranteed to be smaller at independent quality settings. Lower CRF improves quality and increases size; inspect small UI text before imposing a hard bitrate cap.

## Hosting

At 300-500 KB each, 64 videos occupy 19-32 MB plus posters. Each browser requests its selected codec, not both. **Start with local `public/job-previews/video`**, already configured here: this collection is small enough to deploy with the app. Render separately and include the outputs before deploying; rendering is intentionally not part of `next build`.

For frequent media updates or high traffic, move the same files to **Cloudflare R2 behind a custom CDN domain**, under a versioned prefix. Set `NEXT_PUBLIC_JOB_VIDEO_BASE_URL=https://media.example.com/job-previews/v1` at frontend build time. Serve correct MIME types (`video/mp4`, `video/webm`, `image/jpeg`), byte-range requests, and `Cache-Control: public, max-age=31536000, immutable` on versioned URLs. Bump the prefix when replacing artwork. R2 separates media from app deployments and has no direct egress charge. Vercel Blob is also suitable if already used by the project; compare current storage/request/transfer charges before selecting it just for this small collection. This implementation does not provision external storage.

References: [Remotion frame rendering](https://www.remotion.dev/docs/renderer/render-frames), [encoding frames](https://www.remotion.dev/docs/renderer/stitch-frames-to-video), [posters](https://www.remotion.dev/docs/renderer/render-still), [R2 pricing](https://developers.cloudflare.com/r2/pricing/). Check [Remotion's license](https://www.remotion.dev/license) for your organization before commercial use.

## Card proportions and verification

Three desktop columns, two tablet columns and one mobile column remain unchanged. The preview adds exactly 48 CSS pixels to its previous height at each grid-card width (`calc(62.5cqw + 48px)`). The rendered interface now has a 960x720 canvas: window geometry expands vertically while font sizes and corner radii stay unchanged. This gives the larger preview actual interface content rather than letterboxing or stretching a video bitmap.

Company and job-title font sizes are unchanged. Preview bottom margin drops 12 to 8 px; title top margin 10 to 6; location margin 6 to 3; tag margins 9/12 to 5/6; footer padding 9 to 4. Stats remain in their own compact row. Secondary text decreases by 0.5-1 px. Long titles remain fully readable; cards use natural height and equal-height grid rows rather than clipping content.

Measured in Chromium at a 1440 px desktop viewport with identical job content:

| Measurement (CSS pixels) | Before | After | Difference |
| --- | ---: | ---: | ---: |
| Preview height | 182.08 | 230.08 | +48.00 |
| Overall card height | 446.88 | 448.63 | +1.75 |
| Desktop columns | 3 | 3 | 0 |

Measurements depend on viewport and text wrapping. The browser regression asserts a 48 px preview increase and less than 5 px total-height difference. Desktop/mobile browser tests also cover list view, reduced motion, actual playback/reset, mixed-category title-only API records, and MP4 fallback after a WebM 404. Touch hover tests are intentionally skipped. The component test separately mounts 50 cards and verifies that only a visible, hovered card gets sources.

## Category resolution and cache revision

The current backend `JobResponse` does not expose categories or tags, so production records must be classified from titles. The old resolver missed "Pricing Strategist, GTM", accepted General metadata before looking at titles, and used broad substring matches (`ui` even matched parts of unrelated words). Category-specific URLs were already distinct; the fallback logic and the shared animation route were the problems.

`resolveJobCategory` now uses bounded role phrases, recognizes GTM/pricing strategy as Marketing, and treats General/Other/unknown metadata as a reason to continue inference. Specific supplied departments/tags remain authoritative. `videoForJob` centralizes the card mapping and selects the main category workflow. Unknown roles alone keep the General fallback. The asset test checks 32 unique stems and 32 distinct SHA-256 hashes per codec, and the browser test verifies actual per-card source requests. `data-preview-category` exposes the resolved key for browser inspection without a visible badge.

The revised URLs carry `?v=2` so previously cached posters/videos are refreshed. If using immutable CDN paths, also publish these new files to a new versioned CDN prefix and update `NEXT_PUBLIC_JOB_VIDEO_BASE_URL`. Both design variants are still rendered and verified, although the main grid now intentionally uses the primary interaction for each category.
