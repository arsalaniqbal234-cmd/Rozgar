import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HoverScrubImage from "../app/components/hover-scrub-image";

const images = ["/job-previews/focus.svg", "/job-previews/connect.svg", "/job-previews/grow.svg"];

afterEach(() => vi.unstubAllGlobals());

describe("HoverScrubImage", () => {
  it("mounts Engineering motion only on hover, removes it outside the viewport, and resets on leave", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("hover: hover"), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    let observe: IntersectionObserverCallback | undefined;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { observe = callback; }
      observe() { /* captured callback controls visibility */ }
      disconnect() { /* cleanup */ }
    });
    const { getByRole } = render(<HoverScrubImage category="engineering" alt="Engineering preview" motionSrc="/job-previews/motion/engineering.svg" />);
    const preview = getByRole("img", { name: "Engineering preview" });
    expect(preview.querySelector("object")).toBeNull();
    fireEvent.mouseEnter(preview);
    await waitFor(() => expect(preview.querySelector("object")?.getAttribute("data")).toBe("/job-previews/motion/engineering.svg"));
    observe?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    await waitFor(() => expect(preview.querySelector("object")).toBeNull());
    observe?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await waitFor(() => expect(preview.querySelector("object")).not.toBeNull());
    fireEvent.mouseLeave(preview);
    expect(preview.querySelector("object")).toBeNull();
    fireEvent.mouseEnter(preview);
    await waitFor(() => expect(preview.querySelector("object")).not.toBeNull());
  });

  it("plays when any part of a job card is hovered", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("hover: hover"), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { container, getByRole } = render(<article className="job-card"><HoverScrubImage category="engineering" alt="Engineering preview" motionSrc="/job-previews/motion/engineering.svg" /><div>Job details</div></article>);
    const card = container.querySelector(".job-card")!;
    const preview = getByRole("img", { name: "Engineering preview" });
    fireEvent.mouseEnter(card);
    await waitFor(() => expect(preview.querySelector("object")).not.toBeNull());
    fireEvent.mouseLeave(preview);
    expect(preview.querySelector("object")).not.toBeNull();
    fireEvent.mouseLeave(card);
    expect(preview.querySelector("object")).toBeNull();
  });

  it("keeps motion disabled for touch and reduced-motion preferences", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("prefers-reduced-motion"), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { getByRole } = render(<HoverScrubImage category="engineering" alt="Static preview" motionSrc="/job-previews/motion/engineering.svg" />);
    const preview = getByRole("img", { name: "Static preview" });
    fireEvent.mouseEnter(preview);
    expect(preview.querySelector("object")).toBeNull();
    expect(preview.querySelector("img")?.getAttribute("src")).toBe("/job-previews/ui/engineering-1.svg");
  });

  it("does not mount motion on a hover device when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("hover: hover") || query.includes("prefers-reduced-motion"), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { container, getByRole } = render(<article className="job-card"><HoverScrubImage category="engineering" alt="Reduced motion preview" motionSrc="/job-previews/motion/engineering.svg" /></article>);
    fireEvent.mouseEnter(container.querySelector(".job-card")!);
    expect(getByRole("img", { name: "Reduced motion preview" }).querySelector("object")).toBeNull();
  });

  it("starts with the company identity and then shows category artwork", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private value = "";
      set src(src: string) { this.value = new URL(src, window.location.href).href; this.onload?.(); }
      get src() { return this.value; }
    });
    const { getByRole } = render(<HoverScrubImage category="design" companyLogo={<span>Acme logo</span>} companyName="Acme" alt="Acme preview" />);
    const preview = getByRole("img", { name: "Acme preview" });
    expect(preview.textContent).toContain("Acme logo");
    expect(preview.querySelector("img")?.getAttribute("src")).toBe("/job-previews/ui/design-1.svg");
    vi.spyOn(preview, "getBoundingClientRect").mockReturnValue({ left: 100, width: 300 } as DOMRect);
    fireEvent.mouseEnter(preview);
    fireEvent.mouseMove(preview, { clientX: 250 });
    await waitFor(() => expect(preview.querySelector("img")?.style.opacity).toBe("1"));
  });

  it("preloads on hover, scrubs by horizontal segment, and resets on leave", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private value = "";
      set src(src: string) { this.value = new URL(src, window.location.href).href; this.onload?.(); }
      get src() { return this.value; }
    });
    const { getByRole } = render(<HoverScrubImage images={images} alt="Preview" />);
    const preview = getByRole("img", { name: "Preview" });
    vi.spyOn(preview, "getBoundingClientRect").mockReturnValue({ left: 100, width: 300 } as DOMRect);
    fireEvent.mouseEnter(preview);
    fireEvent.mouseMove(preview, { clientX: 390 });
    await waitFor(() => expect(Array.from(preview.querySelectorAll("img")).some(img => img.getAttribute("src") === images[2] && img.style.opacity === "1")).toBe(true));
    fireEvent.mouseLeave(preview);
    expect(Array.from(preview.querySelectorAll("img")).some(img => img.getAttribute("src") === images[0] && img.style.opacity === "1")).toBe(true);
  });

  it("keeps the first frame on a touch-only device", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { getByRole } = render(<HoverScrubImage images={images} alt="Preview" />);
    const preview = getByRole("img", { name: "Preview" });
    fireEvent.mouseEnter(preview);
    fireEvent.mouseMove(preview, { clientX: 390 });
    expect(Array.from(preview.querySelectorAll("img")).filter(img => img.style.opacity === "1").map(img => img.getAttribute("src"))).toEqual([images[0]]);
  });
});
