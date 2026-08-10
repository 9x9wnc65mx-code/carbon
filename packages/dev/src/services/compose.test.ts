import { describe, expect, it } from "vitest";
import { buildDownArgs, buildUpArgs } from "./compose.js";

// The teardown itself talks to the Docker daemon and isn't unit-testable. What
// IS testable — and what a mistake here actually costs — is the profile set on
// the `down` argv. Compose treats a profile-gated service as "defined but not
// enabled" rather than an orphan, so a `down` missing a profile exits 0 having
// silently left those containers running. They accumulate per worktree until a
// Docker restart recreates the project network, at which point the stale
// containers hold a dead network id and the next `crbn up` fails with
// "network <id> not found".

const ROOT = "/tmp/carbon-worktree";
const SLUG = "carbon-test";

/** Values of every `--profile <name>` pair in an argv array. */
function profilesIn(args: string[]): string[] {
  return args.flatMap((arg, i) => {
    const value = args[i + 1];
    return arg === "--profile" && value !== undefined ? [value] : [];
  });
}

describe("buildDownArgs", () => {
  it("enables every profile that buildUpArgs can enable", () => {
    // Union of the profiles reachable from any `crbn up` invocation.
    const bootable = new Set([
      ...profilesIn(buildUpArgs(ROOT, SLUG)),
      ...profilesIn(buildUpArgs(ROOT, SLUG, { chrome: true })),
      ...profilesIn(buildUpArgs(ROOT, SLUG, { minimal: true }))
    ]);
    const tearable = new Set(profilesIn(buildDownArgs(ROOT, SLUG, false)));

    for (const profile of bootable) {
      expect(
        tearable.has(profile),
        `up can boot --profile ${profile} but down never enables it — those containers would survive teardown`
      ).toBe(true);
    }
  });

  it("covers the profile-gated services by name", () => {
    // Guards against the union test passing vacuously if buildUpArgs ever
    // stops pushing profiles at all. `full` = studio/meta/inbucket,
    // `chrome` = the opt-in thumbnail Chromium (`crbn up --thumbnails`).
    expect(profilesIn(buildDownArgs(ROOT, SLUG, false))).toEqual(
      expect.arrayContaining(["full", "chrome"])
    );
  });

  it("preserves volumes unless explicitly asked to remove them", () => {
    // A stray -v here silently destroys a developer's local database.
    expect(buildDownArgs(ROOT, SLUG, false)).not.toContain("-v");
    expect(buildDownArgs(ROOT, SLUG, true)).toContain("-v");
  });

  it("still removes orphans", () => {
    expect(buildDownArgs(ROOT, SLUG, false)).toContain("--remove-orphans");
  });
});

describe("buildUpArgs", () => {
  // Locking in the pre-existing boot behavior, which the extraction preserved.
  it("enables the full profile by default", () => {
    expect(profilesIn(buildUpArgs(ROOT, SLUG))).toEqual(["full"]);
  });

  it("drops the full profile under --minimal", () => {
    expect(profilesIn(buildUpArgs(ROOT, SLUG, { minimal: true }))).toEqual([]);
  });

  it("adds the chrome profile only when asked", () => {
    expect(profilesIn(buildUpArgs(ROOT, SLUG, { chrome: true }))).toEqual([
      "full",
      "chrome"
    ]);
  });

  it("activates no profiles when specific services are named", () => {
    // Compose starts named services plus dependencies regardless of profiles;
    // activating them here would pull in unrelated containers.
    const args = buildUpArgs(ROOT, SLUG, {
      services: ["postgres"],
      chrome: true
    });
    expect(profilesIn(args)).toEqual([]);
    expect(args).toContain("postgres");
  });
});
