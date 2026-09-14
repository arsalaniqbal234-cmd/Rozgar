import * as Sentry from "@sentry/nextjs";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 10000);
  let response: Response;
  try {
    response = await fetch(API_URL + path, { ...options, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (timedOut) throw new Error("The server is taking too long to respond. Please try again.");
    if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") throw error;
    Sentry.captureException(new Error("API connection failed"));
    throw new Error("Unable to connect. Check your connection and try again.");
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
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
  return response.json() as Promise<T>;
}

export type Job = {
  id: number; source_id: string; title: string; company: string; url: string;
  salary: number | null; salary_currency?: string | null; salary_period?: string | null;
  description?: string | null; location?: string | null; is_remote: boolean;
};
export type SavedSearch = {
  id: number; keywords: string; location?: string; min_salary?: number;
  filters?: { salary_only?: boolean; remote_only?: boolean };
  last_notified_at?: string | null;
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
