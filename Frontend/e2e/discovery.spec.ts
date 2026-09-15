import { expect, test } from "@playwright/test";

const jobs = [
  { id: 31, source_id: "remoteok_31", title: "Senior Frontend Engineer", company: "Northstar", salary: 120000 },
  { id: 30, source_id: "jobicy_30", title: "Product Designer", company: "Forma", salary: 95000 },
  { id: 29, source_id: "arbeitnow_29", title: "Data Engineer", company: "Meridian", salary: 110000 },
  { id: 28, source_id: "remoteok_28", title: "Full Stack Developer", company: "Openfield", salary: 100000 },
].map(job => ({ ...job, salary_currency: "USD", salary_period: "annual",
  location: "Worldwide", is_remote: true, url: "https://example.com/jobs/" + job.id }));

test.beforeEach(async ({ page }) => {
  await page.route("**/jobs?*", route => route.fulfill({ json: jobs }));
});

test("shortlist persists across reloads and can be removed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Save job Senior Frontend Engineer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove saved job Senior Frontend Engineer", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Shortlist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your shortlist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Senior Frontend Engineer", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Senior Frontend Engineer", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove saved job Senior Frontend Engineer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your next opportunity belongs here" })).toBeVisible();
});

test("career presets, views, themes and keyboard search remain usable", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Senior Frontend Engineer", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("discovery-light.png"), fullPage: true });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: testInfo.outputPath("discovery-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(page.getByRole("button", { name: "List view", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".job-list article")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("/");
  await expect(page.getByRole("textbox", { name: "Search jobs" })).toBeFocused();
  const request = page.waitForRequest(req => req.url().includes("keyword=design"));
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await request;
  await expect(page.getByRole("textbox", { name: "Search jobs" })).toHaveValue("design");
  await page.getByRole("button", { name: /Clear filters/ }).click();
  await expect(page.getByRole("textbox", { name: "Search jobs" })).toHaveValue("");
});
