import { getTimezones, type TimezoneGroup } from "@carbon/utils";
import { useMemo } from "react";
import type { ComboboxProps } from "./Combobox";
import Combobox from "./Combobox";

type TimezoneProps = Omit<ComboboxProps, "options"> & {
  /**
   * Grouped zone options. Pass the database-sourced list (pg_timezone_names
   * via the ERP wrapper) when available; falls back to the runtime's Intl
   * list, whose canonicalization/freshness varies by engine.
   */
  options?: TimezoneGroup[];
};

/**
 * Searchable timezone picker. Options are flattened to full IANA names with
 * the current offset ("America/Chicago (UTC-06:00)") so search matches by
 * city, region, or offset.
 */
const Timezone = ({ options, ...props }: TimezoneProps) => {
  const flatOptions = useMemo(() => {
    const groups = options?.length ? options : getTimezones();
    return groups.flatMap((group) =>
      group.options.map((option) => {
        const offset = /\(UTC[^)]*\)/.exec(option.label)?.[0];
        return {
          value: option.value,
          label: `${option.value.replace(/_/g, " ")}${
            offset ? ` ${offset}` : ""
          }`
        };
      })
    );
  }, [options]);

  return <Combobox {...props} options={flatOptions} />;
};

Timezone.displayName = "Timezone";

export default Timezone;
