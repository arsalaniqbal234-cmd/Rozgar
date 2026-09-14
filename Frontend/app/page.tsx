"use client";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Search, Briefcase, ArrowUpRight } from "lucide-react";
import { api, salaryLabel } from "../lib/api";
import { Filters, initialFilters, useJobs } from "../lib/use-jobs";

export default function Home() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const feed = useJobs(filters);
  const { hasMore, loading, loadingMore, error: feedError, loadMore } = feed;
  const sentinel = useRef<HTMLDivElement>(null);
  const update = (patch: Partial<Filters>) => setFilters(previous => ({ ...previous, ...patch }));

  useEffect(() => {
    if (!sentinel.current || !hasMore || loading || loadingMore || feedError) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMore();
    }, { rootMargin: "200px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, feedError, loadMore]);

  async function saveSearch() {
    if (!user) { setNotice("Please sign in to save searches."); return; }
    if (!filters.keyword.trim()) { setNotice("Enter a keyword before saving."); return; }
    setSaving(true);
    setNotice("");
    try {
      const token = await getToken();
      await api("/saved-searches/", { method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keywords: filters.keyword, location: filters.location || null,
          min_salary: filters.min_salary || null, filters: { salary_only: filters.salary_only,
            remote_only: filters.remote_only, salary_currency: "USD", salary_period: "annual" } }) });
      setNotice("Search saved. Manage your alerts in Saved searches.");
    } catch (error) { setNotice((error as Error).message); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-7xl px-5 py-10">
    <header className="mx-auto max-w-3xl pb-10 text-center">
      <p className="mb-4 text-sm font-semibold tracking-wide text-cyan-300">YOUR NEXT OPPORTUNITY</p>
      <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Find work that <span className="text-indigo-400">works for you.</span></h1>
      <p className="mt-5 text-slate-400">Explore roles from multiple job boards. Search, filter, and save alerts for new matching jobs.</p>
    </header>
    <section aria-label="Search and filters" className="panel mb-8 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Search jobs</span>
          <Search aria-hidden className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input className="field pl-11" placeholder="Job title or company" maxLength={200}
            value={filters.keyword} onChange={event => update({ keyword: event.target.value })} />
        </label>
        <button className="button" onClick={saveSearch} disabled={saving}>{saving ? "Saving…" : "Save search"}</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2 text-sm">Location
          <input className="field mt-2" placeholder="City, country, or region" maxLength={200}
            value={filters.location} onChange={event => update({ location: event.target.value })} />
        </label>
        <label className="space-y-2 text-sm">Minimum annual salary (USD)
          <select className="field mt-2" value={filters.min_salary} onChange={event => update({ min_salary: Number(event.target.value) })}>
            <option value={0}>Any salary</option><option value={50000}>50,000+</option>
            <option value={80000}>80,000+</option><option value={100000}>100,000+</option>
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={filters.salary_only}
          onChange={event => update({ salary_only: event.target.checked })} /> Salary listed only</label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={filters.remote_only}
          onChange={event => update({ remote_only: event.target.checked })} /> Remote only</label>
      </div>
      <div className="flex flex-wrap gap-2">
        {["React", "Python", "Full Stack", "DevOps"].map(tag => <button key={tag} className="tag"
          onClick={() => update({ keyword: tag })}>{tag}</button>)}
        <button className="tag text-cyan-300" onClick={() => setFilters(initialFilters)}>Clear filters</button>
      </div>
      {notice && <p role="status" className="text-sm text-cyan-200">{notice}</p>}
    </section>
    <section aria-label="Job results" aria-busy={feed.loading || feed.loadingMore}>
      {feed.loading && <p role="status" className="py-16 text-center text-slate-400">Loading jobs…</p>}
      {feed.error && <div role="alert" className="panel mb-5 border-rose-500/40">
        <p>{feed.error}</p><button className="button mt-3" onClick={feed.retry}>Try again</button>
      </div>}
      {!feed.loading && !feed.error && feed.jobs.length === 0 && <div className="panel py-16 text-center">
        <Briefcase aria-hidden className="mx-auto mb-4 text-indigo-400" /><h2>No matching jobs yet</h2>
        <p className="mt-2 text-slate-400">Try a broader keyword or clear some filters.</p>
      </div>}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {feed.jobs.map(job => <article key={job.id} className="panel flex min-w-0 flex-col transition-colors hover:border-indigo-500">
          <p className="mb-3 text-sm text-cyan-300">{job.company}</p>
          <h2 className="break-words text-xl font-bold"><Link href={`/jobs/${job.id}`} className="hover:text-indigo-300">{job.title}</Link></h2>
          <p className="mt-4 text-sm text-emerald-300">{salaryLabel(job)}</p>
          <p className="mt-3 text-sm text-slate-400">{job.location || "Location not listed"} · {job.is_remote ? "Remote" : "Work arrangement not confirmed"}</p>
          <Link href={`/jobs/${job.id}`} className="mt-6 flex items-center gap-1 text-sm font-bold text-indigo-300">View job <ArrowUpRight aria-hidden size={16} /></Link>
        </article>)}
      </div>
      <div ref={sentinel} className="h-4" />
      {!feed.loading && feed.hasMore && !feed.error && <div className="py-5 text-center">
        <button className="button" disabled={feed.loadingMore} onClick={() => void feed.loadMore()}>
          {feed.loadingMore ? "Loading more…" : "Load more jobs"}
        </button>
      </div>}
      {!feed.loading && !feed.hasMore && feed.jobs.length > 0 && <p className="py-6 text-center text-sm text-slate-400">You’ve reached the end of these results.</p>}
    </section>
  </main>;
}
