import type { ErrorEvent } from "@sentry/nextjs";

export function scrubEvent(event: ErrorEvent) {
  delete event.user;
  delete event.breadcrumbs;
  if (event.request) {
    delete event.request.headers;
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
  }
  return event;
}
