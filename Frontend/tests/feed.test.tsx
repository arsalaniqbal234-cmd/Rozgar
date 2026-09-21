import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "../app/page";
import CompanyLogo from "../app/components/company-logo";
import SavedSearchesPage from "../app/saved-searches/page";
import { api, clearJobCache, salaryLabel, safeLink } from "../lib/api";
import { scrubEvent } from "../lib/sentry";

const auth = vi.hoisted(() => ({ user: { id: "user_a" } as { id: string } | null, getToken: vi.fn(async () => "signed-token") }));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: auth.user }),
  useAuth: () => ({ isSignedIn: Boolean(auth.user), userId: auth.user?.id || null, getToken: auth.getToken }),
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    ((when === "signed-in") === Boolean(auth.user)) ? children : null,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
const job = { id: 21, source_id: "remoteok_21", title: "Python engineer", company: "Example",
  salary: 100000, salary_currency: "USD", salary_period: "annual", url: "https://example.com/job", is_remote: true };
const fetchMock = vi.fn();
beforeEach(() => {
  clearJobCache();
  auth.user = { id: "user_a" };
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json([]));
});

describe("job feed", () => {
  it("shows results, uses job URLs and displays salary units", async () => {
    fetchMock.mockResolvedValue(Response.json([job]));
    render(<Home />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading jobs");
    expect(await screen.findByRole("link", { name: "Python engineer" })).toHaveAttribute("href", "/jobs/21");
    expect(screen.getByText("USD 100,000 / annual")).toBeInTheDocument();
  });
  it("shows known company logos and keeps initials for unknown companies", async () => {
    fetchMock.mockResolvedValue(Response.json([
      { ...job, id: 22, company: "Pinterest", title: "Pinterest role" },
      { ...job, id: 23, company: "Wiz", title: "Wiz role" },
      { ...job, id: 24, company: "Grafana Labs", title: "Grafana role" },
      { ...job, id: 25, company: "Coinbase", title: "Coinbase role" },
      { ...job, id: 26, company: "Example", title: "Fallback role" },
    ]));
    const { container } = render(<Home />);
    await screen.findByRole("link", { name: "Pinterest role" });
    for (const company of ["pinterest", "wiz", "grafanalabs", "coinbase"])
      expect(container.querySelector(`[data-company-logo="${company}"]`)).toBeInTheDocument();
    expect(screen.getByText("EX")).toBeInTheDocument();
  });
  it("treats HTTP failures as errors and recovers on retry", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ detail: "broken" }, { status: 500 }))
      .mockResolvedValueOnce(Response.json([job]));
    render(<Home />);
    expect(await screen.findByRole("alert")).toHaveTextContent("temporarily unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "Python engineer" })).toBeInTheDocument();
  });
  it("shows the empty state", async () => {
    render(<Home />);
    expect(await screen.findByText("No matching jobs yet")).toBeInTheDocument();
  });
  it("shows at most 20 jobs per page and navigates with a cursor", async () => {
    const page = Array.from({ length: 21 }, (_, index) => ({ ...job, id: 100 - index, title: "Role " + index }));
    fetchMock.mockResolvedValueOnce(Response.json(page)).mockResolvedValueOnce(Response.json([job]));
    render(<Home />);
    expect(await screen.findByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(20);
    expect(screen.queryByRole("link", { name: "Role 20" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("link", { name: "Python engineer" })).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toContain("before_id=81");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(await screen.findByRole("link", { name: "Role 0" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(20);
  });
  it("suggests matching job titles and locations while typing", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/suggestions?")) return Response.json(url.includes("field=title") ? ["Python engineer"] : ["Lahore"]);
      return Response.json([job]);
    });
    render(<Home />);
    const title = screen.getByRole("combobox", { name: "Search jobs" });
    fireEvent.focus(title);
    fireEvent.change(title, { target: { value: "P" } });
    await screen.findByRole("option", { name: "Python engineer" });
    fireEvent.keyDown(title, { key: "ArrowDown" });
    fireEvent.keyDown(title, { key: "Enter" });
    expect(title).toHaveValue("Python engineer");
    const location = screen.getByRole("combobox", { name: "Location" });
    fireEvent.focus(location);
    fireEvent.change(location, { target: { value: "L" } });
    fireEvent.click(await screen.findByRole("option", { name: "Lahore" }));
    expect(location).toHaveValue("Lahore");
  });
  it("sends a signed saved-search request without client-controlled identity", async () => {
    fetchMock.mockImplementation(async (_url: string, options?: RequestInit) => Response.json(options?.method === "POST" ? { id: 1 } : []));
    render(<Home />);
    fireEvent.change(screen.getByRole("combobox", { name: "Search jobs" }), { target: { value: "Python" } });
    fireEvent.click(screen.getByRole("button", { name: "Save search" }));
    await screen.findByText(/Search saved/);
    const [url, options] = fetchMock.mock.calls.find(call => call[1]?.method === "POST")!;
    expect(url).toBe("/api/saved-searches");
    expect(options.headers.Authorization).toBe("Bearer signed-token");
    const payload = JSON.parse(options.body);
    expect(payload.keywords).toBe("Python");
    expect(payload).not.toHaveProperty("user_id");
    expect(payload).not.toHaveProperty("email");
  });
  it("does not save searches while signed out", async () => {
    auth.user = null;
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Save search" }));
    expect(await screen.findByText("Please sign in to save searches.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(call => call[1]?.method === "POST")).toBe(false);
  });
  it("ignores a stale request after search changes", async () => {
    let resolveOld!: (value: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { resolveOld = resolve; }))
      .mockResolvedValue(Response.json([{ ...job, title: "React engineer" }]));
    render(<Home />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole("combobox", { name: "Search jobs" }), { target: { value: "React" } });
    expect(await screen.findByRole("link", { name: "React engineer" })).toBeInTheDocument();
    resolveOld(Response.json([job]));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.queryByRole("link", { name: "Python engineer" })).not.toBeInTheDocument();
  });
});

it("has local logo assets for company-board brands missing from the icon set", () => {
  const companies = ["Twilio", "Fivetran", "LaunchDarkly", "Mercury", "Tenable", "Wiz",
    "Abnormal Security", "Expel", "Huntress", "Axonius", "Censys", "Bishop Fox", "Praetorian",
    "Remote", "Chime", "Confluent", "Plaid", "Ramp", "OpenAI", "Material Security", "Semgrep"];
  const { container } = render(<>{companies.map(company => <CompanyLogo key={company} company={company}
    variant={0} sourceId="greenhouse_example" jobUrl="https://example.com/job" />)}</>);
  expect(container.querySelectorAll("[data-company-logo]")).toHaveLength(companies.length);
  expect(container.querySelectorAll("img")).toHaveLength(companies.length);
});

it("requests the employer logo for Arbeitnow jobs and preserves the initials fallback", () => {
  const { container } = render(<CompanyLogo company="SEOMATIK GmbH" variant={2}
    sourceId="arbeitnow_job-1" jobUrl="https://www.arbeitnow.com/jobs/companies/seomatik/example" />);
  const image = container.querySelector("[data-company-logo=arbeitnow] img") as HTMLImageElement;
  expect(image.src).toContain("/api/company-logo?");
  fireEvent.error(image);
  expect(screen.getByText("SE")).toBeInTheDocument();
});

it("deletes an owned saved search through the authenticated endpoint", async () => {
  fetchMock.mockImplementation(async (_url: string, options?: RequestInit) =>
    options?.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json([{ id: 1, keywords: "python" }]));
  render(<SavedSearchesPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Delete search python" }));
  expect(await screen.findByText(/No saved searches yet/)).toBeInTheDocument();
  const call = fetchMock.mock.calls.find(call => call[1]?.method === "DELETE")!;
  expect(call[0]).toMatch(/\/saved-searches\/1$/);
  expect(call[1].headers.Authorization).toBe("Bearer signed-token");
});

it("rejects unsafe application links and respects currency metadata", () => {
  expect(safeLink("javascript:alert(1)")).toBeUndefined();
  expect(safeLink("https://example.com")).toBe("https://example.com");
  expect(salaryLabel({ ...job, salary_currency: "PKR", salary_period: "monthly" })).toBe("PKR 100,000 / monthly");
});

it("ends saved-search loading on failure and recovers through retry", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 503 }))
    .mockResolvedValueOnce(Response.json([]));
  render(<SavedSearchesPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("temporarily unavailable");
  expect(screen.queryByText("Loading saved searches…")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText(/No saved searches yet/)).toBeInTheDocument();
});

it("does not report cancellations as service failures", async () => {
  fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
  await expect(api("/jobs")).rejects.toMatchObject({ name: "AbortError" });
});

it("scrubs user and request data from Sentry events", () => {
  const result = scrubEvent({ type: undefined, user: { email: "private@example.com" }, request: {
    url: "https://example.com/?secret=private", headers: { Authorization: "secret" }, data: "private",
  } });
  expect(result.user).toBeUndefined();
  expect(result.request?.url).toBe("https://example.com/");
  expect(result.request?.headers).toBeUndefined();
});
