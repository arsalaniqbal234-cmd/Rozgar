"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, Job } from "./api";

export type Filters = { keyword: string; location: string; min_salary: number; salary_only: boolean; remote_only: boolean };
export const initialFilters: Filters = { keyword: "", location: "", min_salary: 0, salary_only: false, remote_only: false };
const PAGE_SIZE = 20;

export function useJobs(filters: Filters) {
  const key = JSON.stringify(filters);
  const active = useRef("");
  const moreController = useRef<AbortController | null>(null);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ key: string; jobs: Job[]; error: string; hasMore: boolean; loadingMore: boolean }>({
    key: "", jobs: [], error: "", hasMore: false, loadingMore: false,
  });
  const requestKey = key + ":" + retry;
  const buildQuery = useCallback((beforeId?: number) => {
    const query = new URLSearchParams();
    const values = JSON.parse(key) as Filters;
    Object.entries(values).forEach(([name, value]) => { if (value) query.set(name, String(value)); });
    query.set("limit", String(PAGE_SIZE));
    if (beforeId) query.set("before_id", String(beforeId));
    return "/jobs?" + query;
  }, [key]);

  useEffect(() => {
    active.current = requestKey;
    moreController.current?.abort();
    moreController.current = null;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<Job[]>(buildQuery(), { signal: controller.signal }).then(jobs => {
        if (!controller.signal.aborted) setState({ key: requestKey, jobs, error: "", hasMore: jobs.length === PAGE_SIZE, loadingMore: false });
      }).catch(error => {
        if (!controller.signal.aborted) setState({ key: requestKey, jobs: [], error: error.message, hasMore: false, loadingMore: false });
      });
    }, filters.keyword ? 350 : 0);
    return () => { clearTimeout(timer); controller.abort(); moreController.current?.abort(); };
  }, [requestKey, buildQuery, filters.keyword]);

  const loadMore = useCallback(async () => {
    if (moreController.current || state.key !== requestKey || state.loadingMore || !state.hasMore || state.error) return;
    const controller = new AbortController();
    moreController.current = controller;
    setState(previous => ({ ...previous, loadingMore: true }));
    try {
      const jobs = await api<Job[]>(buildQuery(state.jobs.at(-1)?.id), { signal: controller.signal });
      if (!controller.signal.aborted && active.current === requestKey) {
        setState(previous => {
          const ids = new Set(previous.jobs.map(job => job.id));
          return { ...previous, jobs: [...previous.jobs, ...jobs.filter(job => !ids.has(job.id))],
            hasMore: jobs.length === PAGE_SIZE, loadingMore: false };
        });
      }
    } catch (error) {
      if (!controller.signal.aborted && active.current === requestKey)
        setState(previous => ({ ...previous, error: (error as Error).message, loadingMore: false }));
    } finally {
      if (moreController.current === controller) moreController.current = null;
    }
  }, [state, requestKey, buildQuery]);

  return { jobs: state.key === requestKey ? state.jobs : [], error: state.key === requestKey ? state.error : "",
    loading: state.key !== requestKey, loadingMore: state.loadingMore, hasMore: state.hasMore,
    loadMore, retry: () => setRetry(value => value + 1) };
}
