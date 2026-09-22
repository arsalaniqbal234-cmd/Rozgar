# Category-aware job previews

The home page renders `HoverScrubImage` at the top of each job card, inside `TiltCard` and before the company row. The preview is decorative; job links, bookmarks, likes, and card behavior stay outside it.

```tsx
import HoverScrubImage from "@/app/components/hover-scrub-image";
import { resolveJobCategory } from "@/lib/job-preview-config";

<HoverScrubImage
  category={resolveJobCategory(job)}
  images={job.preview_images ?? undefined}
  companyLogo={hasCompanyLogo(job.company, job.source_id)
    ? <CompanyLogo company={job.company} variant={0} sourceId={job.source_id} jobUrl={job.url} />
    : undefined}
  companyName={job.company}
  alt={`${job.company} job preview`}
  className="aspect-[16/9] w-full"
  transition="crossfade" // or "instant"
/>
```

## Curated image sets

`lib/job-preview-config.ts` is the lookup table. It maps 15 categories, plus a general fallback, to two distinct SVG product mockups each in `public/job-previews/ui/`. The first frame is a styled employer logo card when a logo is available; the next two frames are field-specific fake interfaces. Without a known logo, the first mockup is the first frame. Real `preview_images`, if later supplied by the API, override category artwork.

Current API jobs have no category or tags, so the resolver uses title keywords as a bridge. Explicit category and tags take priority. Unrecognized jobs use the general mockup. To add a field, add its palette and field content in `scripts/generate-preview-benchmarks.mjs`, then add an entry in `CATEGORY_IMAGE_SETS` and a keyword pattern. Run `node scripts/generate-preview-benchmarks.mjs` from `Frontend` to regenerate the local library. The three approved benchmark SVGs are regenerated alongside production assets. Keep paths stable to benefit from browser caching.

A local library is the more practical choice for 10–15 job fields: you control relevance and visual quality, avoid a runtime image service dependency, and can cache a small fixed set. An illustration library such as unDraw can be a source for manually curated assets, but automatic image search per job can produce unrelated or repeated results. Review the license of any third-party assets before adding them.

## Interaction and performance

On hover enter the component caches its bounding rect and preloads remaining image URLs. On mouse move it computes `offsetX = clientX - rect.left`, clamps `offsetX / rect.width` to 0–1, and selects `floor(percent * frameCount)`. One `requestAnimationFrame` processes the latest pointer position; DOM opacity changes only when the selected frame changes. React does not render for every pixel. Crossfade uses a 200 ms opacity transition and respects reduced motion; `transition="instant"` removes it. Touch and coarse-pointer devices keep frame one.

Static image layers trade a little DOM and image memory for simple, flicker-free transitions. A CSS sprite can use one request and `background-position`, but needs fixed frame dimensions, a sprite build step, and downloads every frame upfront. The URL-based approach works with company-specific images and variable assets. Avoid huge source images: each hovered card preloads its full set.

## Field-specific motion previews

The home page resolves `motionSrc` from `CATEGORY_MOTION_PREVIEWS` for every category when a job has no real `preview_images`. Every animated SVG preserves its static mockup and uses a six-second loop. Engineering reveals code; Design layers and swatches; Healthcare appointment rows; Sales and Data draw chart lines; Marketing and Finance grow chart bars. Workspace fields reveal their relevant rows and animate a field-specific progress, route, document, or scan indicator. Run `node scripts/generate-preview-benchmarks.mjs` from `Frontend` after editing the motion CSS or shared tokens.

`HoverScrubImage` mounts this trusted local SVG as an `<object>` only while its card is hovered, within the viewport, and the page is visible. Unmounting on leave resets the loop. Touch or coarse pointers and reduced-motion preferences keep the static first frame. The static image stays underneath until the SVG loads, so a slow or failed asset does not create a blank preview. The existing scrub behavior remains available for other categories.

For these vector UI mockups, CSS-animated SVG is the current choice: one editable local asset per field and no video rendering pipeline. Video becomes attractive if previews include photographic footage, complex effects, or measured SVG animation cost becomes high. MP4/WebM clips need encoding, quality tuning, alternate formats where required, and a poster image. The hover and visibility gates keep the grid from animating every card at once.
