"use client";

import { useEffect, useRef, type ReactNode } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  enableTilt?: boolean;
  maxTilt?: number;
  glare?: boolean;
};

/** Wraps an existing card without changing its props or event handlers. */
export default function TiltCard({ children, className = "", enableTilt = true, maxTilt = 12, glare = false }: TiltCardProps) {
  const surface = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLDivElement>(null);
  const bounds = useRef<DOMRect | null>(null);
  const frame = useRef<number | null>(null);
  const point = useRef({ x: 0.5, y: 0.5 });

  function enabled() {
    return enableTilt && window.matchMedia("(hover: hover) and (pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    bounds.current = null;
    if (surface.current) {
      surface.current.style.transition = "transform 320ms cubic-bezier(.2,.8,.2,1)";
      surface.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    }
    if (shine.current) {
      shine.current.style.transition = "opacity 240ms ease-out";
      shine.current.style.opacity = "0";
    }
  }

  useEffect(() => {
    if (!enableTilt) reset();
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [enableTilt]);

  function move(event: React.MouseEvent<HTMLDivElement>) {
    if (!enabled() || !bounds.current) return;
    const rect = bounds.current;
    point.current = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const { x, y } = point.current;
      const tilt = Math.max(0, Math.min(30, maxTilt));
      if (surface.current) surface.current.style.transform = `rotateX(${(0.5 - y) * 2 * tilt}deg) rotateY(${(x - 0.5) * 2 * tilt}deg)`;
      if (shine.current) shine.current.style.transform = `translate3d(${(x - 0.5) * 85}%, ${(y - 0.5) * 85}%, 0)`;
    });
  }

  return <div className={`relative [perspective:1000px] ${className}`}
    onMouseEnter={event => {
      if (!enabled()) return;
      bounds.current = event.currentTarget.getBoundingClientRect();
      if (surface.current) surface.current.style.transition = "none";
      if (shine.current) { shine.current.style.transition = "opacity 180ms ease-out"; shine.current.style.opacity = "1"; }
    }} onMouseMove={move} onMouseLeave={reset}>
    <div ref={surface} className="relative h-full [transform-style:preserve-3d] [will-change:transform]">
      {children}
      {glare && <div aria-hidden ref={shine} className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit] opacity-0">
        <div className="absolute -inset-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.22),transparent_58%)]" />
      </div>}
    </div>
  </div>;
}
