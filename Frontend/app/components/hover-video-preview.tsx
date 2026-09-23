"use client";

import { useEffect, useRef } from "react";
import type { PreviewVideo } from "../../lib/job-video-config";

export type HoverVideoPreviewProps = {
  video: PreviewVideo;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
  /** An employer screenshot can remain the idle poster. */
  poster?: string;
};

/** Sources are attached only during an eligible hover, and released on exit. */
export default function HoverVideoPreview({ video, alt, className = "", poster, fit = "cover" }: HoverVideoPreviewProps) {
  const root = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  useEffect(() => {
    const node = player.current;
    const element = root.current;
    if (!node || !element) return;
    const card = element.closest(".job-card") ?? element;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let visible = false;
    let hovered = false;
    let active = false;
    let disposed = false;
    let generation = 0;
    let fallback = false;
    const stop = () => {
      generation++;
      if (!active && !node.childElementCount && !node.hasAttribute("src")) return;
      active = false;
      node.style.opacity = "0";
      node.pause();
      try { node.currentTime = 0; } catch { /* Media metadata may not be available yet. */ }
      node.removeAttribute("src");
      node.replaceChildren();
      node.load(); // Abort pending downloads and release the decoder.
    };
    const play = () => {
      const request = ++generation;
      void node.play().catch(() => {
        if (!disposed && request === generation) stop();
      });
    };
    const attach = (mp4Only = false) => {
      node.replaceChildren();
      const sources = mp4Only ? [[video.mp4, "video/mp4"]] : [[video.webm, 'video/webm; codecs="vp9"'], [video.mp4, "video/mp4"]];
      sources.forEach(([src, type]) => {
        const source = document.createElement("source");
        source.src = src;
        source.type = type;
        node.append(source);
      });
      node.load();
      play();
    };
    const sync = () => {
      if (disposed) return;
      const eligible = hovered && visible && !document.hidden && !reduced.matches && pointer.matches;
      if (eligible && !active) { active = true; fallback = false; attach(); }
      else if (!eligible && active) stop();
    };
    const enter = () => { hovered = true; sync(); };
    const leave = () => { hovered = false; sync(); };
    const playing = () => { if (active) node.style.opacity = "1"; };
    const error = () => {
      if (!active) return;
      if (!fallback) { fallback = true; attach(true); }
      else stop();
    };
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: .01 }) : null;
    // Without IntersectionObserver, stay on the poster rather than eagerly loading a grid.
    observer?.observe(element);
    card.addEventListener("mouseenter", enter);
    card.addEventListener("mouseleave", leave);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    node.addEventListener("playing", playing);
    node.addEventListener("error", error);
    return () => {
      disposed = true;
      observer?.disconnect();
      card.removeEventListener("mouseenter", enter);
      card.removeEventListener("mouseleave", leave);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
      node.removeEventListener("playing", playing);
      node.removeEventListener("error", error);
      stop();
    };
  }, [video.mp4, video.webm]);

  return <div ref={root} role="img" aria-label={alt} className={`relative isolate overflow-hidden rounded-xl bg-[var(--surface-strong)] ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={poster || video.poster} alt="" aria-hidden loading="lazy" decoding="async"
      className={`absolute inset-0 h-full w-full ${fitClass}`} />
    <video ref={player} muted loop playsInline preload="none" aria-hidden tabIndex={-1}
      disablePictureInPicture className={`pointer-events-none absolute inset-0 h-full w-full ${fitClass}`}
      style={{ opacity: 0 }} />
  </div>;
}
