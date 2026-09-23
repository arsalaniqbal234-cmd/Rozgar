"use client";

import Link from "next/link";
import { ArrowUpRight, Globe2, MapPin } from "lucide-react";
import { salaryLabel, type Job } from "../../lib/api";
import { resolveJobCategory } from "../../lib/job-preview-config";
import { videoForJob } from "../../lib/job-video-config";
import BookmarkButton from "./bookmark-button";
import CompanyLogo from "./company-logo";
import JobCardStats from "./job-card-stats";
import HoverVideoPreview from "./hover-video-preview";

const sources: Record<string, string> = { remoteok: "RemoteOK", arbeitnow: "Arbeitnow", jobicy: "Jobicy", greenhouse: "Company careers", ashby: "Company careers" };
export type JobCardProps = {
  job: Job; list?: boolean; likes?: number; isLiked?: boolean;
  onLikeToggle?: () => void; likeError?: string;
};

export default function JobCard({ job, list = false, likes = 0, isLiked = false, onLikeToggle, likeError }: JobCardProps) {
  const category = resolveJobCategory(job);
  return <article className="job-card video-job-card h-full" data-preview-category={category}>
    <div className="job-preview relative -mx-2 -mt-2 mb-2">
      <HoverVideoPreview video={videoForJob(job)}
        fit={list ? "contain" : "cover"}
        poster={job.preview_images?.[0]} alt={`${job.company} ${category} job preview`}
        className={list ? "h-56 w-full" : "job-preview-shot w-full"} />
    </div>
    <div className="job-card-top"><CompanyLogo company={job.company} variant={job.id % 4} sourceId={job.source_id} jobUrl={job.url} />
      <div className="job-company"><p>{job.company}</p><span>{sources[job.source_id.split("_")[0]] || "Job board"}</span></div>
      <BookmarkButton job={job} /></div>
    <h3><Link href={`/jobs/${job.id}`} prefetch={false}>{job.title}</Link></h3>
    <p className="job-location"><MapPin size={14} aria-hidden />{job.location || "Location not listed"}</p>
    <div className="job-tags">{job.is_remote ? <span className="remote-tag"><Globe2 size={12} aria-hidden />Remote</span> : <span>Work arrangement not confirmed</span>}{job.salary ? <span>Salary listed</span> : null}</div>
    <div className="job-card-bottom"><p className="job-salary">{salaryLabel(job)}</p><Link href={`/jobs/${job.id}`} prefetch={false} aria-label={`View job at ${job.company}`}><span>View job</span><ArrowUpRight size={17} aria-hidden /></Link></div>
    <JobCardStats jobId={job.id} likes={likes} isLiked={isLiked} onLikeToggle={onLikeToggle} postedAt={job.posted_at ?? job.created_at} />
    {likeError && <p role="alert" className="mt-1 text-xs text-rose-600">Could not update like: {likeError}</p>}
  </article>;
}
