import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SearchSuggestions from "../app/components/search-suggestions";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

function LocationSearch() {
  const [location, setLocation] = useState("");
  return <SearchSuggestions field="location" label="Location" placeholder="City, country, or region"
    value={location} onChange={setLocation} />;
}

it("lets a user select Pakistan from the country suggestions with the keyboard", async () => {
  vi.mocked(api).mockResolvedValue(["Pakistan", "Islamabad, Pakistan", "Lahore, Pakistan"]);
  render(<LocationSearch />);
  const input = screen.getByRole("combobox", { name: "Location" });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "pak" } });
  await screen.findByRole("option", { name: "Pakistan" });
  expect(api).toHaveBeenCalledWith("/jobs/suggestions?field=location&q=pak", expect.any(Object));
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("Pakistan");
  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
});
