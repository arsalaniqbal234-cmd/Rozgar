"use client";

import { useEffect, useState } from "react";
import CardStats from "./card-stats";
import { readJobStats } from "../../lib/job-stats";
import { formatRelativeTime } from "../../lib/format-relative-time";

export default function JobCardStats({ jobId, likes = 0, isLiked = false, onLikeToggle, views = 0, postedAt }: {
  jobId: number; likes?: number; isLiked?: boolean; onLikeToggle?: () => void; views?: number; postedAt?: string | null;
}) {
  const [postedLabel, setPostedLabel] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setPostedLabel(formatRelativeTime(postedAt));
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [postedAt]);
  const [localViews, setLocalViews] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setLocalViews(readJobStats(jobId).views), 0);
    return () => window.clearTimeout(timer);
  }, [jobId]);
  return <CardStats likes={likes} views={views + localViews}
    postedTime={postedAt && postedLabel ? { label: postedLabel, dateTime: postedAt } : undefined}
    isLiked={isLiked} onLikeToggle={onLikeToggle} className="mt-3 border-t border-[var(--border)] pt-2" />;
}
