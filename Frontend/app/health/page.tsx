"use client";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Health = { generated_at: string; total_jobs: number;
  sources: { source: string; status: string; last_success_at: string | null; duration_ms: number | null; fetched: number; added: number; skipped: number; error_code: string | null }[];
  alerts: { configured: boolean; counts: Record<string, number> };
  monitoring: { sentry_configured: boolean; redis_configured: boolean } };

export default function HealthPage() {
  const { isSignedIn, getToken, userId } = useAuth();
  const [snapshot, setSnapshot] = useState<{ owner: string | null | undefined; data: Health } | null>(null);
  const health = snapshot && snapshot.owner === userId ? snapshot.data : null;
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    async function load() {
      try {
        const token = await getToken();
        const data = await api<Health>("/health", { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!controller.signal.aborted) { setSnapshot({ owner: userId, data }); setError(""); }
      } catch (error) { if (!controller.signal.aborted) setError((error as Error).message); }
    }
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [isSignedIn, getToken, userId, refresh]);
  return <main className="mx-auto max-w-6xl px-5 py-10">
    <h1 className="text-3xl font-bold">Pipeline health</h1>
    <p className="my-4 text-slate-400">Operations dashboard · refreshes every 30 seconds</p>
    <Show when="signed-out"><SignInButton mode="modal"><button className="button">Sign in</button></SignInButton></Show>
    <Show when="signed-in">
      {error && <p role="alert" className="panel border-rose-600">{error} {health && "The data below may be out of date."}</p>}
      <button className="tag my-4" onClick={() => setRefresh(n => n + 1)}>Refresh now</button>
      {!health && !error && <p role="status">Loading pipeline health…</p>}
      {health && <>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel"><p className="text-slate-400">Stored jobs</p><p className="mt-2 text-3xl font-bold">{health.total_jobs}</p></div>
          <div className="panel"><p className="text-slate-400">Email alerts</p><p className="mt-2">{health.alerts.configured ? "Configured" : "Not configured"}</p></div>
          <div className="panel"><p>Sentry: {health.monitoring.sentry_configured ? "Configured" : "Not configured"}</p><p>Redis: {health.monitoring.redis_configured ? "Configured" : "Not configured"}</p></div>
        </div>
        <div className="my-6 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm"><caption className="p-4 text-left">Latest scrape per source</caption>
            <thead className="bg-slate-900"><tr>{["Source", "Status", "Last success", "Duration", "Fetched / added / skipped", "Error"].map(label => <th className="p-4" key={label}>{label}</th>)}</tr></thead>
            <tbody>{health.sources.map(source => <tr key={source.source} className="border-t border-slate-800">
              <td className="p-4 font-bold">{source.source}</td><td className={`p-4 ${source.status === "ok" ? "text-emerald-300" : "text-amber-300"}`}>{source.status}</td>
              <td className="p-4">{source.last_success_at ? new Date(source.last_success_at).toLocaleString() : "Never"}</td>
              <td className="p-4">{source.duration_ms === null ? "—" : Math.round(source.duration_ms) + " ms"}</td>
              <td className="p-4">{source.fetched} / {source.added} / {source.skipped}</td><td className="p-4">{source.error_code || "—"}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <section className="panel"><h2 className="font-bold">Alert delivery queue</h2>
          <div className="mt-4 flex flex-wrap gap-5">{["pending", "retry", "sent", "failed", "needs_review"].map(status => <p key={status}>{status}: <strong>{health.alerts.counts[status] || 0}</strong></p>)}</div>
          <p className="mt-4 text-sm text-slate-400">Needs review means a delivery is too old to retry safely without checking the email provider.</p>
        </section>
        <p className="mt-4 text-xs text-slate-500">Snapshot: {new Date(health.generated_at).toLocaleString()}</p>
      </>}
    </Show>
  </main>;
}
