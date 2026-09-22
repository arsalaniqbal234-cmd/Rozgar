"use client";

import { Eye, Heart } from "lucide-react";
import { formatCount } from "../../lib/format-count";

type CardStatsProps = {
  likes: number;
  views: number;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  className?: string;
};

export default function CardStats({ likes, views, isLiked = false, onLikeToggle, className = "" }: CardStatsProps) {
  const likeLabel = `${formatCount(likes)} ${likes === 1 ? "like" : "likes"}`;
  const viewLabel = `${formatCount(views)} ${views === 1 ? "view" : "views"}`;
  return <div className={`flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-[var(--muted)] ${className}`}>
    <button type="button" onClick={onLikeToggle} disabled={!onLikeToggle} aria-label={`${isLiked ? "Unlike" : "Like"}; ${likeLabel}`}
      aria-pressed={isLiked} className={`group inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 transition-transform duration-150 hover:scale-110 active:scale-90 motion-reduce:transform-none ${isLiked ? "text-rose-500" : "hover:text-rose-500"} disabled:cursor-default disabled:hover:scale-100`}>
      <Heart size={17} aria-hidden fill={isLiked ? "currentColor" : "none"} className="transition-transform duration-150 group-active:scale-125 motion-reduce:transform-none" />
      <span>{formatCount(likes)}</span>
    </button>
    <span aria-label={viewLabel} className="inline-flex min-h-9 items-center gap-1.5 px-1"><Eye size={17} aria-hidden /><span>{formatCount(views)}</span></span>
  </div>;
}
