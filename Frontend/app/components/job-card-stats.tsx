"use client";

import { useEffect, useState } from "react";
import CardStats from "./card-stats";
import { readJobStats } from "../../lib/job-stats";

export default function JobCardStats({ jobId, likes = 0, isLiked = false, onLikeToggle, views = 0 }: {
  jobId: number; likes?: number; isLiked?: boolean; onLikeToggle?: () => void; views?: number;
}) {
  const [localViews, setLocalViews] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setLocalViews(readJobStats(jobId).views), 0);
    return () => window.clearTimeout(timer);
  }, [jobId]);
  return <CardStats likes={likes} views={views + localViews}
    isLiked={isLiked} onLikeToggle={onLikeToggle} className="mt-3 border-t border-[var(--border)] pt-2" />;
}
