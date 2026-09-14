import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./lib/sentry";
if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, environment: process.env.NEXT_PUBLIC_APP_ENV || "development",
  sendDefaultPii: false, tracesSampleRate: 0, beforeSend: scrubEvent,
});
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
