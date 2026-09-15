"use client";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowUpRight, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { api, SavedSearch } from "../../lib/api";
import { emailAlertsEnabled } from "../../lib/features";

export default function SavedSearchesPage() {
  const { isSignedIn, getToken, userId } = useAuth();
  const [owner, setOwner] = useState<string | null>(null);
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const requestKey = (userId || "") + ":" + refresh;
  const loaded = loadedKey === requestKey;
  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    getToken().then(token => api<SavedSearch[]>("/saved-searches", {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    })).then(data => { if (!controller.signal.aborted) { setOwner(userId || null); setItems(data); setError(""); setLoadedKey(requestKey); } })
      .catch(error => { if (!controller.signal.aborted) { setOwner(userId || null); setError(error.message); setLoadedKey(requestKey); } });
    return () => controller.abort();
  }, [isSignedIn, getToken, userId, requestKey]);

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
  return <main id="main-content" className="page-shell detail-shell">
    <header className="page-header mb-8"><p className="eyebrow mb-3"><Bell size={15} aria-hidden />GOOD OPPORTUNITIES, LESS SEARCHING</p>
    <h1>Saved searches</h1>
    <p className="my-5 text-slate-400">{emailAlertsEnabled ? "Let your next opportunity come to you. Alerts use your verified account email. Delete a search to stop its alerts." : "Keep the searches you want to revisit. Email alerts are paused for now; deleting a search removes it from this list."}</p>
    <Link className="back-link" href="/">Find a new opportunity <ArrowUpRight size={15} aria-hidden /></Link></header>
    <Show when="signed-out"><SignInButton mode="modal"><button className="button">Sign in to view your searches</button></SignInButton></Show>
    <Show when="signed-in">
      {(!loaded || owner !== userId) && <p role="status">Loading saved searches…</p>}
      {loaded && error && <div role="alert" className="panel">{error} <button className="tag" onClick={() => setRefresh(n => n + 1)}>Retry</button></div>}
      {loaded && owner === userId && !error && items.length === 0 && <p className="panel">No saved searches yet. Save one from the job feed.</p>}
      <div className="space-y-4">{(loaded && owner === userId && !error ? items : []).map(item => <article key={item.id} className="panel flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-lg font-bold">{item.keywords}</h2>
          <p className="mt-2 text-sm text-slate-400">{item.location || "Any location"}
            {item.min_salary ? ` · USD ${item.min_salary.toLocaleString()}+ annually` : ""}
            {item.filters?.remote_only ? " · Remote only" : ""}
            {item.filters?.salary_only ? " · Salary listed" : ""}</p>
          <p className="mt-2 text-xs text-slate-500">{item.last_notified_at ? "Last alert: " + new Date(item.last_notified_at).toLocaleString() : emailAlertsEnabled ? "Waiting for new matches" : "Email alerts paused"}</p>
        </div>
        <button className="tag text-rose-300" disabled={busy === item.id} onClick={() => void remove(item.id)}
          aria-label={`Delete search ${item.keywords}`}>{busy === item.id ? "Deleting…" : "Delete"}</button>
      </article>)}</div>
    </Show>
  </main>;
}
