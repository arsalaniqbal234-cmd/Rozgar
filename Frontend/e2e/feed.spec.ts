import { expect, test } from "@playwright/test";
const job = { id: 12, source_id: "remoteok_12", title: "Python engineer", company: "Example",
  salary: 100000, salary_currency: "USD", salary_period: "annual", is_remote: true,
  url: "https://example.com/job", description: "<p>Build useful products.</p>" };

test("feed search, job details and mobile layout", async ({ page }) => {
  await page.route("**/jobs?*", route => route.fulfill({ json: [job] }));
  await page.route("**/jobs/12", route => {
    if (route.request().resourceType() === "fetch") return route.fulfill({ json: job });
    return route.continue();
  });
  await page.goto("/");
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: /Switch to (light|dark) mode/ }).click();
  const selectedTheme = initialTheme === "dark" ? "light" : "dark";
  await expect(page.locator("html")).toHaveAttribute("data-theme", selectedTheme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", selectedTheme);
  await expect(page.getByRole("link", { name: "Python engineer" })).toBeVisible();
  const searchRequest = page.waitForRequest(request => request.url().includes("keyword=Python"));
  await page.getByRole("textbox", { name: "Search jobs" }).fill("Python");
  await searchRequest;
  await expect(page.getByRole("link", { name: "Python engineer" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Python engineer" }).click();
  await expect(page.getByRole("heading", { name: "Python engineer" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Apply on employer/ })).toHaveAttribute("href", job.url);
});

test("HTTP failure displays a retry action", async ({ page }) => {
  await page.route("**/jobs?*", route => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/");
  await expect(page.getByText("The service is temporarily unavailable. Please try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
