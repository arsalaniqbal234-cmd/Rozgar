import { afterEach, describe, expect, it } from "vitest";
import { previewArtwork } from "../scripts/preview-artwork.mjs";
import { animateInteraction, expandWindow } from "../remotion/interactions";

afterEach(() => { document.body.innerHTML = ""; });
function scene(category: "engineering" | "marketing" | "healthcare", frame: number) {
  document.body.innerHTML = previewArtwork(category, 1);
  const svg = document.querySelector("svg")!;
  // jsdom has no glyph layout; geometry is also checked in actual rendered video frames.
  svg.querySelectorAll("text").forEach(text => Object.defineProperty(text, "getComputedTextLength", { value: () => (text.textContent?.length ?? 0) * 7 }));
  animateInteraction(svg, category, 1, frame);
  return svg;
}
describe("purposeful preview timelines", () => {
  it("selects the Engineering file, types before building, then reports completion", () => {
    const typing = scene("engineering", 45);
    expect(typing.querySelector(".motion-cursor")?.getAttribute("transform")).toContain("514");
    expect(typing.querySelector(".motion-code-6")?.textContent).toBe("06");
    expect(typing.textContent).toContain("Run build");
    expect(scene("engineering", 120).textContent).toContain("Compiling JobBoard.tsx...");
    expect(scene("engineering", 150).textContent).toContain("6 checks passed");
  });
  it("shows a Marketing tooltip only while hovering the actual data point, then updates reach", () => {
    expect(scene("marketing", 0).textContent).not.toContain("Reach 32,480");
    const hovering = scene("marketing", 50);
    expect(hovering.textContent).toContain("Reach 32,480");
    expect(hovering.querySelector(".motion-pointer")?.getAttribute("transform")).toBe("translate(630.5 285)");
    expect(scene("marketing", 90).querySelector(".motion-kpi")?.textContent).toBe("252k");
    const reported = scene("marketing", 140);
    expect(reported.textContent).toContain("Report ready");
    expect(reported.textContent).not.toContain("Reach 32,480");
  });
  it("checks in only the selected patient and updates the clinic count", () => {
    const svg = scene("healthcare", 120);
    expect(svg.querySelector(".motion-row-1")?.textContent).toContain("Checked in");
    expect(svg.querySelector(".motion-row-3")?.textContent).toContain("Confirmed");
    expect([...svg.querySelectorAll("text")].some(node => node.textContent === "09")).toBe(true);
  });
  it("expands window geometry without scaling typography", () => {
    const svg = scene("engineering", 0);
    const text = svg.querySelector(".motion-code text")!;
    const size = text.getAttribute("font-size");
    const originalY = Number(text.getAttribute("y"));
    expandWindow(svg);
    expect(svg.getAttribute("viewBox")).toBe("0 0 960 720");
    expect(text.getAttribute("font-size")).toBe(size);
    expect(Number(text.getAttribute("y"))).toBeGreaterThan(originalY);
  });
});
