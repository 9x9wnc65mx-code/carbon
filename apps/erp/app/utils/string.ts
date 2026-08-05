import { getLogger } from "@carbon/logger";

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

// ISO 8601 week number (1-53). Week 1 is the week containing the year's first Thursday.
export const getISOWeek = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7; // Sunday → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the week's Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

// used to generate sequences. Server callers pass the company timezone so
// tokens roll over at the company's midnight; the client-side sequence-preview
// forms omit it and preview in the browser's timezone.
export const interpolateSequenceDate = (
  value: string | null,
  timezone?: string
) => {
  // replace all instances of %{year} with the current year
  if (!value) return "";
  let result = value;

  if (result.includes("%{")) {
    const date = new Date();
    const parts = timezone
      ? datePartsInTimeZone(timezone)
      : {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hours: date.getHours(),
          seconds: date.getSeconds()
        };
    const { year, month, day, hours, seconds } = parts;
    const week = getISOWeek(new Date(year, month - 1, day));

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
