import type { DateTimeProps } from "@carbon/react";
import { DateTime as DateTimeBase } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import { useLocationTimeZone } from "~/hooks/useCompanyTimeZone";

/**
 * MES timestamps default the tooltip's business-timezone row to the current
 * location's zone — the shop floor runs on the site's clock.
 */
const DateTime = (props: DateTimeProps) => {
  const locationTimeZone = useLocationTimeZone();
  return (
    <DateTimeBase
      timeZone={locationTimeZone}
      timeZoneLabel={<Trans>Location</Trans>}
      {...props}
    />
  );
};

export { DateTime };
