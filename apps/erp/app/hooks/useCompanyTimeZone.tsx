import { useRouteData } from "@carbon/react";
import { today } from "@internationalized/date";
import type { Company } from "~/modules/settings";
import { path } from "~/utils/path";

/**
 * The company's IANA timezone — the ledger calendar. Use it to seed any date a
 * form will persist as a business date (postingDate, orderDate, dateIssued, …)
 * so the stored value matches the books, not whichever zone the browser is in.
 * Falls back to UTC before the layout route data is available.
 */
export function useCompanyTimeZone(): string {
  const data = useRouteData<{ company: Company }>(path.to.authenticatedRoot);
  return data?.company?.timezone ?? "UTC";
}

/** Today's `YYYY-MM-DD` on the company's calendar — a form-ready default. */
export function useCompanyToday(): string {
  return today(useCompanyTimeZone()).toString();
}
