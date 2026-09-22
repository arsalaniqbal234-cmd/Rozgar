const key = (id: number | string) => `rozgar:job-stats:${id}`;

export type LocalJobStats = { views: number };

export function readJobStats(id: number | string): LocalJobStats {
  try {
    const value = JSON.parse(localStorage.getItem(key(id)) || "null");
    return { views: Number.isSafeInteger(value?.views) && value.views >= 0 ? value.views : 0 };
  } catch { return { views: 0 }; }
}

export function writeJobStats(id: number | string, stats: LocalJobStats): void {
  try { localStorage.setItem(key(id), JSON.stringify(stats)); } catch { /* Storage may be unavailable. */ }
}

export function recordJobView(id: number | string): void {
  const current = readJobStats(id);
  writeJobStats(id, { ...current, views: current.views + 1 });
}
