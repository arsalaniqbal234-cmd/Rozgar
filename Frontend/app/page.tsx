"use client";

import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Bell, Bookmark, BriefcaseBusiness, Check, Code2, Compass, Globe2, LayoutGrid, List, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { api, salaryLabel } from "../lib/api";
import { emailAlertsEnabled } from "../lib/features";
import { Filters, initialFilters, useJobs } from "../lib/use-jobs";
import BookmarkButton from "./components/bookmark-button";
import SearchSuggestions from "./components/search-suggestions";

const paths = [
  { label: "Engineering", keyword: "engineer", icon: Code2 },
  { label: "Design", keyword: "design", icon: Compass },
  { label: "Data & analytics", keyword: "data", icon: Sparkles },
  { label: "Marketing", keyword: "marketing", icon: Globe2 },
];
const sources: Record<string, string> = { remoteok: "RemoteOK", arbeitnow: "Arbeitnow", jobicy: "Jobicy", greenhouse: "Company careers", ashby: "Company careers" };
// Browser form-fill extensions can add attributes such as fdprocessedid before hydration.
// Only search controls suppress these benign attribute mismatches; the panel stays server-rendered.

export default function Home() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const feed = useJobs(filters);
  const searchInput = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<Filters>) => setFilters(previous => ({ ...previous, ...patch }));
  const activeCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || target?.isContentEditable || target?.closest("input, textarea, select, [role=dialog]")) return;
      event.preventDefault();
      searchInput.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  async function saveSearch() {
    if (!user) { setNotice("Please sign in to save searches."); return; }
    if (!filters.keyword.trim()) { setNotice("Enter a keyword before saving."); searchInput.current?.focus(); return; }
    setSaving(true);
    setNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      await api("/saved-searches", { method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keywords: filters.keyword, location: filters.location || null,
          min_salary: filters.min_salary || null, filters: { salary_only: filters.salary_only,
            remote_only: filters.remote_only, salary_currency: "USD", salary_period: "annual" } }) });
      setNotice(emailAlertsEnabled ? "Search saved. Manage your alerts in Saved searches." : "Search saved. Email alerts are paused for now. Manage your searches in Saved searches.");
    } catch (error) { setNotice((error as Error).message); }
    finally { setSaving(false); }
  }

  return <main id="main-content" className="page-shell">
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> A little direction. A world of opportunity.</p>
        <h1 id="hero-title">Good work.<br /><span>Better possibilities.</span></h1>
        <p className="hero-description">Your next chapter starts with the right opportunity. Explore roles across job boards, find your fit, and keep your favorites close.</p>
        <div className="hero-actions">
          <a href="#opportunities" className="button">Explore opportunities <ArrowDown size={17} aria-hidden /></a>
          <span className="hero-note"><Check size={16} aria-hidden /> Free to explore. Yours to discover.</span>
        </div>
      </div>
      <div className="journey-card">
        <div className="journey-top"><span className="eyebrow">MAKE YOUR NEXT MOVE</span><span className="journey-symbol" aria-hidden>↗</span></div>
        <h2>A career that<br />feels like <em>you.</em></h2>
        <ol className="journey-steps">
          <li><span className="step-icon"><Search size={18} aria-hidden /></span><div><strong>Find your direction</strong><span>Search for what matters to you.</span></div><span className="step-number">01</span></li>
          <li><span className="step-icon"><Bookmark size={18} aria-hidden /></span><div><strong>Make a shortlist</strong><span>Keep the roles that stand out.</span></div><span className="step-number">02</span></li>
          <li><span className="step-icon"><ArrowUpRight size={18} aria-hidden /></span><div><strong>Take the next step</strong><span>Apply directly with the employer.</span></div><span className="step-number">03</span></li>
        </ol>
        <Link href="/shortlist" className="journey-link">Your next chapter, in one place <ArrowUpRight size={16} aria-hidden /></Link>
      </div>
    </section>

    <div className="source-strip"><span>More possibilities. Fewer tabs.</span><div><span>RemoteOK</span><span>Arbeitnow</span><span>Jobicy</span></div><span className="source-note">Opportunities from multiple job boards</span></div>

    <section id="opportunities" aria-label="Search and filters" className="search-panel">
      <div className="search-heading"><h2>What does your next role look like?</h2><span><SlidersHorizontal size={14} aria-hidden /> Make it your search</span></div>
      <div className="search-primary">
        <SearchSuggestions field="title" label="Search jobs" placeholder="Job title, skill, or company"
          value={filters.keyword} onChange={keyword => update({ keyword })} inputRef={searchInput} shortcut />
        <SearchSuggestions field="location" label="Location" placeholder="City, country, or region"
          value={filters.location} onChange={location => update({ location })} />
        <button className="button save-search-button" onClick={saveSearch} disabled={saving}><Bell size={17} aria-hidden />{saving ? "Saving…" : "Save search"}</button>
      </div>
      <div className="search-secondary">
        <label className="salary-filter"><span>Minimum annual salary (USD)</span><select suppressHydrationWarning className="field" value={filters.min_salary} onChange={event => update({ min_salary: Number(event.target.value) })}>
          <option value={0}>Any salary</option><option value={50000}>50,000+</option><option value={80000}>80,000+</option><option value={100000}>100,000+</option>
        </select></label>
        <label className="check-filter"><input suppressHydrationWarning type="checkbox" checked={filters.salary_only} onChange={event => update({ salary_only: event.target.checked })} /> Salary listed only</label>
        <label className="check-filter"><input suppressHydrationWarning type="checkbox" checked={filters.remote_only} onChange={event => update({ remote_only: event.target.checked })} /> Remote only</label>
        <button className="clear-filters" onClick={() => setFilters(initialFilters)}><X size={14} aria-hidden />Clear filters{activeCount > 0 && <span>{activeCount}</span>}</button>
      </div>
      <div className="quick-searches"><span>Try a keyword</span>{["React", "Python", "Full Stack", "DevOps"].map(tag => <button key={tag} className="keyword-chip" aria-pressed={filters.keyword === tag} onClick={() => update({ keyword: tag })}>{tag}<ArrowUpRight size={12} aria-hidden /></button>)}</div>
      {notice && <p role="status" className="search-notice">{notice}</p>}
    </section>

    <div className="discovery-layout">
      <aside className="discovery-sidebar" aria-label="Career discovery">
        <div className="sidebar-section"><p className="eyebrow">FIND YOUR FOCUS</p><h2>Explore a path</h2><div className="career-paths">{paths.map(({ label, keyword, icon: Icon }) => <button key={keyword} aria-pressed={filters.keyword === keyword} onClick={() => update({ keyword })}><Icon size={18} aria-hidden /><span>{label}</span><ArrowUpRight size={14} aria-hidden /></button>)}</div></div>
        <div className="sidebar-note"><div className="sidebar-note-icon"><Bell size={21} aria-hidden /></div><h3>Your search.<br />On your schedule.</h3><p>{emailAlertsEnabled ? "Save a search and get alerts when a new role matches your interests." : "Save the searches that matter to you. Email alerts are paused for now."}</p><Link href="/saved-searches">{emailAlertsEnabled ? "Manage your alerts" : "Manage your searches"} <ArrowUpRight size={15} aria-hidden /></Link></div>
        <p className="sidebar-tip"><Bookmark size={16} aria-hidden /><span>See something you like? Bookmark it to revisit in your shortlist.</span></p>
      </aside>

      <section className="results-section" aria-label="Job results" aria-busy={feed.loading}>
        <div className="results-heading"><div><p className="eyebrow">THE NEXT CHAPTER</p><h2>{activeCount ? "Your matching opportunities" : "Latest opportunities"}</h2><p className="results-count">{feed.loading ? "Finding your next possibility…" : `${feed.jobs.length} ${feed.jobs.length === 1 ? "role" : "roles"} on page ${feed.page}`}</p></div>
          <div className="view-switch" role="group" aria-label="Results layout"><button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={17} aria-hidden /></button><button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} aria-hidden /></button></div>
        </div>
        {feed.loading && <div><p role="status" className="sr-only">Loading jobs…</p><div className="job-grid" aria-hidden>{Array.from({ length: 6 }, (_, i) => <div className="job-skeleton" key={i}><div /><span /><span /><span /></div>)}</div></div>}
        {feed.error && <div role="alert" className="empty-state"><Globe2 size={28} aria-hidden /><h3>Let’s try that again</h3><p>{feed.error}</p><button className="button" onClick={feed.retry}>Try again</button></div>}
        {!feed.loading && !feed.error && feed.jobs.length === 0 && <div className="empty-state"><BriefcaseBusiness size={30} aria-hidden /><h3>No matching jobs yet</h3><p>A new direction could be one keyword away. Try a broader search or clear some filters.</p><button className="button" onClick={() => setFilters(initialFilters)}>Explore all roles</button></div>}
        <div className={`job-grid ${view === "list" ? "job-list" : ""}`}>{feed.jobs.map(job => <article key={job.id} className="job-card">
          <div className="job-card-top"><span className={`company-mark mark-${job.id % 4}`} aria-hidden>{job.company.trim().slice(0, 2).toUpperCase()}</span><div className="job-company"><p>{job.company}</p><span>{sources[job.source_id.split("_")[0]] || "Job board"}</span></div><BookmarkButton job={job} /></div>
          <h3><Link href={`/jobs/${job.id}`} prefetch={false}>{job.title}</Link></h3>
          <p className="job-location"><MapPin size={14} aria-hidden />{job.location || "Location not listed"}</p>
          <div className="job-tags">{job.is_remote ? <span className="remote-tag"><Globe2 size={12} aria-hidden />Remote</span> : <span>Work arrangement not confirmed</span>}{job.salary ? <span>Salary listed</span> : null}</div>
          <div className="job-card-bottom"><p className="job-salary">{salaryLabel(job)}</p><Link href={`/jobs/${job.id}`} prefetch={false} aria-label={`View job at ${job.company}`}><span>View job</span><ArrowUpRight size={17} aria-hidden /></Link></div>
        </article>)}</div>
        {(feed.hasPrevious || feed.hasNext) && <nav className="job-pagination" aria-label="Job result pages">
          <button type="button" onClick={feed.previousPage} disabled={!feed.hasPrevious || feed.loading}>Previous</button>
          <span>Page {feed.page}</span>
          <button type="button" onClick={feed.nextPage} disabled={!feed.hasNext || feed.loading}>Next</button>
        </nav>}
        {!feed.loading && !feed.hasNext && feed.jobs.length > 0 && <p className="results-end"><Check size={15} aria-hidden />You’ve reached the end of these results.</p>}
      </section>
    </div>
    <section className="closing-note"><span className="eyebrow">A SMALL STEP. A NEW POSSIBILITY.</span><h2>Your next chapter is out there.</h2><p>Keep exploring. Save what speaks to you. Find work that fits your life.</p><Link href="/shortlist" className="button">Open your shortlist <ArrowUpRight size={17} aria-hidden /></Link></section>
  </main>;
}
