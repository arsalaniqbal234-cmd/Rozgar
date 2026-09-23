import { resolveJobCategory, type JobCategoryInput } from "./job-preview-config";

export type PreviewVideo = { webm: string; mp4: string; poster: string };
/** Set to a versioned CDN directory at build time; local public assets work by default. */
export function videoForCategory(category?: string | null, variant: 1 | 2 = 1): PreviewVideo {
  const base = (process.env.NEXT_PUBLIC_JOB_VIDEO_BASE_URL || "/job-previews/video").replace(/\/$/, "");
  const stem = `${base}/${resolveJobCategory({ category })}-${variant}`;
  return { webm: `${stem}.webm?v=2`, mp4: `${stem}.mp4?v=2`, poster: `${stem}.jpg?v=2` };
}

/** Resolve the actual job once. Cards use the category's primary interaction demo;
 * secondary compositions remain available explicitly, rather than job-ID parity
 * selecting the similarly structured activity screen for half of every field. */
export function videoForJob(job: JobCategoryInput): PreviewVideo {
  return videoForCategory(resolveJobCategory(job), 1);
}
