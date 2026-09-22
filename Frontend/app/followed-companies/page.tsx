"use client";

import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, CompanyFollow } from "../../lib/api";

export default function FollowedCompaniesPage() {
  const { isSignedIn, userId, getToken } = useAuth();
  const [items, setItems] = useState<CompanyFollow[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const key = `${userId ?? ""}:${refresh}`;
  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    getToken().then(token => {
      if (!token) throw new Error("Please sign in again.");
      return api<CompanyFollow[]>("/company-follows", {
        headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
      });
    }).then(data => { if (!controller.signal.aborted) { setItems(data); setError(""); setLoadedFor(key); } })
      .catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoadedFor(key); } });
    return () => controller.abort();
  }, [isSignedIn, getToken, key]);

  async function remove(item: CompanyFollow) {
    setBusy(item.id);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      await api(`/company-follows/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setItems(previous => previous.filter(value => value.id !== item.id));
      setError("");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(null); }
  }

  return <main id="main-content" className="page-shell detail-shell">
    <header className="page-header mb-8"><p className="eyebrow mb-3"><Bell size={16} aria-hidden />COMPANY UPDATES</p>
      <h1>Followed companies</h1>
      <p className="my-5 text-slate-400">Get an email when a company you follow posts a new role. Applying from Rozgar follows that company automatically.</p>
      <Link href="/" className="back-link">Explore jobs</Link>
    </header>
    <Show when="signed-out"><SignInButton mode="modal"><button className="button">Sign in to manage follows</button></SignInButton></Show>
    <Show when="signed-in">
      {loadedFor !== key && <p role="status">Loading followed companies…</p>}
      {loadedFor === key && error && <div role="alert" className="panel">{error} <button className="tag" onClick={() => setRefresh(value => value + 1)}>Retry</button></div>}
      {loadedFor === key && !error && items.length === 0 && <p className="panel">You aren’t following any companies yet. Open a job to follow its company.</p>}
      <div className="space-y-4">{(loadedFor === key && !error ? items : []).map(item =>
        <article key={item.id} className="panel flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-lg font-bold">{item.company_name}</h2>
            <p className="mt-2 text-sm text-slate-400">Following since {new Date(item.followed_at).toLocaleDateString()}</p></div>
          <button type="button" className="tag" disabled={busy === item.id} onClick={() => void remove(item)}
            aria-label={`Unfollow ${item.company_name}`}><BellOff size={16} aria-hidden />{busy === item.id ? "Updating…" : "Unfollow"}</button>
        </article>)}</div>
    </Show>
  </main>;
}
