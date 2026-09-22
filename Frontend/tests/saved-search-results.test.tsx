import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SavedSearchesPage from "../app/saved-searches/page";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isSignedIn: true, userId: "user_test", getToken: async () => "token" }),
  Show: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(() => vi.unstubAllGlobals());

it("opens live results with every saved filter while keeping Delete available", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json([{
    id: 7, keywords: "Data Engineer", location: "Berlin", min_salary: 85000,
    filters: { remote_only: true, salary_only: true, salary_currency: "EUR", salary_period: "monthly" },
  }])));
  render(<SavedSearchesPage />);
  const link = await screen.findByRole("link", { name: "View current results for Data Engineer" });
  const parsed = new URL(link.getAttribute("href")!, "http://localhost");
  expect(parsed.pathname).toBe("/");
  expect(parsed.searchParams.get("keyword")).toBe("Data Engineer");
  expect(parsed.searchParams.get("location")).toBe("Berlin");
  expect(parsed.searchParams.get("min_salary")).toBe("85000");
  expect(parsed.searchParams.get("remote_only")).toBe("true");
  expect(parsed.searchParams.get("salary_only")).toBe("true");
  expect(parsed.searchParams.get("salary_currency")).toBe("EUR");
  expect(parsed.searchParams.get("salary_period")).toBe("monthly");
  expect(screen.getByRole("button", { name: "Delete search Data Engineer" })).toBeInTheDocument();
});
