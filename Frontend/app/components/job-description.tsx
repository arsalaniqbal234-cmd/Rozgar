"use client";

import { ArrowUpRight, Languages } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Job } from "../../lib/api";
import { safeLink } from "../../lib/api";
import { supportsBrowserTranslation, translateDescriptionToEnglish } from "../../lib/browser-translation";
import { formatJobDescription } from "../../lib/job-description";

function externalTranslateUrl(jobUrl: string): string | undefined {
  if (!safeLink(jobUrl)) return undefined;
  const url = new URL("https://translate.google.com/translate");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", "en");
  url.searchParams.set("u", jobUrl);
  return url.toString();
}

export default function JobDescription({ job }: { job: Job }) {
  const originalHtml = useMemo(() => formatJobDescription(job.description), [job.description]);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const run = useRef(0);
  const fallbackUrl = externalTranslateUrl(job.url);

  useEffect(() => {
    const timer = window.setTimeout(() => setSupported(supportsBrowserTranslation()), 0);
    return () => { window.clearTimeout(timer); run.current += 1; };
  }, []);

  async function toggleTranslation() {
    if (showEnglish) { setShowEnglish(false); return; }
    if (translatedHtml) { setShowEnglish(true); return; }
    const currentRun = ++run.current;
    setBusy(true);
    setProgress(0);
    setNotice("Preparing English translation. A language pack may download the first time.");
    try {
      const result = await translateDescriptionToEnglish(originalHtml, (done, total) => {
        if (currentRun === run.current && total) setProgress(Math.round(done / total * 100));
      });
      if (currentRun !== run.current) return;
      if (result.sourceLanguage === "en") {
        setNotice("This description is already in English.");
      } else {
        setTranslatedHtml(result.html);
        setShowEnglish(true);
        setNotice("Machine translation. Check the original listing before applying.");
      }
    } catch (error) {
      if (currentRun === run.current) setNotice((error as Error).message);
    } finally { if (currentRun === run.current) setBusy(false); }
  }

  async function copyDescription() {
    try {
      const text = new DOMParser().parseFromString(originalHtml, "text/html").body.textContent?.trim() || "";
      await navigator.clipboard.writeText(text);
      setNotice("Description copied. Paste it into your preferred translation app.");
    } catch { setNotice("Select and copy the description to translate it in another app."); }
  }

  return <section aria-label="Job description">
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">About this role</h2>
      {supported === true && <button type="button" className="tag transition-transform duration-150 hover:scale-[1.03] active:scale-95"
        disabled={busy} onClick={() => void toggleTranslation()} aria-pressed={showEnglish}>
        <Languages size={16} aria-hidden />{busy ? `Translating${progress ? ` ${progress}%` : "…"}` : showEnglish ? "Show original" : "Read in English"}
      </button>}
      {supported === false && <div className="flex flex-wrap items-center gap-2">
        {fallbackUrl && <a className="tag" href={fallbackUrl} target="_blank" rel="noopener noreferrer">
          <Languages size={16} aria-hidden />Translate employer page <ArrowUpRight size={15} aria-hidden />
        </a>}
        <button type="button" className="tag" onClick={() => void copyDescription()}>Copy description</button>
      </div>}
    </div>
    {notice && <p role="status" className="mt-3 text-xs text-slate-500">{notice}
      {!busy && !showEnglish && supported && fallbackUrl && notice !== "This description is already in English." && <> <a className="underline" href={fallbackUrl} target="_blank" rel="noopener noreferrer">Try the employer page</a>.</>}
    </p>}
    <div className="job-description my-8" lang={showEnglish ? "en" : undefined}
      dangerouslySetInnerHTML={{ __html: showEnglish && translatedHtml ? translatedHtml : originalHtml }} />
  </section>;
}
