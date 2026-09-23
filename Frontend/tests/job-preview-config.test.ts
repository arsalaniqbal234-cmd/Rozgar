import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { CATEGORY_IMAGE_SETS, CATEGORY_MOTION_PREVIEWS, imagesForCategory, motionForCategory, resolveJobCategory } from "../lib/job-preview-config";
import { videoForCategory, videoForJob } from "../lib/job-video-config";
import { createHash } from "node:crypto";

describe("job preview category selection", () => {
  it.each([
    ["Pricing Strategist, GTM", "marketing"], ["Marketing Analytics Manager", "marketing"],
    ["Senior Frontend Developer", "engineering"], ["Technical Recruiter", "people"],
    ["Product Marketing Lead", "marketing"], ["Product Manager", "product"],
    ["Data Engineer", "data"], ["Clinical Nurse", "healthcare"],
    ["Account Executive", "sales"], ["Supply Chain Manager", "logistics"],
    ["Financial Analyst", "finance"], ["Customer Success Manager", "support"],
    ["Legal Counsel", "legal"], ["Security Engineer", "security"],
    ["Project Manager", "operations"], ["Teacher", "education"], ["UX Designer", "design"],
    ["Software Engineer, Marketing", "engineering"], ["Build Engineer", "engineering"],
    ["People Systems Analyst", "people"],
  ])("resolves title-only backend record %s to %s", (title, expected) => {
    expect(resolveJobCategory({ title })).toBe(expected);
    expect(videoForJob({ title }).mp4).toContain(`/${expected}-1.mp4`);
    expect(resolveJobCategory({ category: "General", tags: ["Remote", "Full-time"], title })).toBe(expected);
  });

  it("keeps all 32 video stems distinct and checks actual bytes, not just filenames", () => {
    const paths = Object.keys(CATEGORY_IMAGE_SETS).flatMap(category => ([1, 2] as const).map(variant => videoForCategory(category, variant)));
    expect(new Set(paths.map(p => p.mp4)).size).toBe(32);
    for (const format of ["mp4", "webm"] as const) {
      const hashes = paths.map(p => createHash("sha256").update(readFileSync(join(process.cwd(), "public", p[format].split("?")[0]))).digest("hex"));
      expect(new Set(hashes).size).toBe(32);
    }
  });
  it("has a lightweight six-second motion asset for every static category", () => {
    expect(Object.keys(CATEGORY_MOTION_PREVIEWS).sort()).toEqual(Object.keys(CATEGORY_IMAGE_SETS).sort());
    for (const [category, path] of Object.entries(CATEGORY_MOTION_PREVIEWS)) {
      expect(motionForCategory(category)).toBe(path);
      const source = readFileSync(join(process.cwd(), "public", path.slice(1)));
      const svg = source.toString("utf8");
      expect(svg).toContain("6s");
      expect(svg).toContain("prefers-reduced-motion:reduce");
      expect(source.length).toBeLessThan(12_000);
      expect(gzipSync(source).length).toBeLessThan(3_500);
    }
  });

  it("points every live category frame at a distinct local UI mockup", () => {
    const paths = Object.values(CATEGORY_IMAGE_SETS).flat();
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) {
      const svg = readFileSync(join(process.cwd(), "public", path.slice(1)), "utf8");
      expect(svg).toContain("windowShadow");
      expect(svg).toContain("--accent:");
      expect(svg).toContain('cx="84" cy="66"');
    }
  });

  it("uses distinct field-specific artwork for recognized categories", () => {
    for (const category of ["engineering", "design", "sales", "healthcare"] as const) {
      expect(imagesForCategory(category)).toEqual(CATEGORY_IMAGE_SETS[category]);
      expect(imagesForCategory(category)).toHaveLength(2);
    }
    expect(new Set(["engineering", "design", "sales", "healthcare"].map(category => imagesForCategory(category)[0])).size).toBe(4);
  });

  it("prefers explicit category and tags, infers old API records from title, and falls back only for unknown roles", () => {
    expect(resolveJobCategory({ category: "Healthcare", title: "Software Engineer" })).toBe("healthcare");
    expect(resolveJobCategory({ tags: ["Sales"], title: "Analyst" })).toBe("sales");
    expect(resolveJobCategory({ title: "Senior Frontend Developer" })).toBe("engineering");
    expect(resolveJobCategory({ title: "Mystery Role" })).toBe("general");
  });
});
