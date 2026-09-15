import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || (!process.env.VERCEL ? "http://localhost:8000" : "")).replace(/\/$/, "");
const isVercelProduction = process.env.VERCEL_ENV === "production";
if (isVercelProduction && !apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required for a Vercel production deployment.");
}
if (apiUrl) {
  let parsed: URL;
  try { parsed = new URL(apiUrl); }
  catch { throw new Error("NEXT_PUBLIC_API_URL must be a plain absolute URL, such as https://jobs-codeaza1.vercel.app. Do not paste a Markdown link."); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash || parsed.search) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) base URL without credentials, query parameters or fragments.");
  }
  if (isVercelProduction && (parsed.protocol !== "https:" || /^(localhost|.*\.localhost|127\..*|\[::1\]|0\.0\.0\.0)$/.test(parsed.hostname))) {
    throw new Error("NEXT_PUBLIC_API_URL must use a public HTTPS backend in production.");
  }
}
const config: NextConfig = {
  async rewrites() { return [
    { source: "/api/jobs", destination: `${apiUrl}/jobs` },
    { source: "/api/jobs/:jobId", destination: `${apiUrl}/jobs/:jobId` },
    { source: "/api/saved-searches/:path*", destination: `${apiUrl}/saved-searches/:path*` },
    { source: "/api/health", destination: `${apiUrl}/health` },
  ]; },
  async headers() { return [{ source: "/(.*)", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ] }]; },
};
export default withSentryConfig(config, {
  silent: true, telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  org: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT,
});
