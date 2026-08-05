export type TimezoneOption = { label: string; value: string };
export type TimezoneGroup = { label: string; options: TimezoneOption[] };

/** True when `tz` is an IANA timezone the runtime (and Postgres) can resolve. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function offsetLabel(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset"
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // "GMT" (UTC itself) and "GMT-06:00" → "UTC±HH:MM"
    return name === "GMT" ? "UTC+00:00" : name.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

let cachedTimezones: TimezoneGroup[] | null = null;
let cachedAt = 0;
// Offset labels show the CURRENT UTC offset, which changes at DST transitions —
// an immortal memo on a long-lived server would keep showing the old offset.
// One hour bounds the staleness while still amortizing the ~420 Intl lookups.
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * IANA timezones from the runtime's own tzdata (`Intl.supportedValuesOf`) —
 * no hardcoded list to drift. Grouped by region, labeled with the current UTC
 * offset. Canonical IANA names, so every value is also valid for Postgres
 * `AT TIME ZONE` (used by `company_today()`). Memoized: the ~420 offset
 * lookups run at most once per hour, not per render.
 */
export function getTimezones(): TimezoneGroup[] {
  if (cachedTimezones && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedTimezones;
  }

  const zones: string[] =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  // Bare "UTC" is the DB default and backfill value but is absent from some
  // runtimes' supported list — the picker must always be able to render it.
  if (!zones.includes("UTC")) zones.unshift("UTC");

  const groups = new Map<string, TimezoneOption[]>();
  for (const zone of zones) {
    const [region = "Other", ...rest] = zone.split("/");
    const city = rest.join("/").replace(/_/g, " ");
    const group = rest.length === 0 ? "Other" : region;
    const offset = offsetLabel(zone);
    const label = city
      ? `${city}${offset ? ` (${offset})` : ""}`
      : `${zone}${offset ? ` (${offset})` : ""}`;
    const options = groups.get(group) ?? [];
    options.push({ label, value: zone });
    groups.set(group, options);
  }

  const regionOrder = [
    "America",
    "Europe",
    "Asia",
    "Africa",
    "Australia",
    "Pacific",
    "Atlantic",
    "Indian",
    "Antarctica",
    "Arctic",
    "Other"
  ];

  cachedTimezones = [...groups.entries()]
    .sort(
      ([a], [b]) =>
        (regionOrder.indexOf(a) + 1 || 99) - (regionOrder.indexOf(b) + 1 || 99)
    )
    .map(([label, options]) => ({
      label,
      options: options.sort((a, b) => a.label.localeCompare(b.label))
    }));
  cachedAt = Date.now();

  return cachedTimezones;
}
