"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { api, Job, safeLink, salaryLabel } from "../../../lib/api";

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{ id: string; job?: Job; error?: string }>({ id: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<Job>("/jobs/" + encodeURIComponent(id), { signal: controller.signal })
      .then(job => { if (!controller.signal.aborted) setState({ id, job }); })
      .catch(error => { if (!controller.signal.aborted) setState({ id, error: error.message }); });
    return () => controller.abort();
  }, [id, retry]);
  const job = state.id === id ? state.job : undefined;
  return <main className="mx-auto max-w-3xl px-5 py-10">
    <Link href="/" className="text-indigo-300">← Back to jobs</Link>
    {state.id !== id && <p role="status" className="my-8">Loading job…</p>}
    {state.id === id && state.error && <div role="alert" className="panel mt-6">{state.error}
      <button className="tag ml-3" onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
    {job && <article className="panel mt-6">
      <p className="text-cyan-300">{job.company}</p><h1 className="my-4 text-3xl font-bold">{job.title}</h1>
      <p className="text-emerald-300">{salaryLabel(job)}</p>
      <p className="mt-3 text-slate-400">{job.location || "Location not listed"} · {job.is_remote ? "Remote" : "Work arrangement not confirmed"}</p>
      <div className="job-description my-8" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || "<p>No description provided.</p>", { FORBID_TAGS: ["style", "form", "input"] }) }} />
      {safeLink(job.url) && <a className="button inline-block" href={safeLink(job.url)} target="_blank" rel="noopener noreferrer">Apply on employer’s website ↗</a>}
    </article>}
  </main>;
}
