import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import CompanyLogo, { hasCompanyLogo } from "../app/components/company-logo";

afterEach(cleanup);

it.each([
  ["Pakistan Single Window", "pakistan-single-window.png"],
  ["Careem", "careem.png"], ["Devsinc", "devsinc.svg"],
  ["Educative", "educative.png"], ["Joblogic", "joblogic.png"],
])("renders the official local logo for %s instead of initials", (company, asset) => {
  expect(hasCompanyLogo(company, "workable_example_1")).toBe(true);
  const { container } = render(<CompanyLogo company={company} variant={0}
    sourceId="workable_example_1" jobUrl="https://example.com/job" />);
  const image = container.querySelector("img");
  expect(image).not.toBeNull();
  expect(decodeURIComponent(image!.getAttribute("src")!)).toContain(asset);
  expect(container.querySelector(".company-mark")).toHaveTextContent("");
});
