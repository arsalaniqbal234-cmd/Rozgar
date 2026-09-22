"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, CompanyFollow } from "../../lib/api";

export function useCompanyFollow(jobId: number, company: string) {
  const { isSignedIn, userId, getToken } = useAuth();
  const [follow, setFollow] = useState<CompanyFollow | null>(null);
  const [loadedFor, setLoadedFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutationVersion = useRef(0);
  const key = `${userId ?? ""}:${jobId}`;

  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    const version = mutationVersion.current;
    getToken().then(token => {
      if (!token) throw new Error("Please sign in again.");
      return api<CompanyFollow[]>("/company-follows", {
        headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
      });
    }).then(items => {
      if (!controller.signal.aborted && version === mutationVersion.current) {
        setFollow(items.find(item => item.company_name.trim().toLocaleLowerCase() === company.trim().toLocaleLowerCase()) ?? null);
        setLoadedFor(key);
      }
    }).catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoadedFor(key); } });
    return () => controller.abort();
  }, [isSignedIn, getToken, company, key]);

  const add = useCallback(async () => {
    if (!isSignedIn || busy) return;
    if (loadedFor === key && follow) return;
    mutationVersion.current += 1;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const item = await api<CompanyFollow>("/company-follows", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      setFollow(item);
      setLoadedFor(key);
      setError("");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }, [isSignedIn, busy, loadedFor, key, follow, getToken, jobId]);

  const remove = useCallback(async () => {
    if (!follow || busy) return;
    mutationVersion.current += 1;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      await api(`/company-follows/${follow.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setFollow(null);
      setError("");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }, [follow, busy, getToken]);

  return { follow: loadedFor === key ? follow : null, busy, error, add, remove, isSignedIn };
}

export default function CompanyFollowButton({ company, state }: {
  company: string; state: ReturnType<typeof useCompanyFollow>;
}) {
  if (!state.isSignedIn) return <SignInButton mode="modal"><button type="button" className="tag" aria-label={`Sign in to follow ${company}`}><Bell size={16} aria-hidden />Follow this company</button></SignInButton>;
  return <div>
    <button type="button" className="tag transition-transform duration-150 hover:scale-[1.03] active:scale-95"
      disabled={state.busy} aria-pressed={Boolean(state.follow)}
      aria-label={state.follow ? `Unfollow ${company}` : `Follow ${company}`}
      onClick={() => void (state.follow ? state.remove() : state.add())}>
      {state.follow ? <BellOff size={16} aria-hidden /> : <Bell size={16} aria-hidden />}
      {state.busy ? "Updating…" : state.follow ? "Following company" : "Follow this company"}
    </button>
    {state.error && <p role="alert" className="mt-2 text-sm text-rose-500">{state.error}</p>}
  </div>;
}
