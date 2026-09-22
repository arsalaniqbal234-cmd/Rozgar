"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Building2, Check, Copy, Globe2, MapPin, Wallet } from "lucide-react";
import { api, Job, safeLink, salaryLabel } from "../../../lib/api";
import { recordJobView } from "../../../lib/job-stats";
import BookmarkButton from "../../components/bookmark-button";
import CompanyFollowButton, { useCompanyFollow } from "../../components/company-follow-button";
import JobDescription from "../../components/job-description";

function JobCompanyActions({ job }: { job: Job }) {
  const follow = useCompanyFollow(job.id, job.company);
  return <>
    {safeLink(job.url) && <a className="button" href={safeLink(job.url)} target="_blank" rel="noopener noreferrer"
      onClick={() => { void follow.add(); }}>Apply on employer’s website <ArrowUpRight size={17} aria-hidden /></a>}
    <CompanyFollowButton company={job.company} state={follow} />
  </>;
}

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{ key: string; job?: Job; error?: string }>({ key: "" });
  const [retry, setRetry] = useState(0);
  const [shareNotice, setShareNotice] = useState("");
  const viewedId = useRef<string | null>(null);
  const key = id + ":" + retry;
  useEffect(() => {
    const controller = new AbortController();
    api<Job>("/jobs/" + encodeURIComponent(id), { signal: controller.signal })
      .then(job => { if (!controller.signal.aborted) setState({ key, job }); })
      .catch(error => { if (!controller.signal.aborted) setState({ key, error: error.message }); });
    return () => controller.abort();
  }, [id, key]);
  const job = state.key === key ? state.job : undefined;
  useEffect(() => {
    if (!job || viewedId.current === id) return;
    viewedId.current = id;
    recordJobView(id);
  }, [job, id]);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareNotice("Link copied. Share it with someone who might be interested.");
    } catch { setShareNotice("Copy this page’s address from your browser to share this job."); }
  }
  return <main id="main-content" className="page-shell detail-shell">
    <Link href="/" className="back-link"><ArrowLeft size={16} aria-hidden />Back to jobs</Link>
    {state.key !== key && <p role="status" className="my-8">Loading job…</p>}
    {state.key === key && state.error && <div role="alert" className="empty-state"><h3>This opportunity couldn’t be loaded</h3><p>{state.error}</p><button className="button" onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
    {job && <article className="panel">
      <div className="detail-header"><div><p className="eyebrow"><Building2 size={16} aria-hidden />{job.company}</p><h1>{job.title}</h1></div><BookmarkButton job={job} /></div>
      <div className="detail-facts">
        <p><Wallet size={16} aria-hidden />{salaryLabel(job)}</p>
        <p><MapPin size={16} aria-hidden />{job.location || "Location not listed"}</p>
        <p><Globe2 size={16} aria-hidden />{job.is_remote ? "Remote" : "Work arrangement not confirmed"}</p>
      </div>
      <JobDescription key={job.id} job={job} />
      <div className="detail-actions">
        <JobCompanyActions job={job} />
        <button type="button" className="tag" onClick={copyLink}>{shareNotice.startsWith("Link copied") ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}Copy job link</button>
      </div>
      {shareNotice && <p className="mt-4 text-sm text-slate-400" role="status">{shareNotice}</p>}
      <p className="mt-6 text-xs text-slate-500">Applications open on the employer’s website. For signed-in users, clicking Apply also follows this company for new role alerts. You can unfollow at any time. Check the original listing for the latest details.</p>
    </article>}
  </main>;
}
