"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createAccountShortlist } from "../../lib/account-shortlist";
import { useBrowserShortlist } from "../../lib/shortlist";
import { ShortlistContext } from "../../lib/shortlist-context";

const subscribeIdle = () => () => {};
const getIdle = () => null;

export default function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId, getToken } = useAuth();
  const guest = useBrowserShortlist();
  const removeGuestJob = guest.removeJob;
  const store = useMemo(() => isLoaded && userId ? createAccountShortlist(userId, getToken, jobs => {
    // Guest data is removed only after the account acknowledges a successful merge.
    jobs.forEach(job => removeGuestJob(job.id));
  }) : null, [isLoaded, userId, getToken, removeGuestJob]);
  const state = useSyncExternalStore(store?.subscribe ?? subscribeIdle, store?.getSnapshot ?? getIdle, store?.getServerSnapshot ?? getIdle);
  useEffect(() => { store?.start(); return () => store?.stop(); }, [store]);
  useEffect(() => { if (guest.ready) store?.importJobs(guest.jobs); }, [store, guest.ready, guest.jobs]);
  return <ShortlistContext.Provider value={store && state ? { ...state, toggleJob: store.toggleJob, removeJob: store.removeJob, retry: store.retry } : null}>{children}</ShortlistContext.Provider>;
}
