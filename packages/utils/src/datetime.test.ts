import { describe, expect, it } from "vitest";
import { datetime } from "./datetime";

describe("datetime.businessDay", () => {
  it("assigns a late-evening US instant to the previous UTC day", () => {
    // 2026-02-01T04:59Z is still Jan 31 in Chicago (UTC-6)
    expect(
      datetime.businessDay("2026-02-01T04:59:00Z", "America/Chicago").toString()
    ).toBe("2026-01-31");
    expect(datetime.businessDay("2026-02-01T04:59:00Z", "UTC").toString()).toBe(
      "2026-02-01"
    );
  });

  it("assigns an early-morning UTC instant to the next day east of UTC", () => {
    // 23:30Z is already the next day in Tokyo (UTC+9)
    expect(
      datetime.businessDay("2026-08-04T23:30:00Z", "Asia/Tokyo").toString()
    ).toBe("2026-08-05");
  });

  it("handles DST transitions", () => {
    // US spring forward 2026-03-08: 07:30Z = 01:30 CST (UTC-6), same calendar day
    expect(
      datetime.businessDay("2026-03-08T07:30:00Z", "America/Chicago").toString()
    ).toBe("2026-03-08");
    // After the jump the offset is -5; 04:30Z on Mar 9 is still Mar 8 23:30 CDT
    expect(
      datetime.businessDay("2026-03-09T04:30:00Z", "America/Chicago").toString()
    ).toBe("2026-03-08");
  });
});

describe("datetime.today / datetime.now", () => {
  it("differ across the date line at the right moments", () => {
    // Can't pin the wall clock in a unit test, but the invariant holds always:
    // Pacific/Kiritimati (UTC+14) and Pacific/Niue (UTC-11) are 25h apart, so
    // they are never on the same calendar day.
    const east = datetime.today("Pacific/Kiritimati");
    const west = datetime.today("Pacific/Niue");
    expect(east.compare(west)).toBeGreaterThan(0);
  });

  it("now() carries the requested timezone", () => {
    expect(datetime.now("America/Chicago").timeZone).toBe("America/Chicago");
  });
});

describe("datetime.timestamp", () => {
  it("returns a UTC instant string", () => {
    expect(datetime.timestamp()).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});

describe("datetime.weekNumber", () => {
  it("matches known ISO 8601 week numbers", () => {
    expect(
      datetime.weekNumber(datetime.businessDay("2026-01-01T12:00:00Z", "UTC"))
    ).toBe(1);
    // 2027-01-01 is a Friday → belongs to ISO week 53 of 2026
    expect(
      datetime.weekNumber(datetime.businessDay("2027-01-01T12:00:00Z", "UTC"))
    ).toBe(53);
    // 2024-12-30 (Monday) belongs to week 1 of 2025
    expect(
      datetime.weekNumber(datetime.businessDay("2024-12-30T12:00:00Z", "UTC"))
    ).toBe(1);
    expect(
      datetime.weekNumber(datetime.businessDay("2026-08-05T12:00:00Z", "UTC"))
    ).toBe(32);
  });
});
