import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { JobPreviewCategory } from "../lib/job-preview-config";
import { previewArtwork } from "../scripts/preview-artwork.mjs";
import { animateInteraction, expandWindow } from "./interactions";

export type PreviewProps = { category: JobPreviewCategory; variant: 1 | 2 };
export const PREVIEW = { width: 960, height: 720, fps: 30, durationInFrames: 180 } as const;

/** Offline-only SVG artwork. Every interaction and UI response uses the video frame. */
export function CategoryPreview({ category, variant }: PreviewProps) {
  const frame = useCurrentFrame();
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    element.innerHTML = previewArtwork(category, variant);
    const svg = element.querySelector("svg")!;
    // Crossfade the changed interface back to its idle state before the loop boundary.
    // The cursor has its own return route, rather than reversing the interaction.
    animateInteraction(svg, category, variant, frame);
    if (frame >= 163) {
      const initial = new DOMParser().parseFromString(previewArtwork(category, variant), "image/svg+xml").documentElement as unknown as SVGSVGElement;
      animateInteraction(initial, category, variant, 0);
      const cover = document.createElementNS("http://www.w3.org/2000/svg", "g");
      // Reuse the base SVG's definitions; avoid duplicate IDs in the reset overlay.
      [...initial.children].filter(node => !["defs", "style", "title", "desc"].includes(node.tagName)).forEach(node => cover.append(node));
      cover.style.opacity = String(interpolate(frame, [163, 179], [0, 1], { easing: Easing.inOut(Easing.cubic) }));
      svg.append(cover);
    }
    expandWindow(svg);
    svg.style.width = "100%";
    svg.style.height = "100%";
  }, [category, variant, frame]);
  return <AbsoluteFill><div ref={root} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
}

export function EngineeringPreview() {
  return <CategoryPreview category="engineering" variant={1} />;
}
