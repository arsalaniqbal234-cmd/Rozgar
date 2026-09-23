import { expect, test } from "@playwright/test";

const jobs = Array.from({ length: 32 }, (_, i) => ({ id: 100 - i, source_id: `source_${100 - i}`,
  title: `Engineer ${100 - i}`, company: "Example", url: "https://example.com/job", salary: null, is_remote: true }));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/jobs?*", route => {
    const query = new URL(route.request().url()).searchParams;
    const before = Number(query.get("before_id") ?? Infinity);
    return route.fulfill({ json: jobs.filter(job => job.id < before).slice(0, Number(query.get("limit"))) });
  });
  await page.route("**/api/jobs/likes?*", route => route.fulfill({ json: [] }));
  await page.route("**/api/feature-flags", route => route.fulfill({ json: { tiltCards: false } }));
});

test("15 cards form five desktop rows, with cursor next/previous and a shorter final page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const cards = page.locator(".job-grid article");
  await expect(cards).toHaveCount(15);
  await expect(page.getByText("15 roles on page 1")).toBeVisible();
  const rows = await cards.evaluateAll(nodes => [...new Set(nodes.map(node => Math.round(node.getBoundingClientRect().top)))]);
  expect(rows).toHaveLength(5);
  await expect(page.locator(".job-grid").last()).toHaveCSS("grid-template-columns", /^(\S+\s){2}\S+$/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("15 roles on page 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Engineer 85", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("2 roles on page 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(cards).toHaveCount(15);
  await expect(page.getByText("15 roles on page 2")).toBeVisible();
});

test("hero keeps its word spacing at 375, 390 and 414px; tablet keeps two columns", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".job-grid article")).toHaveCount(15);
  for (const width of [375, 390, 414, 900]) {
    await page.setViewportSize({ width, height: 900 });
    const heading = page.locator(".journey-card h2");
    expect((await heading.innerText()).replace(/\s+/g, " ")).toBe("A career that feels like you.");
    const columns = await page.locator(".job-grid").last().evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(width === 900 ? 2 : 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
