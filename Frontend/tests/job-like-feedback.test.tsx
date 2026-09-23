import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { useJobLikes, type JobLikeStats } from "../lib/use-job-likes";
import { formatRelativeTime } from "../lib/format-relative-time";

vi.mock("../lib/api", () => ({ api: vi.fn(), ApiError: class extends Error {} }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

it("updates before token/API resolution, blocks same-tick duplicates, and reconciles the server count", async () => {
  const token = deferred<string>();
  const response = deferred<JobLikeStats>();
  const getToken = vi.fn().mockResolvedValueOnce("token").mockReturnValue(token.promise);
  vi.mocked(api).mockResolvedValueOnce([{ job_id: 1, likes: 4, is_liked: false }]).mockReturnValueOnce(response.promise);
  const { result } = renderHook(() => useJobLikes([1], "user", getToken));
  await waitFor(() => expect(result.current.byId[1]?.likes).toBe(4));
  let request!: Promise<void>;
  act(() => { request = result.current.toggle(1); void result.current.toggle(1); });
  expect(result.current.byId[1]).toMatchObject({ likes: 5, is_liked: true });
  expect(getToken).toHaveBeenCalledTimes(2);
  expect(api).toHaveBeenCalledTimes(1);
  await act(async () => { token.resolve("token"); });
  expect(api).toHaveBeenCalledTimes(2);
  await act(async () => { response.resolve({ job_id: 1, likes: 7, is_liked: true }); await request; });
  expect(result.current.byId[1].likes).toBe(7);
  expect(result.current.pending).toBeNull();
});

it("optimistically unlikes and rolls back both fields on failure, allowing retry", async () => {
  const response = deferred<JobLikeStats>();
  const getToken = vi.fn().mockResolvedValue("token");
  vi.mocked(api).mockResolvedValueOnce([{ job_id: 1, likes: 2, is_liked: true }]).mockReturnValueOnce(response.promise);
  const { result } = renderHook(() => useJobLikes([1], "user", getToken));
  await waitFor(() => expect(result.current.byId[1]?.likes).toBe(2));
  let request!: Promise<unknown>;
  act(() => { request = result.current.toggle(1).catch(error => error); });
  expect(result.current.byId[1]).toMatchObject({ likes: 1, is_liked: false });
  await act(async () => { response.reject(new Error("Offline")); expect(await request).toMatchObject({ message: "Offline" }); });
  expect(result.current.byId[1]).toMatchObject({ likes: 2, is_liked: true });
  expect(result.current.pending).toBeNull();
  expect(vi.mocked(api).mock.calls[1][1]?.method).toBe("DELETE");
});

it("does not let a late initial fetch overwrite an optimistic update", async () => {
  const initial = deferred<JobLikeStats[]>();
  const response = deferred<JobLikeStats>();
  const getToken = vi.fn().mockResolvedValue("token");
  vi.mocked(api).mockReturnValueOnce(initial.promise).mockReturnValueOnce(response.promise);
  const { result } = renderHook(() => useJobLikes([1], "user", getToken));
  await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
  let request!: Promise<void>;
  act(() => { request = result.current.toggle(1); });
  await act(async () => { initial.resolve([{ job_id: 1, likes: 0, is_liked: false }]); });
  expect(result.current.byId[1]).toMatchObject({ likes: 1, is_liked: true });
  await act(async () => { response.resolve({ job_id: 1, likes: 1, is_liked: true }); await request; });
});

it("formats relative times and hides missing or invalid dates", () => {
  const now = Date.parse("2026-09-23T12:00:00Z");
  expect(formatRelativeTime(null, now)).toBeNull();
  expect(formatRelativeTime("invalid", now)).toBeNull();
  expect(formatRelativeTime("2026-09-23T11:59:45Z", now)).toBe("Just now");
  expect(formatRelativeTime("2026-09-23T11:55:00Z", now)).toBe("5m ago");
  expect(formatRelativeTime("2026-09-23T07:00:00", now)).toBe("5h ago");
  expect(formatRelativeTime("2026-09-21T12:00:00Z", now)).toBe("2d ago");
  expect(formatRelativeTime("2026-09-24T12:00:00Z", now)).toBe("Just now");
});
