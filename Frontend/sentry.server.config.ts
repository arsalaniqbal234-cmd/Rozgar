import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./lib/sentry";
if (process.env.SENTRY_DSN) Sentry.init({
  dsn: process.env.SENTRY_DSN, environment: process.env.APP_ENV || "development",
  sendDefaultPii: false, tracesSampleRate: 0, beforeSend: scrubEvent,
});
