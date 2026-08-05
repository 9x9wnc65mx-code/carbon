import { getLogger } from "@carbon/logger";
import { datetime } from "@carbon/utils";
import { CalendarDate } from "@internationalized/date";

export { stripSpecialCharacters } from "@carbon/utils";

const logger = getLogger("erp", "utils", "string");

export const capitalize = (words: string) => {
  const [first, ...otherLetters] = words;
  return [first.toLocaleUpperCase(), ...otherLetters].join("");
};

export const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z])/g, (group: string) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

export const camelToSnake = (str: string) =>
  str.replace(/([A-Z])/g, (group: string) => `_${group.toLowerCase()}`);

export const camelCaseToWords = (str: string) =>
  str.replace(/([A-Z])/g, (group: string) => ` ${group}`);

/**
 * Copy text content (string or Promise<string>) into Clipboard.
 * Safari doesn't support write text into clipboard async, so if you need to load
 * text content async before coping, please use Promise<string> for the 1st arg.
 */
export const copyToClipboard = async (
  str: string | Promise<string>,
  // biome-ignore lint/suspicious/noEmptyBlockStatements: suppressed due to migration
  callback = () => {}
) => {
  const focused = window.document.hasFocus();
  if (focused) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      const text = await Promise.resolve(str);
      Promise.resolve(window.navigator?.clipboard?.writeText(text)).then(
        callback
      );

      return;
    }

    Promise.resolve(str)
      .then((text) => window.navigator?.clipboard?.writeText(text))
      .then(callback);
  } else {
    logger.warning("Unable to copy to clipboard");
  }
};

// Current wall-clock parts in an explicit timezone (for server callers that
// derive sequence tokens in the company's business timezone).
const datePartsInTimeZone = (timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hours: get("hour"),
    seconds: get("second")
  };
};

// used to generate sequences — date tokens derive in the company's business
// timezone so document prefixes roll over at the company's midnight, not the
// process's. Mirrors functions/lib/utils.ts; keep the two in sync.
export const interpolateSequenceDate = (
  value: string | null,
  timezone = "UTC"
) => {
  // replace all instances of %{year} with the current year
  if (!value) return "";
  let result = value;

  if (result.includes("%{")) {
    const { year, month, day, hours, seconds } = datePartsInTimeZone(timezone);
    const week = datetime.weekNumber(new CalendarDate(year, month, day));

    result = result.replace(/%{yyyy}/g, year.toString());
    result = result.replace(/%{yy}/g, year.toString().slice(-2));
    result = result.replace(/%{mm}/g, month.toString().padStart(2, "0"));
    result = result.replace(/%{ww}/g, week.toString().padStart(2, "0"));
    result = result.replace(/%{dd}/g, day.toString().padStart(2, "0"));
    result = result.replace(/%{hh}/g, hours.toString().padStart(2, "0"));
    result = result.replace(/%{ss}/g, seconds.toString().padStart(2, "0"));
  }

  return result;
};

export const getReadableIdWithRevision = (
  readableId: string,
  revision?: string | null
) => {
  if (revision && revision !== "0") {
    return `${readableId}.${revision}`;
  }

  return readableId;
};
