"use client";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api, SavedSearch } from "../../lib/api";

export default function SavedSearchesPage() {
  const { isSignedIn, getToken, userId } = useAuth();
  const [owner, setOwner] = useState<string | null>(null);
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    getToken().then(token => api<SavedSearch[]>("/saved-searches/", {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    })).then(data => { if (!controller.signal.aborted) { setOwner(userId || null); setItems(data); setError(""); setLoaded(true); } })
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoaded(true); } });
    return () => controller.abort();
  }, [isSignedIn, getToken, userId, refresh]);

  async function remove(id: number) {
    setBusy(id);
    try {
      const token = await getToken();
      await api(`/saved-searches/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setItems(previous => previous.filter(item => item.id !== id));
      setError("");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(null); }
  }
  return <main className="mx-auto max-w-3xl px-5 py-10">
    <h1 className="text-3xl font-bold">Saved searches</h1>
    <p className="my-5 text-slate-400">Alerts use your verified account email. Delete a search to stop its alerts.</p>
    <Show when="signed-out"><SignInButton mode="modal"><button className="button">Sign in to view your searches</button></SignInButton></Show>
    <Show when="signed-in">
      {(!loaded || owner !== userId) && <p role="status">Loading saved searches…</p>}
      {error && <div role="alert" className="panel">{error} <button className="tag" onClick={() => setRefresh(n => n + 1)}>Retry</button></div>}
      {loaded && owner === userId && !error && items.length === 0 && <p className="panel">No saved searches yet. Save one from the job feed.</p>}
      <div className="space-y-4">{(owner === userId ? items : []).map(item => <article key={item.id} className="panel flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-lg font-bold">{item.keywords}</h2>
          <p className="mt-2 text-sm text-slate-400">{item.location || "Any location"}
            {item.min_salary ? ` · USD ${item.min_salary.toLocaleString()}+ annually` : ""}
            {item.filters?.remote_only ? " · Remote only" : ""}
            {item.filters?.salary_only ? " · Salary listed" : ""}</p>
          <p className="mt-2 text-xs text-slate-500">{item.last_notified_at ? "Last alert: " + new Date(item.last_notified_at).toLocaleString() : "Waiting for new matches"}</p>
        </div>
        <button className="tag text-rose-300" disabled={busy === item.id} onClick={() => void remove(item.id)}
          aria-label={`Delete search ${item.keywords}`}>{busy === item.id ? "Deleting…" : "Delete"}</button>
      </article>)}</div>
    </Show>
  </main>;
}
