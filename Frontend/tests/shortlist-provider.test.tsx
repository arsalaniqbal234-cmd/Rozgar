import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import ShortlistProvider from "../app/components/shortlist-provider";
import BookmarkButton from "../app/components/bookmark-button";
import { api, type Job } from "../lib/api";
import { SHORTLIST_KEY } from "../lib/shortlist";

const auth = vi.hoisted(() => ({ userId: null as string | null, getToken: vi.fn(async () => "token") }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, ...auth }) }));
vi.mock("../lib/api", () => ({ api: vi.fn() }));
const job: Job = { id: 1, source_id: "source_1", title: "Engineer", company: "Example", url: "https://example.com/job", salary: null, is_remote: true };
const other: Job = { ...job, id: 2, source_id: "source_2", title: "Designer" };

beforeEach(() => {
  auth.userId = null; vi.clearAllMocks(); localStorage.clear();
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
});

it("saves as a guest, merges on login, preserves page state and keeps account saves out of the guest view", async () => {
  const tree = <ShortlistProvider><input aria-label="Search" defaultValue="Python" /><BookmarkButton job={job} /><BookmarkButton job={other} /></ShortlistProvider>;
  const view = render(tree);
  fireEvent.change(screen.getByLabelText("Search"), { target: { value: "My filter" } });
  fireEvent.click(await screen.findByRole("button", { name: "Save job Engineer" }));
  expect(screen.getByRole("button", { name: "Remove saved job Engineer" })).toHaveAttribute("aria-pressed", "true");
  expect(api).not.toHaveBeenCalled();
  vi.mocked(api).mockResolvedValueOnce([other]).mockResolvedValueOnce([other, job]);
  auth.userId = "a";
  view.rerender(<ShortlistProvider><input aria-label="Search" defaultValue="Python" /><BookmarkButton job={job} /><BookmarkButton job={other} /></ShortlistProvider>);
  await waitFor(() => expect(screen.getByRole("button", { name: "Remove saved job Designer" })).toBeEnabled());
  await waitFor(() => expect(JSON.parse(localStorage.getItem(SHORTLIST_KEY)!).jobs).toEqual([]));
  expect(screen.getByRole("button", { name: "Remove saved job Engineer" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("Search")).toHaveValue("My filter");
  auth.userId = null;
  view.rerender(<ShortlistProvider><input aria-label="Search" defaultValue="Python" /><BookmarkButton job={job} /><BookmarkButton job={other} /></ShortlistProvider>);
  expect(screen.getByRole("button", { name: "Save job Engineer" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", { name: "Save job Designer" })).toHaveAttribute("aria-pressed", "false");
});
