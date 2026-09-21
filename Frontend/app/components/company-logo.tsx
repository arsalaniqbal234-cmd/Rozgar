import Image from "next/image";
import type { SimpleIcon } from "simple-icons";
import {
  siAirbnb, siAirtable, siAnthropic, siBugcrowd, siCanonical, siChainguard,
  siCloudflare, siCoinbase, siDatabricks, siDatadog, siDiscord, siDoordash,
  siDropbox, siGitlab, siGrafana, siGusto, siHackerone, siInstacart,
  siLinear, siNotion, siPagerduty, siPinterest, siReddit, siSentry,
  siSnowflake, siSocketdotio, siStripe, siVercel,
} from "simple-icons";

const icons: Record<string, SimpleIcon> = {
  airbnb: siAirbnb,
  airtable: siAirtable,
  anthropic: siAnthropic,
  bugcrowd: siBugcrowd,
  canonical: siCanonical,
  chainguard: siChainguard,
  cloudflare: siCloudflare,
  coinbase: siCoinbase,
  databricks: siDatabricks,
  datadog: siDatadog,
  discord: siDiscord,
  doordash: siDoordash,
  dropbox: siDropbox,
  gitlab: siGitlab,
  grafana: siGrafana,
  grafanalabs: siGrafana,
  gusto: siGusto,
  hackerone: siHackerone,
  instacart: siInstacart,
  linear: siLinear,
  notion: siNotion,
  pagerduty: siPagerduty,
  pinterest: siPinterest,
  reddit: siReddit,
  sentry: siSentry,
  snowflake: siSnowflake,
  socket: siSocketdotio,
  stripe: siStripe,
  vercel: siVercel,
};

const normalize = (company: string) => company.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function CompanyLogo({ company, variant }: { company: string; variant: number }) {
  const key = normalize(company);
  const icon = icons[key];
  if (key === "wiz") {
    return <span className="company-mark company-logo" data-company-logo="wiz" aria-hidden>
      {/* The source is an official Wiz mark published in Microsoft's Azure Sentinel repository. */}
      <Image src="/company-logos/wiz.svg" alt="" width={30} height={30} />
    </span>;
  }
  if (icon) {
    return <span className="company-mark company-logo" data-company-logo={key} aria-hidden>
      <svg viewBox="0 0 24 24" focusable="false" style={{ color: `#${icon.hex}` }}>
        <path d={icon.path} fill="currentColor" />
      </svg>
    </span>;
  }
  return <span className={`company-mark mark-${variant}`} aria-hidden>
    {company.trim().slice(0, 2).toUpperCase() || "?"}
  </span>;
}
