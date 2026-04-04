export const NEURON_TIMEZONE = "America/Vancouver" as const; // All of our users are in Vancouver, no need to over complicate

/** e.g. "March 21, 2026" */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: NEURON_TIMEZONE,
  });
}

/** e.g. "2:30 p.m." */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: NEURON_TIMEZONE,
  });
}
