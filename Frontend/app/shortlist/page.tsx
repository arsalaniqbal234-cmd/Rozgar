"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, MapPin } from "lucide-react";
import { salaryLabel } from "../../lib/api";
import { useShortlist } from "../../lib/shortlist";
import BookmarkButton from "../components/bookmark-button";

export default function ShortlistPage() {
  const { jobs, ready, error, retry } = useShortlist();
  return <main id="main-content" className="page-shell py-10">
    <header className="page-header mb-8">
      <p className="eyebrow mb-3 text-sm font-semibold text-indigo-400">YOUR NEXT MOVE</p>
      <h1 className="text-3xl font-bold sm:text-4xl">Your shortlist</h1>
      <p className="mt-3 max-w-2xl text-slate-400">Keep promising opportunities together and come back when you’re ready. Saved on this browser, with no sign-in needed. Sign in to merge and sync your shortlist with your account.</p>
    </header>
    {error && <div role="alert" className="panel mb-6 border-rose-500/40">
      <p>{error}</p><button type="button" className="button mt-3" onClick={() => retry()}>Try again</button>
    </div>}
    {!ready && <p role="status" className="py-12 text-slate-400">Loading your saved jobs…</p>}
    {ready && jobs.length === 0 && <section className="panel py-16 text-center">
      <Bookmark className="mx-auto mb-5 text-indigo-400" size={36} aria-hidden="true" />
      <h2 className="text-xl font-semibold">Your next opportunity belongs here</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-400">Tap Save on any job to build your shortlist. Compare roles at your own pace and revisit the ones you like.</p>
      <Link className="button mt-6 inline-flex items-center gap-2" href="/">Explore jobs <ArrowUpRight size={16} aria-hidden="true" /></Link>
    </section>}
    {ready && jobs.length > 0 && <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{jobs.length} saved {jobs.length === 1 ? "opportunity" : "opportunities"}</p>
        <Link href="/" className="text-sm font-semibold text-indigo-300">Find more jobs <span aria-hidden="true">→</span></Link>
      </div>
      <div className="shortlist-grid grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map(job => <article key={job.id} className="panel job-card flex min-w-0 flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="break-words text-sm font-semibold text-cyan-300">{job.company}</p>
            <BookmarkButton job={job} />
          </div>
          <h2 className="break-words text-xl font-bold"><Link href={`/jobs/${job.id}`} className="hover:text-indigo-300">{job.title}</Link></h2>
          <p className="mt-4 text-sm font-medium text-emerald-300">{salaryLabel(job)}</p>
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-400"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{job.location || "Location not listed"}</p>
          <p className="mt-2 text-sm text-slate-400">{job.is_remote ? "Remote" : "Work arrangement not confirmed"}</p>
          <Link href={`/jobs/${job.id}`} className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-indigo-300">View job <ArrowUpRight aria-hidden="true" size={16} /></Link>
        </article>)}
      </div>
      <p className="mt-8 text-sm text-slate-400">Job details may change after saving. Open a role to check its latest information. Clearing site data clears guest saves and changes that have not synced to your account.</p>
    </>}
  </main>;
}
