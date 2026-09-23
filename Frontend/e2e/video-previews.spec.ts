import { expect, test } from "@playwright/test";

const titles = ["Senior Software Engineer", "Marketing Manager", "UX Designer", "Pricing Strategist, GTM", "Clinical Nurse"];
const jobs = Array.from({ length: 50 }, (_, i) => ({ id: 200 + i, source_id: `remoteok_${200 + i}`,
  title: titles[i % titles.length], company: `Example ${i}`, salary: null, is_remote: false,
  location: "Worldwide", url: "https://example.com/job" }));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/jobs?*", route => route.fulfill({ json: jobs }));
  await page.route("**/api/jobs/likes?*", route => route.fulfill({ json: [] }));
  await page.route("**/api/feature-flags", route => route.fulfill({ json: { tiltCards: false } }));
});

test("real video is lazy, plays only on visible hover, and resets on exit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Touch devices intentionally keep posters");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const mediaRequests: string[] = [];
  page.on("request", req => { if (/\.(mp4|webm)(\?|$)/.test(req.url())) mediaRequests.push(req.url()); });
  await page.goto("/");
  const cards = page.locator(".video-job-card");
  await expect(cards).toHaveCount(15);
  await expect(page.getByText("Illustrated preview", { exact: true })).toHaveCount(0);
  const first = cards.first();
  await first.scrollIntoViewIfNeeded();
  expect(mediaRequests).toHaveLength(0);
  await first.hover();
  const video = first.locator("video");
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
  expect(mediaRequests.every(url => /engineering-1\.(mp4|webm)/.test(url))).toBe(true);
  await expect(cards.locator("source")).toHaveCount(2);
  await page.mouse.move(0, 0);
  await expect(cards.locator("source")).toHaveCount(0);
  expect(await video.evaluate(v => ({ paused: (v as HTMLVideoElement).paused, time: (v as HTMLVideoElement).currentTime }))).toEqual({ paused: true, time: 0 });
  const dimensions = await first.evaluate(card => ({ card: card.getBoundingClientRect().height,
    preview: card.querySelector(".job-preview")!.getBoundingClientRect().height,
    columns: getComputedStyle(card.closest(".job-grid")!).gridTemplateColumns.split(" ").length }));
  expect(dimensions.columns).toBe(3);
  console.log("Desktop card dimensions:", dimensions);
  await page.screenshot({ path: testInfo.outputPath("video-cards-desktop.png") });
  // Measure the previous spacing with identical content and viewport for a fair comparison.
  const before = await first.evaluate(card => {
    const style = document.createElement("style");
    style.textContent = `
      .video-job-card .job-preview { margin-bottom:12px!important; }
      .video-job-card .job-preview-shot { height:auto!important; aspect-ratio:16/10!important; }
      .video-job-card h3 { margin-top:10px!important; }
      .video-job-card .job-location { margin-top:6px!important; font-size:11px!important; }
      .video-job-card .job-tags { margin-block:9px 12px!important; font-size:9px!important; }
      .video-job-card .job-tags > span { padding-block:4px!important; }
      .video-job-card .job-card-bottom { padding-top:9px!important; }
      .video-job-card .job-salary { font-size:10px!important; }
      .video-job-card .job-card-bottom a { min-height:28px!important; }
      .video-job-card > .border-t { margin-top:7px!important; padding-top:4px!important; }
      .video-job-card > .border-t > :is(button,span) { min-height:36px!important; }
    `;
    document.head.append(style);
    const preview = card.querySelector<HTMLElement>(".job-preview")!;
    return { card: card.getBoundingClientRect().height, preview: preview.getBoundingClientRect().height };
  });
  console.log("Previous card proportions with identical content:", before);
  expect(dimensions.preview - before.preview).toBeCloseTo(48, 0);
  expect(Math.abs(dimensions.card - before.card)).toBeLessThan(5);
});

test("reduced motion shows posters and responsive cards remain aligned", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator(".video-job-card");
  await expect(cards).toHaveCount(15);
  await cards.first().scrollIntoViewIfNeeded();
  await cards.first().hover();
  await expect(cards.locator("source")).toHaveCount(0);
  await expect.poll(() => cards.first().locator("img").first().evaluate(i => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("video-cards-reduced-motion.png") });
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(cards.first().locator("video")).toHaveCSS("object-fit", "contain");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("MP4 plays when the preferred WebM source fails", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Touch devices intentionally keep posters");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/*.webm*", route => route.fulfill({ status: 404, body: "Missing preview" }));
  await page.goto("/");
  const card = page.locator(".video-job-card").first();
  await card.scrollIntoViewIfNeeded();
  const mp4 = page.waitForRequest(request => new URL(request.url()).pathname.endsWith("engineering-1.mp4"));
  await card.hover();
  await mp4;
  await expect.poll(() => card.locator("video").evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
});

test("title-only API records select their own category videos, including GTM", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Touch devices keep category-specific posters");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cards = page.locator(".video-job-card");
  for (const [index, category] of ["engineering", "marketing", "design", "marketing", "healthcare"].entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-preview-category", category);
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await expect(card.locator("source[type='video/mp4']")).toHaveAttribute("src", `/job-previews/video/${category}-1.mp4?v=2`);
    await expect.poll(() => card.locator("video").evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
    await page.mouse.move(0, 0);
  }
});
