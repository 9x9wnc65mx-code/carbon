import { parseDateTime } from "@internationalized/date";

export function farmLocalDateTimeToUtc(value: string | undefined, timeZone: string) {
  if (!value) return undefined;
  return parseDateTime(value).toDate(timeZone).toISOString();
}

export function utcDateTimeToFarmLocal(value: string | null | undefined, timeZone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));
  const item = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${item.year}-${item.month}-${item.day}T${item.hour}:${item.minute}`;
}

export function formatFarmDateTime(value: string | null | undefined, timeZone: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
