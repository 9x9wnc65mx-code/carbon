import type { DateTimeProps } from "@carbon/react";
import { DateTime as DateTimeBase } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import { useCompanyTimeZone } from "~/hooks/useCompanyTimeZone";

/**
 * ERP timestamps default the tooltip's business-timezone row to the company's
 * zone (the ledger calendar). Location-scoped screens can pass the location
 * timezone via the `timeZone` prop instead.
 */
const DateTime = (props: DateTimeProps) => {
  const companyTimeZone = useCompanyTimeZone();
  return (
    <DateTimeBase
      timeZone={companyTimeZone}
      timeZoneLabel={<Trans>Company</Trans>}
      {...props}
    />
  );
};

export { DateTime };
