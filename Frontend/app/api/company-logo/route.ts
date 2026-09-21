import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["www.arbeitnow.com", "www.arbeitnow.fr", "www.arbeitnow.co.uk"]);
const LOGO_PATTERN = /src=["'](https:\/\/www\.arbeitnow\.com\/storage\/company_logo\/[^"']+)["']/i;

export function arbeitnowLogoFromHtml(html: string): string | undefined {
  return html.match(LOGO_PATTERN)?.[1]?.replaceAll("&amp;", "&");
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  let jobUrl: URL;
  try { jobUrl = new URL(rawUrl || ""); }
  catch { return new NextResponse(null, { status: 400 }); }
  if (jobUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(jobUrl.hostname)
      || !jobUrl.pathname.startsWith("/jobs/companies/")) {
    return new NextResponse(null, { status: 400 });
  }
  try {
    const response = await fetch(jobUrl, {
      headers: { "User-Agent": "Rozgar/0.8 (company logo lookup)" },
      next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return new NextResponse(null, { status: 404 });
    const logoUrl = arbeitnowLogoFromHtml(await response.text());
    if (!logoUrl) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(logoUrl, {
      status: 307,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
