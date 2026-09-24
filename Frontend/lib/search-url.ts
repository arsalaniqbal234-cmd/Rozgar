import type { SavedSearch } from "./api";
import { Filters, initialFilters } from "./use-jobs";

const salaryPeriods = ["annual", "monthly", "hourly"] as const;

export function savedSearchHref(search: SavedSearch): string {
  const params = new URLSearchParams();
  if (search.keywords) params.set("keyword", search.keywords);
  // Preserve explicitly worldwide saved searches despite the Pakistan home default.
  params.set("location", search.location || "");
  if (search.min_salary && search.min_salary > 0) params.set("min_salary", String(search.min_salary));
  if (search.filters?.salary_only) params.set("salary_only", "true");
  if (search.filters?.remote_only) params.set("remote_only", "true");
  if (search.filters?.salary_currency && search.filters.salary_currency !== "USD")
    params.set("salary_currency", search.filters.salary_currency);
  if (search.filters?.salary_period && search.filters.salary_period !== "annual")
    params.set("salary_period", search.filters.salary_period);
  return `/${params.size ? `?${params.toString()}` : ""}#opportunities`;
}

export function filtersFromSearchParams(params: URLSearchParams): Filters {
  const salary = params.get("min_salary");
  const amount = salary && /^\d+$/.test(salary) ? Number(salary) : 0;
  const currency = params.get("salary_currency")?.toUpperCase();
  const period = params.get("salary_period");
  return {
    ...initialFilters,
    keyword: (params.get("keyword") || "").slice(0, 200),
    location: (params.get("location") ?? initialFilters.location).slice(0, 200),
    min_salary: Number.isSafeInteger(amount) && amount >= 0 && amount <= 1_000_000_000 ? amount : 0,
    salary_only: params.get("salary_only") === "true",
    remote_only: params.get("remote_only") === "true",
    salary_currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined,
    salary_period: salaryPeriods.find(value => value === period),
  };
}
