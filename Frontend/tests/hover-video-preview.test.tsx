import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HoverVideoPreview from "../app/components/hover-video-preview";
import { videoForCategory } from "../lib/job-video-config";

let intersection: IntersectionObserverCallback;
const observers: IntersectionObserverCallback[] = [];
let reduced = false;
const listeners = new Map<string, () => void>();
beforeEach(() => {
  reduced = false;
  listeners.clear();
  observers.length = 0;
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() { return query.includes("reduced-motion") ? reduced : true; },
    addEventListener: (_: string, callback: () => void) => listeners.set(query, callback),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; observers.push(callback); }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const visible = (isIntersecting: boolean) => act(() => intersection([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
function setup() {
  const result = render(<article className="job-card"><HoverVideoPreview alt="Engineering" video={videoForCategory("engineering")} /></article>);
  return { ...result, card: result.container.querySelector("article")!, video: result.container.querySelector("video")! };
}

describe("HoverVideoPreview", () => {
  it("a grid of 50 cards attaches sources only for the visible hovered card", () => {
    const { container } = render(<>{Array.from({ length: 50 }, (_, i) => <article className="job-card" key={i}>
      <HoverVideoPreview alt={`Preview ${i}`} video={videoForCategory("engineering")} />
    </article>)}</>);
    expect(container.querySelectorAll("source")).toHaveLength(0);
    act(() => observers[0]([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    fireEvent.mouseEnter(container.querySelector("article")!);
    expect(container.querySelectorAll("source")).toHaveLength(2);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });
  it("loads no video until both hovered and observed, and releases media on leave", () => {
    const { card, video } = setup();
    expect(video.preload).toBe("none");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playsInline).toBe(true);
    fireEvent.mouseEnter(card);
    expect(video.querySelectorAll("source")).toHaveLength(0);
    visible(true);
    expect([...video.querySelectorAll("source")].map(s => s.type)).toEqual(['video/webm; codecs="vp9"', "video/mp4"]);
    expect(video.play).toHaveBeenCalledOnce();
    video.currentTime = 3;
    fireEvent.mouseLeave(card);
    expect(video.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
    expect(video.querySelectorAll("source")).toHaveLength(0);
  });
  it("stops outside the viewport and when reduced motion is enabled live", () => {
    const { card, video } = setup();
    visible(true); fireEvent.mouseEnter(card);
    visible(false);
    expect(video.querySelectorAll("source")).toHaveLength(0);
    visible(true);
    expect(video.querySelectorAll("source")).toHaveLength(2);
    reduced = true;
    act(() => listeners.get("(prefers-reduced-motion: reduce)")!());
    expect(video.querySelectorAll("source")).toHaveLength(0);
  });
  it("keeps a first-frame poster with reduced motion and never plays", () => {
    reduced = true;
    const { card, video, container } = setup();
    visible(true); fireEvent.mouseEnter(card);
    expect(video.play).not.toHaveBeenCalled();
    expect(container.querySelector("img")?.src).toContain("engineering-1.jpg");
  });
  it("handles rejected playback without hiding the poster", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new DOMException("Blocked", "NotAllowedError"));
    const { card, video } = setup();
    visible(true);
    await act(async () => { fireEvent.mouseEnter(card); });
    expect(video.style.opacity).toBe("0");
    expect(video.querySelectorAll("source")).toHaveLength(0);
  });
  it("retries MP4 on a media error and releases the element on unmount", () => {
    const { card, video, unmount } = setup();
    visible(true); fireEvent.mouseEnter(card);
    fireEvent.error(video);
    expect(video.querySelectorAll("source")).toHaveLength(1);
    expect(video.querySelector("source")?.type).toBe("video/mp4");
    unmount();
    expect(video.querySelectorAll("source")).toHaveLength(0);
  });
});
