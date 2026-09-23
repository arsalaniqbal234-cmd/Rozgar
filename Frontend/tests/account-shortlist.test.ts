import { beforeEach, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { createAccountShortlist } from "../lib/account-shortlist";
import type { ShortlistedJob } from "../lib/shortlist";

vi.mock("../lib/api", () => ({ api: vi.fn() }));
const job: ShortlistedJob = { id: 1, source_id: "source_1", title: "Engineer", company: "Example", url: "https://example.com/job", salary: null, is_remote: true };
const other = { ...job, id: 2, source_id: "source_2" };
const token = async () => "token";
beforeEach(() => { localStorage.clear(); vi.resetAllMocks(); });

it("merges guest and existing account jobs without replacing either, and acknowledges only after success", async () => {
  const imported = vi.fn();
  vi.mocked(api).mockResolvedValueOnce([other]).mockResolvedValueOnce([other, job]);
  const store = createAccountShortlist("a", token, imported);
  store.start();
  store.importJobs([job]);
  expect(imported).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(store.getSnapshot().jobs).toHaveLength(2));
  await vi.waitFor(() => expect(imported).toHaveBeenCalledWith([job]));
  const request = JSON.parse(vi.mocked(api).mock.calls[1][1]!.body as string);
  expect(request.additions).toEqual([job]);
  expect(request.removals).toEqual([]);
  store.stop();
});

it("persists an offline guest import and retries after a reload without losing account jobs", async () => {
  const imported = vi.fn();
  vi.mocked(api).mockRejectedValue(new Error("Offline"));
  const first = createAccountShortlist("a", token, imported);
  first.start(); first.importJobs([job]);
  await vi.waitFor(() => expect(first.getSnapshot().error).toContain("sync failed"));
  expect(first.getSnapshot().jobs).toEqual([job]);
  expect(imported).not.toHaveBeenCalled();
  first.stop();
  vi.mocked(api).mockResolvedValue([other, job]);
  const second = createAccountShortlist("a", token, imported);
  second.start();
  await vi.waitFor(() => expect(second.getSnapshot().jobs).toHaveLength(2));
  expect(imported).toHaveBeenCalledWith([job]);
  expect(JSON.parse(localStorage.getItem("rozgar.shortlist.account.a")!).pending).toEqual([]);
  second.stop();
});

it("keeps account caches isolated and deduplicates by source ID when job IDs change", async () => {
  vi.mocked(api).mockResolvedValue([job]);
  const first = createAccountShortlist("a", token, vi.fn());
  first.start();
  await vi.waitFor(() => expect(first.getSnapshot().jobs).toHaveLength(1));
  first.toggleJob({ ...job, id: 99 });
  expect(first.getSnapshot().jobs).toEqual([]);
  first.stop();
  const second = createAccountShortlist("b", token, vi.fn());
  second.start();
  expect(second.getSnapshot().jobs).toEqual([]);
  second.stop();
});

it("does not resurrect a job removed while its import is in flight", async () => {
  let finish!: (jobs: ShortlistedJob[]) => void;
  vi.mocked(api).mockResolvedValueOnce([]).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce([]);
  const store = createAccountShortlist("a", token, vi.fn());
  store.start();
  await vi.waitFor(() => expect(api).toHaveBeenCalledTimes(1));
  store.importJobs([job]);
  await vi.waitFor(() => expect(api).toHaveBeenCalledTimes(2));
  store.removeJob(job.id);
  expect(store.getSnapshot().jobs).toEqual([]);
  finish([job]);
  await vi.waitFor(() => expect(api).toHaveBeenCalledTimes(3));
  expect(store.getSnapshot().jobs).toEqual([]);
  const body = JSON.parse(vi.mocked(api).mock.calls[2][1]!.body as string);
  expect(body.removals).toEqual([{ id: 1, source_id: "source_1" }]);
  store.stop();
});
