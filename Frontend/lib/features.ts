// Publish email-alert copy only after delivery credentials and a worker are active.
export const emailAlertsEnabled = process.env.NEXT_PUBLIC_EMAIL_ALERTS_ENABLED === "true";
