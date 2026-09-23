"use client";

import { useContext, useSyncExternalStore } from "react";
import type { Job } from "./api";
import { ShortlistContext } from "./shortlist-context";

export type ShortlistedJob = Omit<Job, "description">;
export const SHORTLIST_KEY = "rozgar.shortlist.v1";
export const SHORTLIST_LIMIT = 100;
const MAX_STORAGE_LENGTH = 350_000;
const READ_ERROR = "Your saved jobs could not be read. Saving a new job will start a new list on this browser.";
const STORAGE_ERROR = "Browser storage is unavailable or full. Your change was not saved. Please free some space or allow site storage and try again.";

type Snapshot = { jobs: ShortlistedJob[]; ready: boolean; error: string | null };
const initialSnapshot: Snapshot = { jobs: [], ready: false, error: null };
let snapshot = initialSnapshot;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

function boundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function sanitizeJob(value: unknown): ShortlistedJob | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;
  if (!Number.isSafeInteger(job.id) || (job.id as number) <= 0
    || !boundedText(job.title, 300) || !boundedText(job.company, 300)
    || !boundedText(job.source_id, 300) || !boundedText(job.url, 2048)
    || typeof job.is_remote !== "boolean"
    || !(job.salary === null || (typeof job.salary === "number" && Number.isFinite(job.salary) && job.salary >= 0))) return null;
  try {
    if (!["http:", "https:"].includes(new URL(job.url).protocol)) return null;
  } catch { return null; }
  for (const [field, max] of [["location", 300], ["salary_currency", 50], ["salary_period", 50]] as const) {
    if (job[field] != null && (typeof job[field] !== "string" || job[field].length > max)) return null;
  }
  // Explicitly select display metadata: descriptions and arbitrary stored fields never enter the list.
  return {
    id: job.id as number, title: job.title, company: job.company, source_id: job.source_id,
    url: job.url, is_remote: job.is_remote, salary: job.salary as number | null,
    location: job.location as string | null | undefined,
    salary_currency: job.salary_currency as string | null | undefined,
    salary_period: job.salary_period as string | null | undefined,
  };
}

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}

function readStorage(): boolean {
  let raw: string | null;
  try { raw = window.localStorage.getItem(SHORTLIST_KEY); }
  catch {
    publish({ ...snapshot, ready: true, error: STORAGE_ERROR });
    return false;
  }
  if (raw === lastRaw && snapshot.ready && !snapshot.error) return true;
  lastRaw = raw;
  if (!raw) {
    publish({ jobs: [], ready: true, error: null });
    return true;
  }
  try {
    if (raw.length > MAX_STORAGE_LENGTH) throw new Error("Storage limit exceeded");
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== "object" || !("version" in stored) || stored.version !== 1
      || !("jobs" in stored) || !Array.isArray(stored.jobs) || stored.jobs.length > SHORTLIST_LIMIT) throw new Error("Invalid shortlist");
    const jobs: ShortlistedJob[] = [];
    const ids = new Set<number>();
    for (const value of stored.jobs) {
      const job = sanitizeJob(value);
      if (!job || ids.has(job.id)) throw new Error("Invalid saved job");
      jobs.push(job);
      ids.add(job.id);
    }
    publish({ jobs, ready: true, error: null });
  } catch { publish({ jobs: [], ready: true, error: READ_ERROR }); }
  return true;
}

function onStorage(event: StorageEvent) {
  if (event.key === SHORTLIST_KEY || event.key === null) readStorage();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    readStorage();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function writeJobs(jobs: ShortlistedJob[]): string | null {
  const raw = JSON.stringify({ version: 1, jobs });
  try { window.localStorage.setItem(SHORTLIST_KEY, raw); }
  catch {
    publish({ ...snapshot, error: STORAGE_ERROR });
    return STORAGE_ERROR;
  }
  lastRaw = raw;
  publish({ jobs, ready: true, error: null });
  return null;
}

function toggleJob(value: Job): string | null {
  if (!readStorage()) return STORAGE_ERROR;
  const existing = snapshot.jobs.find(job => sameJob(job, value));
  if (existing) return removeJob(existing.id);
  if (snapshot.jobs.length >= SHORTLIST_LIMIT) {
    return `Your shortlist holds up to ${SHORTLIST_LIMIT} jobs. Remove a saved job before adding another.`;
  }
  const job = sanitizeJob(value);
  if (!job) return "This job could not be saved. Please refresh the page and try again.";
  return writeJobs([job, ...snapshot.jobs]);
}

function removeJob(id: number): string | null {
  if (!readStorage()) return STORAGE_ERROR;
  return writeJobs(snapshot.jobs.filter(job => job.id !== id));
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => initialSnapshot;

export function sameJob(a: Pick<Job, "id" | "source_id">, b: Pick<Job, "id" | "source_id">) {
  return a.id === b.id || a.source_id === b.source_id;
}

export function useBrowserShortlist() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...current, toggleJob, removeJob, retry: readStorage };
}

export function useShortlist() {
  const account = useContext(ShortlistContext);
  const browser = useBrowserShortlist();
  return account ?? browser;
}
