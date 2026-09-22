import { describe, expect, it } from "vitest";
import { formatJobDescription } from "../lib/job-description";

describe("formatJobDescription", () => {
  it("renders encoded employer HTML as structured content", () => {
    const source = '&lt;div class=&quot;content-intro&quot;&gt;&lt;p&gt;Welcome &amp; grow&lt;/p&gt;&lt;/div&gt;&lt;p&gt;&lt;strong&gt;Requirements&lt;/strong&gt;&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Build products&lt;/li&gt;&lt;/ul&gt;';
    const html = formatJobDescription(source);
    expect(html).toContain("<p>Welcome &amp; grow</p>");
    expect(html).toContain("<strong>Requirements</strong>");
    expect(html).toContain("<li>Build products</li>");
    expect(html).not.toContain("&lt;div");
  });

  it("handles twice-encoded markup and keeps code-like text literal", () => {
    expect(formatJobDescription("&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;")).toContain("<p>Hello</p>");
    expect(formatJobDescription("Use <script>alert(1)</script> in examples")).toContain("&lt;script&gt;");
  });

  it("decodes mixed escaped description and raw provider footer", () => {
    const source = '&lt;p&gt;&lt;strong&gt;Qui sommes-nous?&lt;/strong&gt;&lt;/p&gt;\n&lt;p&gt;Artefact aide les équipes.&amp;nbsp;&lt;/p&gt;<p>Find <a href="https://www.arbeitnow.fr">Jobs in France</a> on Arbeitnow</a>';
    const html = formatJobDescription(source);
    expect(html).toContain("<p><strong>Qui sommes-nous?</strong></p>");
    expect(html).toContain("<p>Artefact aide les équipes.&nbsp;</p>");
    expect(html).toContain("Find <a href=");
    expect(html).not.toContain("&lt;p");
    expect(html).not.toContain("&amp;nbsp;");
  });

  it("formats plain text and strips unsafe HTML", () => {
    expect(formatJobDescription("First line\nSecond line\n\nNext section")).toBe("<p>First line<br>Second line</p><p>Next section</p>");
    const html = formatJobDescription('<p>Role</p><script>alert(1)</script><a href="javascript:alert(1)">Apply</a>');
    expect(html).toContain("<p>Role</p>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });
});
