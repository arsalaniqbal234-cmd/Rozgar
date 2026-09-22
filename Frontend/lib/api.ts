import * as Sentry from "@sentry/nextjs";

// The Next.js rewrite forwards these same-origin requests to the backend.
// Deployment URLs then work without adding each temporary hostname to backend CORS.
export const API_URL = "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const JOB_CACHE_TTL = 30_000;
const JOB_CACHE_LIMIT = 40;
const jobCache = new Map<string, { expires: number; value: unknown }>();

export function clearJobCache() { jobCache.clear(); }

function canCacheJobs(path: string, options: RequestInit): boolean {
  return typeof window !== "undefined" && options.cache === "force-cache"
    && (!options.method || options.method.toUpperCase() === "GET")
    && !options.body && options.credentials !== "include"
    && Array.from(new Headers(options.headers).keys()).length === 0
    && /^\/(jobs|search)(\?|$)/.test(path);
}

export async function api<T>(path: string, options: RequestInit = {}, timeoutMs = 10000): Promise<T> {
  const cancelled = () => new DOMException("The request was cancelled.", "AbortError");
  if (options.signal?.aborted) throw cancelled();
  const cacheable = canCacheJobs(path, options);
  const cached = cacheable ? jobCache.get(path) : undefined;
  if (cached && cached.expires > Date.now()) {
    jobCache.delete(path);
    jobCache.set(path, cached);
    return cached.value as T;
  }
  jobCache.delete(path);
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timer = globalThis.setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(API_URL + path, { ...options, signal: controller.signal, cache: "no-store" });
    if (options.signal?.aborted) throw cancelled();
    if (!response.ok) {
      const message = response.status === 401 ? "Please sign in again."
        : response.status === 403 ? "You do not have permission for this action."
        : response.status === 404 ? "This item was not found."
        : response.status === 409 ? "This request conflicts with an existing item or account limit."
        : response.status === 422 ? "Please check your search details."
        : "The service is temporarily unavailable. Please try again.";
      if (response.status >= 500) Sentry.captureException(new Error(`API request failed: ${response.status}`));
      throw new ApiError(response.status, message);
    }
    if (response.status === 204) return undefined as T;
    // Keep the timeout active until the response body has finished downloading.
    const value = await response.json() as T;
    if (options.signal?.aborted) throw cancelled();
    if (timedOut) throw new Error("Response timed out");
    if (cacheable) {
      for (const [key, entry] of jobCache) {
        if (entry.expires <= Date.now()) jobCache.delete(key);
      }
      if (jobCache.size >= JOB_CACHE_LIMIT) jobCache.delete(jobCache.keys().next().value!);
      jobCache.set(path, { expires: Date.now() + JOB_CACHE_TTL, value });
    }
    return value;
  } catch (error) {
    if (options.signal?.aborted) throw cancelled();
    if (timedOut) throw new Error("The server is taking too long to respond. Please try again.");
    if (error instanceof ApiError) throw error;
    if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") throw error;
    Sentry.captureException(new Error("API connection failed"));
    throw new Error("Unable to connect. Check your connection and try again.");
  } finally {
    globalThis.clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

export type Job = {
  id: number; source_id: string; title: string; company: string; url: string;
  salary: number | null; salary_currency?: string | null; salary_period?: string | null;
  description?: string | null; location?: string | null; is_remote: boolean;
  preview_images?: string[] | null;
  category?: string | null; tags?: string[] | null;
  created_at?: string | null;
};
export type SavedSearch = {
  id: number; keywords: string; location?: string; min_salary?: number;
  filters?: { salary_only?: boolean; remote_only?: boolean; salary_currency?: string; salary_period?: "annual" | "monthly" | "hourly" };
  last_notified_at?: string | null;
};
export type CompanyFollow = {
  id: number; company_name: string; is_active: boolean;
  followed_at: string; last_notified_at?: string | null;
};

export function salaryLabel(job: Job): string {
  if (!job.salary) return "Salary not listed";
  const amount = new Intl.NumberFormat("en-US").format(job.salary);
  return `${job.salary_currency || "Currency not listed"} ${amount}${job.salary_period ? " / " + job.salary_period : ""}`;
}

export function safeLink(url: string): string | undefined {
  try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) ? url : undefined; }
  catch { return undefined; }
}
