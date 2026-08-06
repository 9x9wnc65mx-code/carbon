"use client";

import {
  formatDate,
  formatDateTime,
  formatDateTimeInZone,
  formatPreciseDuration,
  formatRelativeCalendarDays,
  formatRelativeTime,
  getTimeZoneOffsetLabel
} from "@carbon/utils";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { Trans } from "@lingui/react/macro";
import { useLocale } from "@react-aria/i18n";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger
} from "./Tooltip";
import { cn } from "./utils/cn";

export type DateTimeProps = {
  /** ISO timestamp (a UTC instant, e.g. `createdAt`) or a `YYYY-MM-DD` date */
  value: string | null | undefined;
  /**
   * Inline text style:
   * - `relative` — "3 hours ago"
   * - `absolute` — short date + short time
   * - `time` — time of day only
   * - `date` — date only (no time-of-day); tooltip drops the clock rows
   */
  variant?: "relative" | "absolute" | "time" | "date";
  /**
   * Business timezone for the extra tooltip row — company or location
   * depending on context. Hidden when it matches the viewer's zone or UTC.
   */
  timeZone?: string;
  /**
   * Semantic label for the business-timezone row ("Company", "Location", …) so
   * the viewer can tell which offset is which. Falls back to the IANA name.
   */
  timeZoneLabel?: ReactNode;
  /** Custom trigger element (e.g. an info icon) instead of the formatted text. */
  children?: ReactNode;
  /**
   * Intl options for the inline text of `variant="date"`, so each call site
   * keeps the exact format it rendered before (defaults to `formatDate`'s
   * medium style). Ignored by the other variants.
   */
  dateOptions?: Intl.DateTimeFormatOptions;
  fallback?: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
};

/** One popover row, as grid cells so chips / labels / dates / times align in
 *  shared columns across all rows. */
function TooltipRow({
  label,
  labelTitle,
  suffix,
  value,
  timeZone,
  locale
}: {
  label: string;
  labelTitle?: string;
  suffix?: ReactNode;
  value: string;
  timeZone: string;
  locale: string;
}) {
  return (
    <>
      <span
        title={labelTitle}
        className="inline-flex w-fit items-center rounded bg-muted px-1.5 py-px font-mono text-[0.6875rem] text-foreground/80"
      >
        {label}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {suffix}
      </span>
      <span className="text-xs font-medium tabular-nums">
        {formatDateTimeInZone(value, timeZone, locale, {
          dateStyle: undefined,
          timeStyle: undefined,
          month: "short",
          day: "numeric",
          year: "numeric"
        })}
      </span>
      <span className="justify-self-end pl-6 font-mono text-xs tabular-nums text-muted-foreground">
        {formatDateTimeInZone(value, timeZone, locale, {
          dateStyle: undefined,
          timeStyle: undefined,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })}
      </span>
    </>
  );
}

const DateTime = ({
  value,
  variant = "absolute",
  timeZone,
  timeZoneLabel,
  children,
  dateOptions,
  fallback = null,
  className,
  side = "top"
}: DateTimeProps) => {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);

  if (!value) return <>{fallback}</>;

  const viewerTimeZone = getLocalTimeZone();
  const isDate = variant === "date";
  // A bare `YYYY-MM-DD` is a business date — its day starts at midnight in the
  // business timezone (company/location), NOT midnight UTC. Anchoring there
  // keeps the business row on the stated date; `toDate` resolves DST-skipped
  // midnights to the day's true first instant.
  const hasTime = value.includes("T");
  let instant = value;
  if (!hasTime) {
    try {
      instant = parseDate(value)
        .toDate(timeZone ?? "UTC")
        .toISOString();
    } catch {
      instant = `${value}T00:00:00Z`;
    }
  }

  const inline =
    variant === "relative"
      ? formatRelativeTime(value, locale)
      : variant === "time"
        ? formatDateTimeInZone(value, viewerTimeZone, locale, {
            dateStyle: undefined,
            timeStyle: "short"
          })
        : isDate
          ? formatDate(value, dateOptions, locale)
          : formatDateTime(value, locale);

  const showBusinessRow =
    !!timeZone && timeZone !== viewerTimeZone && timeZone !== "UTC";

  // Computed once when the popover opens (the render `open` triggers) — no
  // ticking interval; the diff is a snapshot of the moment you opened it.
  // Bare dates get the coarse day-level distance instead of a fake
  // to-the-second one.
  let precise: { text: string; direction: "past" | "future" } | null = null;
  if (open && hasTime) {
    precise = formatPreciseDuration(value, locale);
  }

  // Only resolve offset labels while the tooltip is open — a table can mount
  // hundreds of these and the parse/format is not free.
  const viewerOffsetLabel = open
    ? getTimeZoneOffsetLabel(instant, viewerTimeZone)
    : "";
  const businessOffsetLabel =
    open && timeZone ? getTimeZoneOffsetLabel(instant, timeZone) : "";

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={200}>
      <TooltipTrigger asChild>
        {children ? (
          <span className={cn("inline-flex items-center", className)}>
            {children}
          </span>
        ) : (
          <time
            dateTime={value}
            suppressHydrationWarning
            className={cn(
              "cursor-pointer whitespace-nowrap underline decoration-muted-foreground/50 decoration-dotted underline-offset-[3px] transition-colors hover:decoration-foreground/70",
              className
            )}
          >
            {inline}
          </time>
        )}
      </TooltipTrigger>
      {open && (
        <TooltipContent side={side} className="max-w-none p-0">
          <TooltipArrow />
          <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground tabular-nums">
            {precise?.direction === "future" ? (
              <Trans>in {precise?.text}</Trans>
            ) : precise ? (
              <Trans>{precise?.text} ago</Trans>
            ) : (
              // Bare date: exact day distance on the business calendar —
              // "in 8 days", not a vague "next week".
              formatRelativeCalendarDays(
                value,
                today(timeZone ?? viewerTimeZone).toString(),
                locale
              )
            )}
          </div>
          <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5 text-[0.8125rem]">
            <TooltipRow
              label="UTC"
              value={instant}
              timeZone="UTC"
              locale={locale}
            />
            <TooltipRow
              label={viewerOffsetLabel}
              labelTitle={viewerTimeZone}
              suffix={<Trans>Local</Trans>}
              value={instant}
              timeZone={viewerTimeZone}
              locale={locale}
            />
            {showBusinessRow && (
              <TooltipRow
                label={businessOffsetLabel}
                labelTitle={timeZone}
                suffix={timeZoneLabel ?? timeZone}
                value={instant}
                timeZone={timeZone}
                locale={locale}
              />
            )}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
};
DateTime.displayName = "DateTime";

export { DateTime };
