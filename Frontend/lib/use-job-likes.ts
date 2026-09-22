"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";

export type JobLikeStats = { job_id: number; likes: number; is_liked: boolean };

export function useJobLikes(jobIds: number[], userId: string | undefined, getToken: () => Promise<string | null>) {
  const ids = jobIds.join(",");
  const key = `${userId || "anonymous"}:${ids}`;
  const [data, setData] = useState<{ key: string; byId: Record<number, JobLikeStats> }>({ key: "", byId: {} });
  const [pending, setPending] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
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
          setData({ key, byId: Object.fromEntries(rows.map(row => [row.job_id, row])) });
          setLoadError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof ApiError && error.status === 404
          ? "Like service is missing from the running backend."
          : "Like counts are unavailable. Check that the backend and database migration are running.");
      }
    }
    void load();
    return () => controller.abort();
  }, [ids, key, userId, getToken]);

  async function toggle(jobId: number) {
    if (pending !== null) return;
    const token = await getToken();
    if (!token) throw new Error("Please sign in to like a job.");
    setPending(jobId);
    try {
      const current = data.key === key ? data.byId[jobId] : undefined;
      const next = await api<JobLikeStats>(`/jobs/${jobId}/like`, {
        method: current?.is_liked ? "DELETE" : "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }, 45_000);
      setData(previous => ({ key, byId: { ...(previous.key === key ? previous.byId : {}), [jobId]: next } }));
    } finally { setPending(null); }
  }

  return { byId: data.key === key ? data.byId : {}, pending, toggle, loadError };
}
