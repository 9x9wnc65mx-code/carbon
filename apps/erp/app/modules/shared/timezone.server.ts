import type { AnyPostgresClient } from "@carbon/database";
import {
  getCompanyTimeZone as resolveCompanyTimeZone,
  getLocationTimeZone as resolveLocationTimeZone
} from "@carbon/database";
import { redis } from "@carbon/kv";

// Timezones change only when someone edits Settings → Company or a location, so
// a long TTL is fine — writes invalidate the key explicitly (below). The
// @carbon/kv resilience wrapper fails soft: a Redis miss/outage/corrupt value
// just falls through to the database read.
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const companyKey = (companyId: string) => `timezone:company:${companyId}`;
// location.id is a globally-unique xid, so it alone keys the entry.
const locationKey = (locationId: string) => `timezone:location:${locationId}`;

/** Redis-cached {@link resolveCompanyTimeZone}. */
export async function getCompanyTimeZone(
  db: AnyPostgresClient,
  companyId: string
): Promise<string> {
  const key = companyKey(companyId);
  const cached = await redis.get(key);
  if (cached) return cached;

  const tz = await resolveCompanyTimeZone(db, companyId);
  await redis.set(key, tz, "EX", TTL_SECONDS);
  return tz;
}

/** Redis-cached {@link resolveLocationTimeZone}. */
export async function getLocationTimeZone(
  db: AnyPostgresClient,
  locationId: string,
  companyId: string
): Promise<string> {
  const key = locationKey(locationId);
  const cached = await redis.get(key);
  if (cached) return cached;

  const tz = await resolveLocationTimeZone(db, locationId, companyId);
  await redis.set(key, tz, "EX", TTL_SECONDS);
  return tz;
}

/** Drop the cached company timezone — call after writing `company.timezone`. */
export async function invalidateCompanyTimeZone(
  companyId: string
): Promise<void> {
  await redis.del(companyKey(companyId));
}

/** Drop the cached location timezone — call after writing `location.timezone`. */
export async function invalidateLocationTimeZone(
  locationId: string
): Promise<void> {
  await redis.del(locationKey(locationId));
}
