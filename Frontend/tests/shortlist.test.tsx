import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookmarkButton from "../app/components/bookmark-button";
import ShortlistPage from "../app/shortlist/page";
import { SHORTLIST_KEY, SHORTLIST_LIMIT } from "../lib/shortlist";
import type { Job } from "../lib/api";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
const job: Job = { id: 21, source_id: "remoteok_21", title: "Python engineer", company: "Example",
  salary: 100000, salary_currency: "USD", salary_period: "annual", url: "https://example.com/job",
  is_remote: true, description: "A large description that should never be persisted." };

function storeJobs(jobs: unknown[]) {
  window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify({ version: 1, jobs }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
});

describe("browser shortlist", () => {
  it("saves minimal metadata, updates all buttons, and removes a saved job", async () => {
    render(<><BookmarkButton job={job} /><BookmarkButton job={job} /></>);
    const saveButtons = screen.getAllByRole("button", { name: "Save job Python engineer" });
    await waitFor(() => expect(saveButtons[0]).toBeEnabled());
    fireEvent.click(saveButtons[0]);
    expect(screen.getAllByRole("button", { name: "Remove saved job Python engineer" })).toHaveLength(2);
    const stored = JSON.parse(window.localStorage.getItem(SHORTLIST_KEY)!);
    expect(stored.jobs[0]).toMatchObject({ id: 21, title: "Python engineer" });
    expect(stored.jobs[0]).not.toHaveProperty("description");
    fireEvent.click(screen.getAllByRole("button", { name: "Remove saved job Python engineer" })[1]);
    expect(JSON.parse(window.localStorage.getItem(SHORTLIST_KEY)!).jobs).toEqual([]);
    expect(screen.getAllByRole("button", { name: "Save job Python engineer" })).toHaveLength(2);
  });

  it("restores a persisted shortlist and shows its browser-local scope", async () => {
    storeJobs([job]);
    const view = render(<ShortlistPage />);
    expect(await screen.findByRole("link", { name: "Python engineer" })).toHaveAttribute("href", "/jobs/21");
    expect(screen.getByText("USD 100,000 / annual")).toBeInTheDocument();
    expect(screen.getByText(/Saved on this browser/)).toBeInTheDocument();
    view.unmount();
    render(<ShortlistPage />);
    expect(await screen.findByRole("link", { name: "Python engineer" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove saved job Python engineer" }));
    expect(await screen.findByRole("link", { name: "Explore jobs" })).toBeInTheDocument();
  });

  it("updates mounted views when another tab changes or clears storage", async () => {
    render(<ShortlistPage />);
    expect(await screen.findByRole("link", { name: "Explore jobs" })).toBeInTheDocument();
    act(() => {
      storeJobs([job]);
      window.dispatchEvent(new StorageEvent("storage", { key: SHORTLIST_KEY }));
    });
    expect(screen.getByRole("link", { name: "Python engineer" })).toBeInTheDocument();
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(screen.getByRole("link", { name: "Explore jobs" })).toBeInTheDocument();
  });

  it.each([
    "invalid json",
    JSON.stringify({ version: 2, jobs: [job] }),
    JSON.stringify({ version: 1, jobs: [{ ...job, url: "javascript:alert(1)" }] }),
    JSON.stringify({ version: 1, jobs: [{ ...job, title: "x".repeat(301) }] }),
    JSON.stringify({ version: 1, jobs: [job, job] }),
  ])("handles malformed or unsafe persisted data without rendering it (%#)", async raw => {
    window.localStorage.setItem(SHORTLIST_KEY, raw);
    render(<ShortlistPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Your saved jobs could not be read");
    expect(screen.queryByRole("link", { name: "Python engineer" })).not.toBeInTheDocument();
  });

  it("keeps existing jobs intact and reports quota failures without claiming a save", async () => {
    storeJobs([{ ...job, id: 22, title: "Existing role" }]);
    render(<BookmarkButton job={job} />);
    const button = screen.getByRole("button", { name: "Save job Python engineer" });
    await waitFor(() => expect(button).toBeEnabled());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Your change was not saved");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(JSON.parse(window.localStorage.getItem(SHORTLIST_KEY)!).jobs).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(SHORTLIST_KEY)!).jobs[0].title).toBe("Existing role");
  });

  it("handles blocked storage and recovers when access is restored", async () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    render(<ShortlistPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Browser storage is unavailable");
    read.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("caps the shortlist without silently deleting earlier saved jobs", async () => {
    storeJobs(Array.from({ length: SHORTLIST_LIMIT }, (_, index) => ({ ...job, id: index + 100 })));
    render(<BookmarkButton job={job} />);
    const button = screen.getByRole("button", { name: "Save job Python engineer" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent(`up to ${SHORTLIST_LIMIT} jobs`);
    expect(JSON.parse(window.localStorage.getItem(SHORTLIST_KEY)!).jobs).toHaveLength(SHORTLIST_LIMIT);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
