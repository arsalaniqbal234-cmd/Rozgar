import { Easing, interpolate } from "remotion";
import type { JobPreviewCategory } from "../lib/job-preview-config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
const ns = "http://www.w3.org/2000/svg";
type Point = readonly [number, number];
type Workflow = { action: string; result: string; detail: string };
const workflows: Record<JobPreviewCategory, Workflow> = {
  engineering: { action: "Run checks", result: "Checks passed", detail: "Build #1842 deployed to preview" },
  design: { action: "Apply style", result: "Style applied", detail: "Hero colors synced to the design system" },
  marketing: { action: "Schedule", result: "Scheduled", detail: "Autumn launch / Tomorrow, 09:00" },
  sales: { action: "Send proposal", result: "Proposal sent", detail: "Northwind / Follow-up set for Friday" },
  healthcare: { action: "Check in", result: "Checked in", detail: "Ava Lewis / Room 03 is ready" },
  data: { action: "Refresh model", result: "Model refreshed", detail: "Revenue model / 1,284,320 events" },
  finance: { action: "Approve", result: "Approved", detail: "Quarterly close / Ledger reconciled" },
  product: { action: "Move to review", result: "In review", detail: "Search experience / Assigned to design" },
  operations: { action: "Approve intake", result: "Approved", detail: "Vendor intake / Operations notified" },
  support: { action: "Send reply", result: "Reply sent", detail: "Avery / Billing question resolved" },
  people: { action: "Book interview", result: "Interview set", detail: "Product Designer / Tuesday, 10:00" },
  education: { action: "Publish lesson", result: "Published", detail: "Lesson 04 / Available to 312 learners" },
  legal: { action: "Approve draft", result: "Approved", detail: "Supplier agreement / Ready for signature" },
  security: { action: "Investigate", result: "Resolved", detail: "Login anomaly / Session revoked" },
  logistics: { action: "Confirm arrival", result: "At hub", detail: "Route A12 / Arrival confirmed at 14:32" },
  general: { action: "Save role", result: "Saved", detail: "Opportunity added to your shortlist" },
};

function add(svg: SVGSVGElement, tag: string, attrs: Record<string, string | number>, text?: string) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  svg.append(node);
  return node;
}
function label(svg: SVGSVGElement, x: number, y: number, text: string, size = 11, color = "var(--ink)") {
  return add(svg, "text", { x, y, fill: color, "font-size": size, "font-weight": 600 }, text);
}
function panel(svg: SVGSVGElement, x: number, y: number, w: number, h: number) {
  return add(svg, "rect", { x, y, width: w, height: h, rx: 8, fill: "var(--surface)", stroke: "var(--border)", filter: "url(#cardShadow)" });
}
function changeText(svg: SVGSVGElement, original: string, value: string) {
  svg.querySelectorAll("text").forEach(node => { if (node.textContent === original) node.textContent = value; });
}
function cursor(svg: SVGSVGElement, frame: number, points: readonly Point[], times: number[], clicks: number[]) {
  const x = interpolate(frame, times, points.map(p => p[0]), ease);
  const y = interpolate(frame, times, points.map(p => p[1]), ease);
  const pointer = svg.querySelector<SVGGElement>(".motion-pointer, .motion-cursor");
  if (!pointer) return;
  pointer.setAttribute("transform", `translate(${x} ${y})`);
  pointer.style.filter = "drop-shadow(0 2px 3px #20304050)";
  pointer.querySelectorAll("circle").forEach(node => node.remove());
  const click = clicks.find(at => frame >= at && frame < at + 9);
  if (click !== undefined) {
    const ring = document.createElementNS(ns, "circle");
    ring.setAttribute("r", String(interpolate(frame, [click, click + 9], [3, 15], clamp)));
    ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "var(--accent)"); ring.setAttribute("stroke-width", "2");
    ring.style.opacity = String(1 - (frame - click) / 9);
    pointer.prepend(ring);
  }
  svg.append(pointer); // Cursor always stays above the tooltip/action panel.
}

/** Click -> response -> confirmation. No autonomous floating, breathing or fading rows. */
export function animateInteraction(svg: SVGSVGElement, category: JobPreviewCategory, variant: 1 | 2, frame: number) {
  svg.querySelectorAll<SVGElement>("[class^='motion-']").forEach(node => { node.style.animation = "none"; });
  const workflow = workflows[category];
  if (category === "engineering" && variant === 1) {
    // Complete the JSX tokens omitted by the original static mockup generator.
    const cardLine = svg.querySelector(".motion-code-5 text:last-child");
    if (cardLine) cardLine.textContent = `${cardLine.textContent} />`;
    const closingLine = svg.querySelector(".motion-code-6 text:nth-child(3)");
    if (closingLine) closingLine.textContent = "; }";
    // Click the actual file, type its body, then click Run build in the terminal.
    const writing = frame >= 25;
    svg.querySelectorAll<SVGGElement>(".motion-code").forEach((row, i) => {
      if (!writing || i < 2) return;
      const progress = interpolate(frame, [28 + (i - 2) * 15, 43 + (i - 2) * 15], [0, 1], clamp);
      const tokens = [...row.querySelectorAll("text")].slice(1);
      let remaining = Math.floor(tokens.reduce((n, token) => n + (token.textContent?.length ?? 0), 0) * progress);
      tokens.forEach(token => { const text = token.textContent ?? ""; token.textContent = text.slice(0, Math.max(0, remaining)); remaining -= text.length; });
    });
    if (frame >= 25 && frame < 93) {
      const line = Math.min(5, 2 + Math.floor(Math.max(0, frame - 28) / 15));
      const row = svg.querySelectorAll(".motion-code")[line];
      const tokens = [...row.querySelectorAll<SVGTextElement>("text")].slice(1).filter(t => t.textContent);
      const last = tokens.at(-1);
      const x = last ? Number(last.getAttribute("x")) + last.getComputedTextLength() + 2 : 290;
      add(svg, "rect", { x, y: 171 + line * 28, width: 2, height: 15, fill: "#dce4f6", opacity: frame % 18 < 12 ? 1 : 0 });
    }
    changeText(svg, "All checks passed", frame < 113 ? "Run build" : frame < 144 ? "Building..." : "Build passed");
    const success = svg.querySelector(".motion-success text");
    if (success) success.textContent = frame < 113 ? "$ npm run build" : frame < 144 ? "Compiling JobBoard.tsx..." : "✓ Compiled successfully / 6 checks passed";
    const bar = svg.querySelector<SVGRectElement>(".motion-progress");
    if (bar) bar.setAttribute("width", String(230 * interpolate(frame, [113, 144], [0, 1], clamp)));
    cursor(svg, frame, [[200, 245], [159, 224], [159, 224], [514, 301], [514, 301], [799, 410], [799, 410], [200, 245]], [0, 16, 27, 43, 97, 111, 157, 179], [21, 113]);
    return;
  }

  if (variant === 1 && ["marketing", "sales", "data", "finance"].includes(category)) {
    const bars = category === "marketing" || category === "finance";
    // Keep the plot below the KPI/header region; the original illustration's tall
    // bars intruded behind the headline metric and comparison badge.
    svg.querySelectorAll<SVGRectElement>(".motion-bar").forEach(node => {
      const height = Math.round(Number(node.getAttribute("height")) * .52);
      node.setAttribute("height", String(height));
      node.setAttribute("y", String(360 - height));
    });
    const bar = [...svg.querySelectorAll<SVGRectElement>(".motion-bar")].at(-1);
    const point: Point = bars && bar ? [Number(bar.getAttribute("x")) + Number(bar.getAttribute("width")) / 2, Number(bar.getAttribute("y"))] : [656, 251];
    const hover = frame >= 35 && frame < 103;
    const click = frame >= 117;
    if (hover) {
      bar?.setAttribute("fill", "var(--accent)");
      add(svg, "line", { x1: point[0], y1: point[1], x2: point[0], y2: 361, stroke: "var(--accent)", "stroke-dasharray": "3 4" });
      add(svg, "circle", { cx: point[0], cy: point[1], r: 6, fill: "var(--accent)", stroke: "white", "stroke-width": 2 });
      panel(svg, 435, 263, 148, 49);
      label(svg, 447, 282, category === "marketing" ? "Autumn launch / DEC" : category === "sales" ? "December pipeline" : category === "data" ? "Events / last hour" : "December revenue", 10);
      label(svg, 447, 301, category === "marketing" ? "Reach 32,480 · +18.2%" : category === "sales" ? "$142,000 · +12.4%" : category === "data" ? "24,320 · 98.4% healthy" : "$148,200 · +12.4%", 10, "var(--accent)");
    }
    const metrics = { marketing: ["248k", "252k"], sales: ["$842k", "$856k"], data: ["1.28m", "1.31m"], finance: ["$1.24m", "$1.28m"] } as const;
    const [original, result] = metrics[category as keyof typeof metrics];
    if (frame >= 63) {
      const value = interpolate(frame, [63, 84], [Number(original.replace(/[^\d.]/g, "")), Number(result.replace(/[^\d.]/g, ""))], clamp);
      changeText(svg, original, original.includes(".") ? `${original.startsWith("$") ? "$" : ""}${value.toFixed(2)}m` : `${original.startsWith("$") ? "$" : ""}${Math.round(value)}k`);
    }
    changeText(svg, "View report →", click ? "Report ready ✓" : "View report →");
    if (click) {
      const reports = { marketing: "Campaign", sales: "Pipeline", data: "Analytics", finance: "Financial" };
      const report = reports[category as keyof typeof reports];
      panel(svg, 270, 424, 412, 45);
      label(svg, 285, 451, `${report} report saved / Ready to share`, 11, "var(--accent)");
    }
    cursor(svg, frame, [[727, 395], point, point, [804, 127], [804, 127], [727, 395]], [0, 32, 98, 113, 157, 179], [117]);
    return;
  }

  if (category === "design" && variant === 1) {
    if (frame >= 25) add(svg, "rect", { x: 487, y: 204, width: 144, height: 169, rx: 15, fill: "none", stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "4 3" });
    if (frame >= 80) {
      const art = svg.querySelector(".motion-art rect");
      art?.setAttribute("fill", "#d4c5ea");
      panel(svg, 275, 435, 395, 35); label(svg, 290, 457, "Hero color updated / Components synced", 11, "var(--accent)");
    }
    cursor(svg, frame, [[252, 190], [151, 195], [151, 195], [110, 350], [110, 350], [578, 282], [578, 282], [252, 190]], [0, 20, 48, 75, 88, 112, 157, 179], [25, 80]);
    return;
  }

  // Activity variants and department workspaces select an actual row, then act on it.
  const healthcare = category === "healthcare" && variant === 1;
  const rowY = variant === 2 ? 209 : healthcare ? 295 : 237;
  const rowHeight = variant === 2 ? 39 : 54;
  const selected = frame >= 26;
  const complete = frame >= 109;
  if (selected) {
    add(svg, "rect", { x: 272, y: rowY, width: 405, height: rowHeight, rx: 8, fill: "var(--accent)", opacity: .07 });
    add(svg, "rect", { x: 272, y: rowY, width: 3, height: rowHeight, rx: 1, fill: "var(--accent)" });
    panel(svg, 696, 298, 172, 144);
    label(svg, 708, 318, "SELECTED ITEM", 9, "var(--muted)");
    const [name, detail] = workflow.detail.split(" / ");
    label(svg, 708, 339, name, 10);
    label(svg, 708, 358, complete ? detail : "Ready for your action", 8.5, "var(--muted)");
    add(svg, "rect", { x: 708, y: 376, width: 148, height: 29, rx: 7, fill: "var(--accent)" });
    label(svg, 716, 395, complete ? `✓ ${workflow.result}` : workflow.action, 10, "white");
    if (complete) label(svg, 708, 426, "Saved just now", 9, "var(--accent)");
  }
  if (complete) {
    const row = svg.querySelector(".motion-row-1");
    const status = row ? [...row.querySelectorAll("text")].at(-1) : null;
    if (status) status.textContent = workflow.result;
    if (healthcare) changeText(svg, "08", "09");
    svg.querySelector<SVGElement>(".motion-fill")?.setAttribute("width", "400");
  }
  cursor(svg, frame, [[714, 459], [433, rowY + 22], [433, rowY + 22], [776, 391], [776, 391], [714, 459]], [0, 22, 72, 103, 155, 179], [26, 109]);
}

/** Taller window layout, not a stretched bitmap: preserve font sizes and corner radii.
 * Redistribute vertical geometry while keeping the approved top bar and horizontal layout.
 */
export function expandWindow(svg: SVGSVGElement) {
  const scale = (720 - 88) / (540 - 88);
  const y = (value: number) => value <= 88 ? value : 88 + (value - 88) * scale;
  svg.setAttribute("viewBox", "0 0 960 720");
  svg.querySelectorAll<SVGElement>("rect, text, circle, line, path").forEach(node => {
    if (node.closest(".motion-pointer, .motion-cursor")) return;
    if (node.tagName === "path") {
      node.setAttribute("transform", `translate(0 ${88 * (1 - scale)}) scale(1 ${scale}) ${node.getAttribute("transform") ?? ""}`);
      return;
    }
    if (node.hasAttribute("height")) {
      const top = Number(node.getAttribute("y") ?? 0);
      const height = Number(node.getAttribute("height"));
      node.setAttribute("height", String(y(top + height) - y(top)));
    }
    for (const attr of ["y", "cy", "y1", "y2"]) {
      if (node.hasAttribute(attr)) node.setAttribute(attr, String(y(Number(node.getAttribute(attr)))));
    }
    const transform = node.getAttribute("transform");
    if (transform?.startsWith("rotate")) node.setAttribute("transform", transform.replace(/rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/, (_, angle, x, centerY) => `rotate(${angle} ${x} ${y(Number(centerY))})`));
  });
  svg.querySelectorAll<SVGElement>(".motion-pointer, .motion-cursor").forEach(node => {
    const transform = node.getAttribute("transform") ?? "";
    node.setAttribute("transform", transform.replace(/translate\(([-\d.]+) ([-\d.]+)\)/, (_, x, oldY) => `translate(${x} ${y(Number(oldY))})`));
  });
}
