import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureException } from "@sentry/nextjs";
import { api, clearJobCache } from "../lib/api";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
const fetchMock = vi.fn();
const cached = { cache: "force-cache" } as const;

beforeEach(() => {
  clearJobCache();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json([{ id: 1 }]));
});
afterEach(() => vi.useRealTimers());

describe("public job cache", () => {
  it("reuses a recent listing but keeps different filters separate", async () => {
    const path = "/jobs?summary=true&keyword=python";
    expect(await api(path, cached)).toEqual([{ id: 1 }]);
    expect(await api(path, cached)).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await api("/jobs?summary=true&keyword=design", cached);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("expires after 30 seconds and allows an explicit reload", async () => {
    vi.useFakeTimers();
    await api("/jobs", cached);
    await vi.advanceTimersByTimeAsync(30_001);
    await api("/jobs", cached);
    await api("/jobs", { cache: "reload" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("bounds the cache and evicts the least recently used listing", async () => {
    for (let index = 0; index < 40; index++) await api(`/jobs?keyword=${index}`, cached);
    await api("/jobs?keyword=0", cached);
    await api("/jobs?keyword=40", cached);
    await api("/jobs?keyword=0", cached);
    expect(fetchMock).toHaveBeenCalledTimes(41);
    await api("/jobs?keyword=1", cached);
    expect(fetchMock).toHaveBeenCalledTimes(42);
  });

  it("never caches account requests, health checks, authenticated requests or mutations", async () => {
    const requests: [string, RequestInit][] = [
      ["/saved-searches/", cached], ["/health", cached],
      ["/jobs", { ...cached, headers: { Authorization: "Bearer test" } }],
      ["/jobs", { ...cached, credentials: "include" }],
      ["/jobs", { ...cached, method: "POST" }],
    ];
    for (const [path, options] of requests) {
      await api(path, options);
      await api(path, options);
    }
    expect(fetchMock).toHaveBeenCalledTimes(requests.length * 2);
  });

  it("does not cache errors or fulfill a cancelled request from the cache", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({}, { status: 500 }));
    await expect(api("/jobs", cached)).rejects.toMatchObject({ status: 500 });
    await api("/jobs", cached);
    const controller = new AbortController();
    controller.abort();
    await expect(api("/jobs", { ...cached, signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("request lifetime", () => {
  function slowBody() {
    fetchMock.mockImplementation(async (_url: string, options: RequestInit) => ({
      ok: true, status: 200,
      json: () => new Promise((_resolve, reject) => {
        options.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      }),
    }));
  }

  it("times out a stalled body even after response headers arrive", async () => {
    vi.useFakeTimers();
    slowBody();
    const request = expect(api("/jobs")).rejects.toThrow("taking too long");
    await vi.advanceTimersByTimeAsync(10_001);
    await request;
    expect(captureException).not.toHaveBeenCalled();
  });

  it("cancels body downloads without reporting a server failure", async () => {
    slowBody();
    const controller = new AbortController();
    const request = expect(api("/jobs", { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    await Promise.resolve();
    controller.abort();
    await request;
    expect(captureException).not.toHaveBeenCalled();
  });
});
