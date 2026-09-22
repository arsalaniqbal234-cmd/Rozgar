"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { imagesForCategory } from "../../lib/job-preview-config";

type HoverScrubImageProps = {
  category?: string | null;
  /** Real screenshots override the curated category artwork. */
  images?: readonly string[];
  companyLogo?: ReactNode;
  companyName?: string;
  alt: string;
  className?: string;
  transition?: "crossfade" | "instant";
  tilt?: boolean;
  /** Optional trusted local SVG motion asset. Mounted only while hovered and visible. */
  motionSrc?: string;
};

/** Decorative preview: keep links and card actions outside this element. */
export default function HoverScrubImage({ category, images, companyLogo, companyName, alt, className = "", transition = "crossfade", tilt = false, motionSrc }: HoverScrubImageProps) {
  const urls = (images?.length ? images : imagesForCategory(category)).filter(Boolean);
  const hasIdentity = Boolean(companyLogo);
  const count = urls.length + Number(hasIdentity);
  const root = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLElement | null)[]>([]);
  const markers = useRef<(HTMLSpanElement | null)[]>([]);
  const bounds = useRef<DOMRect | null>(null);
  const raf = useRef<number | null>(null);
  const desired = useRef(0);
  const shown = useRef(0);
  const hovered = useRef(false);
  const loaded = useRef(new Set<string>());
  const preloaders = useRef<HTMLImageElement[]>([]);
  const [motionHovered, setMotionHovered] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const key = `${hasIdentity}|${urls.join("|")}`;
  const playMotion = Boolean(motionSrc && motionHovered && inView && motionAllowed && pageVisible);

  useEffect(() => {
    if (!motionSrc) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, [motionSrc]);

  useEffect(() => {
    if (!motionSrc || !root.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.01 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [motionSrc]);

  useEffect(() => {
    if (!motionSrc) return;
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [motionSrc]);

  useEffect(() => {
    if (!motionSrc) return;
    const card = root.current?.closest(".job-card");
    if (!card) return;
    const enter = () => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setMotionHovered(true);
    };
    const leave = () => { setMotionHovered(false); setMotionReady(false); };
    card.addEventListener("mouseenter", enter);
    card.addEventListener("mouseleave", leave);
    return () => { card.removeEventListener("mouseenter", enter); card.removeEventListener("mouseleave", leave); };
  }, [motionSrc]);

  useEffect(() => {
    loaded.current = new Set(urls.slice(0, hasIdentity ? 0 : 1));
    shown.current = 0;
    desired.current = 0;
    layers.current.forEach((layer, index) => { if (layer) layer.style.opacity = index === 0 ? "1" : "0"; });
    markers.current.forEach((marker, index) => { if (marker) marker.style.opacity = index === 0 ? "1" : ".45"; });
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
      preloaders.current.forEach(image => { image.onload = null; image.onerror = null; });
      preloaders.current = [];
    };
    // The frame sequence is stable across unrelated parent renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function show(index: number) {
    const url = urls[index - Number(hasIdentity)];
    if (index === shown.current || (url && !loaded.current.has(url))) return;
    layers.current.forEach((layer, position) => { if (layer) layer.style.opacity = position === index ? "1" : "0"; });
    markers.current.forEach((marker, position) => { if (marker) marker.style.opacity = position === index ? "1" : ".45"; });
    shown.current = index;
  }

  function preload() {
    urls.forEach(url => {
      if (loaded.current.has(url) || preloaders.current.some(image => image.src === new URL(url, window.location.href).href)) return;
      const image = new window.Image();
      preloaders.current.push(image);
      image.onload = () => {
        loaded.current.add(url);
        if (hovered.current && urls[desired.current - Number(hasIdentity)] === url) show(desired.current);
      };
      image.src = url;
    });
  }

  function canHover() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (playMotion || !hovered.current || count < 2 || !canHover()) return;
    const rect = bounds.current || event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const offsetX = event.clientX - rect.left;
    const percent = Math.min(1, Math.max(0, offsetX / rect.width));
    desired.current = Math.min(count - 1, Math.floor(percent * count));
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      show(desired.current);
      if (tilt && root.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        root.current.style.setProperty("--scrub-tilt", `${(percent - .5) * 5}deg`);
    });
  }

  function onLeave() {
    if (!root.current?.closest(".job-card")) { setMotionHovered(false); setMotionReady(false); }
    hovered.current = false;
    bounds.current = null;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    desired.current = 0;
    root.current?.style.setProperty("--scrub-tilt", "0deg");
    show(0);
  }

  if (!count) return null;
  const fade = transition === "crossfade" ? "transition-opacity duration-200 ease-out motion-reduce:transition-none" : "transition-none";
  return <div ref={root} role="img" aria-label={alt}
    className={`relative isolate overflow-hidden rounded-xl bg-[var(--surface-strong)] ${tilt ? "[transform:perspective(900px)_rotateY(var(--scrub-tilt,0deg))]" : ""} ${className}`}
    onMouseEnter={event => { if (canHover()) { bounds.current = event.currentTarget.getBoundingClientRect(); hovered.current = true; if (motionSrc && motionAllowed) setMotionHovered(true); else preload(); } }}
    onMouseMove={onMove} onMouseLeave={onLeave}>
    {hasIdentity && <div ref={node => { layers.current[0] = node; }} aria-hidden
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-5 text-center ${fade}`}>
      <div className="scale-[1.8] rounded-2xl bg-white p-2 shadow-lg shadow-emerald-950/10">{companyLogo}</div>
      <span className="mt-4 max-w-full truncate text-lg font-bold text-emerald-950">{companyName}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-700">{category || "Career opportunity"}</span>
    </div>}
    {/* Local and job supplied URLs are intentionally supported without Next image host configuration. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {urls.map((url, index) => <img key={`${url}-${index}`} ref={node => { layers.current[index + Number(hasIdentity)] = node; }}
      src={url} alt="" aria-hidden draggable={false} loading="lazy"
      className={`absolute inset-0 h-full w-full select-none object-cover ${fade}`}
      style={{ opacity: !hasIdentity && index === 0 ? 1 : 0 }} />)}
    {playMotion && <object data={motionSrc} type="image/svg+xml" aria-hidden="true" tabIndex={-1}
      onLoad={() => setMotionReady(true)}
      className={`pointer-events-none absolute inset-0 z-10 h-full w-full transition-opacity duration-200 ${motionReady ? "opacity-100" : "opacity-0"}`} />}
    {count > 1 && <div aria-hidden className="pointer-events-none absolute bottom-3 left-3 flex gap-1.5 rounded-full bg-emerald-950/45 px-2 py-1.5 backdrop-blur-sm">
      {Array.from({ length: count }, (_, index) => <span key={index} ref={node => { markers.current[index] = node; }}
        className="h-1 w-5 rounded-full bg-white transition-opacity duration-150" style={{ opacity: index === 0 ? 1 : .45 }} />)}
    </div>}
  </div>;
}
