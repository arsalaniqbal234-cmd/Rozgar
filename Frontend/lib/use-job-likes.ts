"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";

export type JobLikeStats = { job_id: number; likes: number; is_liked: boolean };

export function useJobLikes(jobIds: number[], userId: string | undefined, getToken: () => Promise<string | null>) {
  const ids = jobIds.join(",");
  const key = `${userId || "anonymous"}:${ids}`;
  const [data, setData] = useState<{ key: string; byId: Record<number, JobLikeStats> }>({ key: "", byId: {} });
  const [pending, setPending] = useState<number | null>(null);
  const inFlight = useRef(false);
  const scope = useRef<object>(null);
  const touched = useRef(new Set<number>());
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const requestScope = {};
    scope.current = requestScope;
    touched.current = new Set();
    if (!ids) return;
    const controller = new AbortController();
    async function load() {
      try {
        const token = userId ? await getToken() : null;
        if (userId && !token) return;
        const query = new URLSearchParams();
        ids.split(",").forEach(id => query.append("ids", id));
        const rows = await api<JobLikeStats[]>(`/jobs/likes?${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        }, 45_000);
        if (!controller.signal.aborted) {
          const protectedIds = new Set(touched.current);
          setData(previous => ({ key, byId: {
            ...Object.fromEntries(rows.map(row => [row.job_id, row])),
            ...Object.fromEntries(Object.entries(previous.key === key ? previous.byId : {})
              .filter(([id]) => protectedIds.has(Number(id)))),
          } }));
          setLoadError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof ApiError && error.status === 404
          ? "Like service is missing from the running backend."
          : "Like counts are unavailable. Check that the backend and database migration are running.");
      }
    }
    void load();
    return () => { controller.abort(); if (scope.current === requestScope) scope.current = null; };
  }, [ids, key, userId, getToken]);

  async function toggle(jobId: number) {
    if (inFlight.current) return;
    inFlight.current = true;
    const requestScope = scope.current;
    const current = (data.key === key ? data.byId[jobId] : undefined)
      ?? { job_id: jobId, likes: 0, is_liked: false };
    touched.current.add(jobId);
    setPending(jobId);
    const update = (row: JobLikeStats) => {
      if (scope.current !== requestScope) return;
      setData(previous => ({ key, byId: { ...(previous.key === key ? previous.byId : {}), [jobId]: row } }));
    };
    update({ ...current, is_liked: !current.is_liked, likes: Math.max(0, current.likes + (current.is_liked ? -1 : 1)) });
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in to like a job.");
      const next = await api<JobLikeStats>(`/jobs/${jobId}/like`, {
        method: current?.is_liked ? "DELETE" : "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }, 45_000);
      update(next);
    } catch (error) {
      update(current);
      throw error;
    } finally { inFlight.current = false; setPending(null); }
  }

  return { byId: data.key === key ? data.byId : {}, pending, toggle, loadError };
}
