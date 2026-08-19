import { describe, expect, it, vi } from "vitest";

// items.server's only runtime dependency; stubbed so the pure verdict logic
// can be tested without dragging in the app's full module graph.
vi.mock("~/modules/settings", () => ({ getCompanySettings: vi.fn() }));

// items.server pulls the items module graph (via ~/modules/items), which
// transitively loads @carbon/glossary — whose module-load-time Lingui `msg`
// macro isn't transformed under plain vitest and throws. Stub it; the verdict
// logic under test needs none of it.
vi.mock("@carbon/glossary", () => ({
  terms: {},
  getEntry: vi.fn(),
  lookupEntry: vi.fn(),
  hasEntry: vi.fn(),
  termSlug: vi.fn()
}));

const {
  getLockVerdict,
  LOCKED_REVISION_MESSAGE,
  getUnreleasedChangeOrderItems,
  getUnreleasedChangeOrderIssue
} = await import("./items.server");

describe("getLockVerdict", () => {
  it("allows edits when the revision is not locked", () => {
    for (const releaseControl of ["off", "warn", "enforce"] as const) {
      expect(getLockVerdict({ isLocked: false, releaseControl })).toEqual({
        ok: true,
        warn: false
      });
    }
  });

  it("allows edits on a locked revision when release control is off", () => {
    expect(getLockVerdict({ isLocked: true, releaseControl: "off" })).toEqual({
      ok: true,
      warn: false
    });
  });

  it("allows edits with a warning on a locked revision when release control is warn", () => {
    expect(getLockVerdict({ isLocked: true, releaseControl: "warn" })).toEqual({
      ok: true,
      warn: true,
      message: LOCKED_REVISION_MESSAGE
    });
  });

  it("blocks edits on a locked revision when release control is enforce", () => {
    expect(
      getLockVerdict({ isLocked: true, releaseControl: "enforce" })
    ).toEqual({
      ok: false,
      warn: false,
      message: LOCKED_REVISION_MESSAGE
    });
  });
});

type Row = Record<string, unknown> | null;

// Stands in for the two list reads the batch guard makes. Supabase builders are
// thenables, so the chain resolves on await without a terminal method.
function fakeListClient(
  rows: { item?: Row[]; changeOrder?: Row[] },
  errors: { item?: boolean; changeOrder?: boolean } = {}
) {
  return {
    from(table: string) {
      const failed = errors[table as keyof typeof errors] === true;
      const result = {
        data: failed ? null : (rows[table as keyof typeof rows] ?? []),
        error: failed ? { message: `failed to read ${table}` } : null
      };
      const builder = {
        select: () => builder,
        in: () => builder,
        eq: () => builder,
        then: (resolve: (value: typeof result) => unknown) => resolve(result)
      };
      return builder;
    }
  } as never;
}

const companyId = "company_1";
const args = { itemId: "item_1", companyId };

describe("getUnreleasedChangeOrderItems", () => {
  it("reads nothing when given no ids", async () => {
    const client = fakeListClient({ item: [{ id: "item_1" }] });

    expect(
      await getUnreleasedChangeOrderItems(client, { itemIds: [], companyId })
    ).toEqual({ data: [], error: null });
  });

  it("passes items that no change order owns", async () => {
    const client = fakeListClient({
      item: [
        {
          id: "item_1",
          readableIdWithRevision: "P000001",
          changeOrderId: null
        }
      ]
    });

    expect(
      await getUnreleasedChangeOrderItems(client, {
        itemIds: ["item_1"],
        companyId
      })
    ).toEqual({ data: [], error: null });
  });

  // Release leaves changeOrderId in place as a provenance link, so the column
  // alone cannot answer "is this still a draft" — the status decides.
  it("returns only the items whose change order is unreleased", async () => {
    const client = fakeListClient({
      item: [
        {
          id: "item_1",
          readableIdWithRevision: "P000001.A",
          changeOrderId: "co_open"
        },
        {
          id: "item_2",
          readableIdWithRevision: "P000002.B",
          changeOrderId: "co_done"
        }
      ],
      changeOrder: [
        {
          id: "co_open",
          changeOrderId: "ECO-000001",
          status: "Implementation"
        },
        { id: "co_done", changeOrderId: "ECO-000002", status: "Done" }
      ]
    });

    expect(
      await getUnreleasedChangeOrderItems(client, {
        itemIds: ["item_1", "item_2"],
        companyId
      })
    ).toEqual({
      data: [
        {
          itemId: "item_1",
          itemName: "P000001.A",
          changeOrderReadableId: "ECO-000001"
        }
      ],
      error: null
    });
  });

  // A read that did not answer says nothing about the items, so callers block
  // rather than wave the write through on a database blip.
  it("reports an error when the item read fails", async () => {
    const client = fakeListClient({}, { item: true });

    expect(
      await getUnreleasedChangeOrderItems(client, {
        itemIds: ["item_1"],
        companyId
      })
    ).toEqual({
      data: [],
      error: "These items could not be checked against their change orders."
    });
  });

  it("reports an error when the change order read fails", async () => {
    const client = fakeListClient(
      {
        item: [
          {
            id: "item_1",
            readableIdWithRevision: "P000001.A",
            changeOrderId: "co_open"
          }
        ]
      },
      { changeOrder: true }
    );

    expect(
      await getUnreleasedChangeOrderItems(client, {
        itemIds: ["item_1"],
        companyId
      })
    ).toEqual({
      data: [],
      error: "These items could not be checked against their change orders."
    });
  });
});

describe("getUnreleasedChangeOrderIssue", () => {
  it("names the change order still holding the item", async () => {
    const client = fakeListClient({
      item: [
        {
          id: "item_1",
          readableIdWithRevision: "P000001.A",
          changeOrderId: "co_open"
        }
      ],
      changeOrder: [
        { id: "co_open", changeOrderId: "ECO-000001", status: "Draft" }
      ]
    });

    expect(await getUnreleasedChangeOrderIssue(client, args)).toBe(
      "P000001.A was created by change order ECO-000001, which has not been released yet."
    );
  });

  // Narrow on purpose — the guard does not judge `active`. Inactive items are
  // allowed onto these documents today, and that is a separate decision.
  it("passes an inactive item that no change order owns", async () => {
    const client = fakeListClient({
      item: [
        { id: "item_1", readableIdWithRevision: "P000001", changeOrderId: null }
      ]
    });

    expect(await getUnreleasedChangeOrderIssue(client, args)).toBeNull();
  });

  it("blocks when the check could not be made", async () => {
    const client = fakeListClient({}, { item: true });

    expect(await getUnreleasedChangeOrderIssue(client, args)).toBe(
      "These items could not be checked against their change orders."
    );
  });
});
