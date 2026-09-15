"use client";

import { Bookmark, Check } from "lucide-react";
import { useId, useState } from "react";
import type { Job } from "../../lib/api";
import { useShortlist } from "../../lib/shortlist";

export default function BookmarkButton({ job }: { job: Job }) {
  const { jobs, ready, toggleJob } = useShortlist();
  const [notice, setNotice] = useState<string | null>(null);
  const noticeId = useId();
  const saved = jobs.some(item => item.id === job.id);
  return <div className="bookmark-control">
    <button type="button" className="bookmark-button" data-saved={saved}
      aria-label={`${saved ? "Remove saved job" : "Save job"} ${job.title}`}
      aria-pressed={saved} aria-describedby={notice ? noticeId : undefined}
      title={saved ? "Remove from your shortlist" : "Save to your shortlist"}
      disabled={!ready} onClick={() => setNotice(toggleJob(job))}>
      {saved ? <Check size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
    {notice && <p id={noticeId} role="alert" className="bookmark-feedback mt-2 text-sm text-rose-300">{notice}</p>}
  </div>;
}
