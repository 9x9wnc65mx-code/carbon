import type { ConformanceCheck, Violation } from "../check";

/**
 * Server code must not derive calendar days from the process timezone. The
 * banned idioms silently disagree with each other whenever TZ ≠ UTC:
 * - getLocalTimeZone() on a server = the server's zone, not the user's
 * - new Date().toISOString().split("T")[0] / .slice(0, 10) = the UTC day
 * Use datetime.today(tz) / datetime.businessDay(instant, tz) with a timezone
 * resolved from company.timezone (ledger-scoped) or location.timezone
 * (operational). Full-instant new Date().toISOString() stays allowed —
 * timestamps are timezone-free.
 */
const BANNED = [
  {
    pattern: /getLocalTimeZone\s*\(/g,
    message:
      "Server code: resolve company/location timezone and use datetime.today(tz) — getLocalTimeZone() is the process zone, not the user's."
  },
  {
    pattern:
      /new Date\(\)\s*\.toISOString\(\)\s*\.(?:split\(\s*["']T["']\s*\)\s*\[0\]|slice\(\s*0,\s*10\s*\))/g,
    message:
      "Server code: this is the UTC calendar day — use datetime.today(tz) with the company/location timezone."
  }
];

export const noLocalTimezone: ConformanceCheck = {
  id: "no-local-timezone",
  description:
    "Server code derives calendar days via datetime.today(tz), never the process clock or UTC-slicing.",
  provenance: {
    deprecates: "getLocalTimeZone() / toISOString() day-slicing in server code",
    replacedBy: "@carbon/utils datetime + company/location timezone",
    since: "20260805020925_company-timezone.sql"
  },
  scan(file, contents) {
    const violations: Violation[] = [];
    contents.split("\n").forEach((text, i) => {
      for (const { pattern, message } of BANNED) {
        for (const m of text.matchAll(pattern)) {
          violations.push({ file, line: i + 1, snippet: m[0], message });
        }
      }
    });
    return violations;
  }
};
