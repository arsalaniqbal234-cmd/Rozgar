import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import ThemeToggle from "../app/components/theme-toggle";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dataset.theme = "dark";
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
});

it("switches theme and remembers the selection", () => {
  render(<ThemeToggle />);
  const toggle = screen.getByRole("button", { name: "Switch to light mode" });
  expect(document.documentElement.dataset.theme).toBe("dark");

  fireEvent.click(toggle);

  expect(document.documentElement.dataset.theme).toBe("light");
  expect(window.localStorage.getItem("rozgar-theme")).toBe("light");
  expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
});
