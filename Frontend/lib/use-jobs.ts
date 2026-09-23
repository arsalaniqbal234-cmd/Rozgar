"use client";
import { useEffect, useState } from "react";
import { api, clearJobCache, Job } from "./api";

export type Filters = { keyword: string; location: string; min_salary: number; salary_only: boolean; remote_only: boolean;
  salary_currency?: string; salary_period?: "annual" | "monthly" | "hourly" };
export const initialFilters: Filters = { keyword: "", location: "", min_salary: 0, salary_only: false, remote_only: false };
const PAGE_SIZE = 15;

export function useJobs(filters: Filters, enabled = true) {
  const key = JSON.stringify(filters);
  const [pagination, setPagination] = useState<{ key: string; cursors: (number | undefined)[]; index: number }>({
    key: "", cursors: [undefined], index: 0,
  });
  const current = pagination.key === key ? pagination : { key, cursors: [undefined], index: 0 };
  const cursor = current.cursors[current.index];
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ key: string; jobs: Job[]; error: string; hasNext: boolean }>({
    key: "", jobs: [], error: "", hasNext: false,
  });
  const requestKey = `${key}:${current.index}:${cursor ?? "first"}:${retry}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([name, value]) => { if (value) query.set(name, String(value)); });
      // One lookahead record detects the next page; only PAGE_SIZE jobs are shown.
      query.set("limit", String(PAGE_SIZE + 1));
      query.set("summary", "true");
      if (cursor) query.set("before_id", String(cursor));
      api<Job[]>("/jobs?" + query, { signal: controller.signal, cache: "force-cache" }).then(rows => {
        if (!controller.signal.aborted) setState({ key: requestKey, jobs: rows.slice(0, PAGE_SIZE), error: "", hasNext: rows.length > PAGE_SIZE });
      }).catch(error => {
        if (!controller.signal.aborted) setState({ key: requestKey, jobs: [], error: error.message, hasNext: false });
      });
    }, filters.keyword || filters.location ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, requestKey, cursor, filters.keyword, filters.location, filters, enabled]);

  const ready = enabled && state.key === requestKey;
  const jobs = ready ? state.jobs : [];
  const hasNext = ready && state.hasNext;
  return {
    jobs, error: ready ? state.error : "", loading: !ready, hasNext,
    page: current.index + 1, hasPrevious: current.index > 0,
    nextPage: () => {
      if (!hasNext || jobs.length !== PAGE_SIZE) return;
      setPagination({ key, cursors: [...current.cursors.slice(0, current.index + 1), jobs[PAGE_SIZE - 1].id], index: current.index + 1 });
    },
    previousPage: () => {
      if (current.index > 0) setPagination({ ...current, index: current.index - 1 });
    },
    retry: () => { clearJobCache(); setRetry(value => value + 1); },
  };
}
