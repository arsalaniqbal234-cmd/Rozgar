import { describe, expect, it } from "vitest";
import { filtersFromSearchParams, savedSearchHref } from "../lib/search-url";
import { initialFilters } from "../lib/use-jobs";

describe("saved search URLs", () => {
  it("defaults the homepage and reset filters to Pakistan", () => {
    expect(initialFilters.location).toBe("Pakistan");
    expect(filtersFromSearchParams(new URLSearchParams()).location).toBe("Pakistan");
    expect(filtersFromSearchParams(new URLSearchParams("keyword=engineer")).location).toBe("Pakistan");
  });

  it("preserves explicitly selected locations and worldwide saved searches", () => {
    expect(filtersFromSearchParams(new URLSearchParams("location=Lahore")).location).toBe("Lahore");
    expect(filtersFromSearchParams(new URLSearchParams("location=")).location).toBe("");
    const href = savedSearchHref({ id: 2, keywords: "Engineer", location: null, min_salary: null, filters: {} });
    expect(filtersFromSearchParams(new URL(href, "http://localhost").searchParams).location).toBe("");
  });

  it("round-trips every saved filter through the results URL", () => {
    const href = savedSearchHref({
      id: 1, keywords: "Data Engineer", location: "Berlin, Germany", min_salary: 85000,
      filters: { salary_only: true, remote_only: true, salary_currency: "EUR", salary_period: "monthly" },
    });
    expect(href).toContain("#opportunities");
    const parsed = filtersFromSearchParams(new URL(href, "http://localhost").searchParams);
    expect(parsed).toEqual({ keyword: "Data Engineer", location: "Berlin, Germany", min_salary: 85000,
      salary_only: true, remote_only: true, salary_currency: "EUR", salary_period: "monthly" });
  });

  it("rejects malformed and excessive query values", () => {
    const parsed = filtersFromSearchParams(new URLSearchParams("min_salary=-5&remote_only=not-true&salary_currency=BAD1&salary_period=weekly"));
    expect(parsed.min_salary).toBe(0);
    expect(parsed.remote_only).toBe(false);
    expect(parsed.salary_currency).toBeUndefined();
    expect(parsed.salary_period).toBeUndefined();
  });
});
