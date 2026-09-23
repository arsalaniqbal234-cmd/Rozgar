import { api, type Job } from "./api";
import { sameJob, sanitizeJob, SHORTLIST_LIMIT, type ShortlistedJob } from "./shortlist";

type Change = { key: string; job: ShortlistedJob; remove: boolean };
type State = { jobs: ShortlistedJob[]; ready: boolean; error: string | null };
const empty: State = { jobs: [], ready: false, error: null };
const syncError = "Account sync failed. Your saved jobs are safe on this browser. Try again when connected.";

function apply(jobs: ShortlistedJob[], changes: Change[]) {
  return changes.reduce((list, change) => change.remove
    ? list.filter(job => !sameJob(job, change.job))
    : list.some(job => sameJob(job, change.job)) ? list : [change.job, ...list], jobs);
}

/** Durable outbox: retries are additive and never replace another device's saves. */
export function createAccountShortlist(userId: string, getToken: () => Promise<string | null>, imported: (jobs: ShortlistedJob[]) => void) {
  const storageKey = `rozgar.shortlist.account.${userId}`;
  let state = empty;
  let pending: Change[] = [];
  let running = false;
  let active = false;
  let controller: AbortController | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: State) => { state = next; listeners.forEach(listener => listener()); };
  function persist(jobs: ShortlistedJob[], changes: Change[]): boolean {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, jobs, pending: changes })); }
    catch { publish({ ...state, error: "Browser storage is unavailable or full. Your change was not saved." }); return false; }
    pending = changes;
    publish({ jobs, ready: true, error: null });
    return true;
  }
  function read() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { pending = []; publish({ ...empty, ready: true }); return; }
      const parsed = JSON.parse(raw);
      if (raw.length > 1_000_000 || parsed.version !== 1 || !Array.isArray(parsed.jobs) || !Array.isArray(parsed.pending)) throw new Error();
      const jobs = parsed.jobs.map(sanitizeJob);
      const changes = parsed.pending as Change[];
      if (jobs.some((job: ShortlistedJob | null) => !job) || changes.some(change =>
        typeof change.key !== "string" || typeof change.remove !== "boolean" || !sanitizeJob(change.job))) throw new Error();
      pending = changes.map(change => ({ ...change, job: sanitizeJob(change.job)! }));
      publish({ jobs, ready: true, error: null });
    } catch { publish({ ...state, ready: false, error: "Your account shortlist could not be read. Allow browser storage and try again." }); }
  }
  async function sync() {
    if (!active || running || !state.ready) return;
    running = true;
    controller = new AbortController();
    const signal = controller.signal;
    const batch = [...pending];
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in again to sync your shortlist.");
      const jobs = await api<ShortlistedJob[]>("/shortlist/sync", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal,
        body: JSON.stringify({ additions: batch.filter(item => !item.remove).map(item => item.job),
          removals: batch.filter(item => item.remove).map(item => ({ id: item.job.id, source_id: item.job.source_id })) }),
      });
      if (!active || signal.aborted) return;
      // Re-read other-tab edits before acknowledging only the submitted operations.
      read();
      if (!state.ready) return;
      const remaining = pending.filter(item => !batch.some(sent => sent.key === item.key));
      if (persist(apply(jobs, remaining), remaining)) imported(batch.map(item => item.job));
    } catch {
      if (active && !signal.aborted) publish({ ...state, error: syncError });
    } finally {
      running = false;
      if (active && (signal.aborted || (!state.error && pending.length))) void sync();
    }
  }
  function enqueue(jobs: ShortlistedJob[], remove = false) {
    read();
    if (!state.ready) return state.error;
    const changes = jobs.map(job => ({ job, remove, key: crypto.randomUUID() }));
    const next = [...pending.filter(item => !jobs.some(job => sameJob(item.job, job))), ...changes];
    if (!persist(apply(state.jobs, changes), next)) return state.error;
    void sync();
    return null;
  }
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey) { read(); if (pending.length) void sync(); } };
  const retry = () => { read(); void sync(); };
  return {
    getSnapshot: () => state, getServerSnapshot: () => empty,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start: () => { active = true; read(); window.addEventListener("storage", onStorage); window.addEventListener("online", retry); void sync(); },
    stop: () => { active = false; controller?.abort(); window.removeEventListener("storage", onStorage); window.removeEventListener("online", retry); },
    importJobs: (jobs: ShortlistedJob[]) => {
      // A queued removal wins over a guest import, including after a failed request.
      const additions = jobs.filter(job => !pending.some(item => sameJob(item.job, job)));
      if (additions.length) enqueue(additions);
    },
    toggleJob: (value: Job) => {
      read();
      const job = sanitizeJob(value);
      if (!job) return "This job could not be saved. Please refresh and try again.";
      const existing = state.jobs.find(item => sameJob(item, job));
      if (!existing && state.jobs.length >= SHORTLIST_LIMIT) return `Your shortlist holds up to ${SHORTLIST_LIMIT} jobs.`;
      return enqueue([existing ?? job], Boolean(existing));
    },
    removeJob: (id: number) => { const job = state.jobs.find(item => item.id === id); return job ? enqueue([job], true) : null; },
    retry,
  };
}
