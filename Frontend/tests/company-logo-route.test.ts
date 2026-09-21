import { describe, expect, it } from "vitest";
import { arbeitnowLogoFromHtml } from "../app/api/company-logo/route";

describe("Arbeitnow company logo extraction", () => {
  it("extracts the employer logo from a public job page", () => {
    const html = '<img class="company" src="https://www.arbeitnow.com/storage/company_logo/company.png" title="Example">';
    expect(arbeitnowLogoFromHtml(html)).toBe("https://www.arbeitnow.com/storage/company_logo/company.png");
  });

  it("does not mistake the Arbeitnow site logo for an employer logo", () => {
    expect(arbeitnowLogoFromHtml('<img src="https://www.arbeitnow.com/images/logo.png">')).toBeUndefined();
  });
});
