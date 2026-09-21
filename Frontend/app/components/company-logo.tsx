"use client";

import Image from "next/image";
import { useState } from "react";
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

const localIcons: Record<string, string> = {
  abnormalsecurity: "abnormal.png",
  axonius: "axonius.png",
  bishopfox: "bishopfox.png",
  censys: "censys.png",
  chime: "chime.png",
  confluent: "confluent.png",
  expel: "expel.png",
  fivetran: "fivetran.png",
  huntress: "huntress.png",
  launchdarkly: "launchdarkly.png",
  materialsecurity: "materialsecurity.png",
  mercury: "mercury.png",
  openai: "openai.png",
  plaid: "plaid.png",
  praetorian: "praetorian.png",
  ramp: "ramp.png",
  remote: "remote.png",
  semgrep: "semgrep.png",
  tenable: "tenable.png",
  twilio: "twilio.png",
  wiz: "wiz.svg",
};

const normalize = (company: string) => company.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function CompanyLogo({ company, variant, sourceId, jobUrl }: {
  company: string; variant: number; sourceId: string; jobUrl: string;
}) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const key = normalize(company);
  const icon = icons[key];
  const localIcon = localIcons[key];
  if (localIcon) {
    return <span className="company-mark company-logo" data-company-logo={key} aria-hidden>
      <Image src={`/company-logos/${localIcon}`} alt="" width={30} height={30} />
    </span>;
  }
  if (icon) {
    return <span className="company-mark company-logo" data-company-logo={key} aria-hidden>
      <svg viewBox="0 0 24 24" focusable="false" style={{ color: `#${icon.hex}` }}>
        <path d={icon.path} fill="currentColor" />
      </svg>
    </span>;
  }
  if (sourceId.startsWith("arbeitnow_") && !remoteFailed) {
    const params = new URLSearchParams({ url: jobUrl });
    return <span className="company-mark company-logo" data-company-logo="arbeitnow" aria-hidden>
      {/* The route validates the host and extracts the employer image from the public job page. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/company-logo?${params}`} alt="" width="30" height="30"
        loading="lazy" onError={() => setRemoteFailed(true)} />
    </span>;
  }
  return <span className={`company-mark mark-${variant}`} aria-hidden>
    {company.trim().slice(0, 2).toUpperCase() || "?"}
  </span>;
}
