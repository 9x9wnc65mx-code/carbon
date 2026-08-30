import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { now } from "@internationalized/date";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, redirect, useLoaderData } from "react-router";
import {
  createFeedItemProfile,
  createFeedSpecificationParameter,
  createLabAccession,
  feedItemProfileValidator,
  feedLabAccessionValidator,
  feedSpecificationParameterValidator,
  feedTrackedLotProfileValidator,
  getFarm,
  getFeedTraceabilitySnapshot,
  getFlockCycle,
  getFlockCycles,
  getLaboratories,
  getLaboratory,
  getLabAccessions,
  getPoultryHouse,
  saveFeedTrackedLotProfile,
  updateFeedItemProfile,
  utcDateTimeToFarmLocal
} from "~/modules/poultry";
import {
  FeedItemProfileForm,
  FeedLabAccessionForm,
  FeedSpecificationParameterForm,
  FeedTrackedLotProfileForm
} from "~/modules/poultry/ui/FeedForms";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";
import type { Handle } from "~/utils/handle";

export const handle: Handle = {
  breadcrumb: msg`Feed & Feed Mill`,
  to: "/x/poultry/feed"
};

type FeedRouteClient = Parameters<typeof getFlockCycle>[0];

async function resolveFeedAccessionTimeZone(
  client: FeedRouteClient,
  companyId: string,
  laboratoryId: string,
  flockId?: string
) {
  if (flockId) {
    const flock = await getFlockCycle(client, companyId, flockId);
    if (flock.data) {
      const house = await getPoultryHouse(client, companyId, flock.data.houseId);
      if (house.data) {
        const farm = await getFarm(client, companyId, house.data.farmId);
        if (farm.data?.timezone) return farm.data.timezone;
      }
    }
  }

  const laboratory = await getLaboratory(client, companyId, laboratoryId);
  return laboratory.data?.timezone ?? "UTC";
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "inventory",
    role: "employee"
  });

  const [feed, laboratories, flocks, accessions] = await Promise.all([
    getFeedTraceabilitySnapshot(client, companyId),
    getLaboratories(client, companyId),
    getFlockCycles(client, companyId),
    getLabAccessions(client, companyId)
  ]);

  const labs = laboratories.data ?? [];
  const defaultTimeZone =
    labs.find(
      (laboratory) =>
        laboratory.status === "Active" && laboratory.laboratoryType === "Feed"
    )?.timezone ??
    labs.find((laboratory) => laboratory.status === "Active")?.timezone ??
    "UTC";

  return {
    ...feed,
    laboratories: labs,
    flocks: flocks.data ?? [],
    accessions: (accessions.data ?? []).filter(
      (accession) => accession.sourceType === "Feed" && accession.trackedEntityId
    ),
    defaultDateTime: utcDateTimeToFarmLocal(
      now("UTC").toAbsoluteString(),
      defaultTimeZone
    )
  };
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "createFeedItem") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "inventory"
    });
    const validation = await validator(feedItemProfileValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createFeedItemProfile(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to create feed profile"))
      );
    }
    throw redirect(
      "/x/poultry/feed",
      await flash(request, success("Feed profile created"))
    );
  }

  if (intent === "updateFeedItem") {
    const { client, companyId, userId } = await requirePermissions(request, {
      update: "inventory"
    });
    const validation = await validator(feedItemProfileValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await updateFeedItemProfile(
      client,
      validation.data.itemId,
      validation.data,
      { companyId, userId }
    );
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to update feed profile"))
      );
    }
    throw redirect(
      "/x/poultry/feed",
      await flash(request, success("Feed profile updated"))
    );
  }

  if (intent === "createFeedSpecification") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "inventory"
    });
    const validation = await validator(feedSpecificationParameterValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await createFeedSpecificationParameter(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to add feed specification"))
      );
    }
    throw redirect(
      "/x/poultry/feed",
      await flash(request, success("Feed specification added"))
    );
  }

  if (intent === "createFeedLot" || intent === "updateFeedLot") {
    const { client, companyId, userId } =
      intent === "updateFeedLot"
        ? await requirePermissions(request, { update: "inventory" })
        : await requirePermissions(request, { create: "inventory" });
    const validation = await validator(feedTrackedLotProfileValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await saveFeedTrackedLotProfile(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to save feed lot metadata"))
      );
    }
    throw redirect(
      "/x/poultry/feed",
      await flash(request, success("Feed lot metadata saved"))
    );
  }

  if (intent === "createFeedAccession") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "production"
    });
    const validation = await validator(feedLabAccessionValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const sourceTimeZone = await resolveFeedAccessionTimeZone(
      client,
      companyId,
      validation.data.laboratoryId,
      validation.data.flockId
    );
    const result = await createLabAccession(client, validation.data, {
      companyId,
      userId,
      sourceTimeZone
    });
    if (result.error || !result.data) {
      return data(
        {},
        await flash(
          request,
          error(result.error, "Failed to open feed laboratory accession")
        )
      );
    }
    throw redirect(
      `/x/poultry/laboratories/${result.data.id}`,
      await flash(request, success("Feed laboratory accession opened"))
    );
  }

  return data(
    {},
    await flash(request, error(null, "Unsupported feed traceability action"))
  );
}

function Badge({ value }: { value: string }) {
  const positive = ["Active", "Available", "Accepted", "Completed"].includes(value);
  const warning = ["On Hold", "Pending", "Testing", "Sampled"].includes(value);
  const negative = ["Rejected", "Scrapped"].includes(value);
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs ${
        positive
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          : negative
            ? "border-red-500/40 bg-red-500/10 text-red-700"
            : warning
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
              : "text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}

export default function FeedTraceabilityCenterRoute() {
  const {
    profiles,
    items,
    lots,
    lotProfiles,
    specifications,
    laboratories,
    flocks,
    accessions,
    defaultDateTime
  } = useLoaderData<typeof loader>();

  const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
  const profileByItem = Object.fromEntries(
    profiles.map((profile) => [profile.itemId, profile])
  );
  const lotProfileById = Object.fromEntries(
    lotProfiles.map((profile) => [profile.trackedEntityId, profile])
  );
  const specsByItem = specifications.reduce<
    Record<string, typeof specifications>
  >((map, specification) => {
    (map[specification.itemId] ??= []).push(specification);
    return map;
  }, {});
  const accessionsByLot = accessions.reduce<Record<string, typeof accessions>>(
    (map, accession) => {
      if (accession.trackedEntityId) {
        (map[accession.trackedEntityId] ??= []).push(accession);
      }
      return map;
    },
    {}
  );
  const configuredItemIds = new Set(profiles.map((profile) => profile.itemId));
  const candidateItems = items.filter((item) => !configuredItemIds.has(item.id));
  const registeredLots = lots.filter((lot) => Boolean(lotProfileById[lot.id]));
  const openFeedTests = accessions.filter(
    (accession) => !["Completed", "Rejected", "Cancelled"].includes(accession.status)
  ).length;

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-6">
      <VStack spacing={4}>
        <div className="w-full">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-balance">
                <Trans>Feed & Feed Mill Traceability</Trans>
              </h1>
              <p className="mt-1 max-w-4xl text-sm text-muted-foreground text-pretty">
                <Trans>
                  Extend Carbon items and batch-tracked inventory with poultry feed
                  specifications, lot QA metadata, laboratory sampling and flock exposure.
                  Carbon remains the source of truth for quantity, lot identity, inventory
                  disposition, expiry and genealogy.
                </Trans>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border px-2 py-1">
                <Trans>Feed items</Trans>: <span dir="ltr">{profiles.length}</span>
              </span>
              <span className="rounded-md border px-2 py-1">
                <Trans>Registered lots</Trans>: <span dir="ltr">{registeredLots.length}</span>
              </span>
              <span className="rounded-md border px-2 py-1">
                <Trans>Open feed tests</Trans>: <span dir="ltr">{openFeedTests}</span>
              </span>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader><CardTitle><Trans>Add Carbon item to feed domain</Trans></CardTitle></CardHeader>
          <CardContent>
            {candidateItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <Trans>All active Carbon items are already configured or no active items are available.</Trans>
              </p>
            ) : (
              <FeedItemProfileForm items={candidateItems} />
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader><CardTitle><Trans>Feed master & specifications</Trans></CardTitle></CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <Trans>No feed item profiles have been configured yet.</Trans>
              </p>
            ) : (
              <div className="grid gap-3">
                {profiles.map((profile) => {
                  const item = itemById[profile.itemId];
                  const itemSpecs = specsByItem[profile.itemId] ?? [];
                  return (
                    <details key={profile.itemId} className="rounded-lg border p-3 open:bg-muted/20">
                      <summary className="cursor-pointer list-none">
                        <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span>
                            <span className="font-medium">
                              <TechnicalText>{item?.readableIdWithRevision ?? profile.itemId}</TechnicalText>{" · "}
                              {item?.name ?? ""}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {profile.feedClass}
                              {profile.productionStage ? ` · ${profile.productionStage}` : ""}
                              {profile.physicalForm ? ` · ${profile.physicalForm}` : ""}
                              {item?.itemTrackingType ? ` · ${item.itemTrackingType}` : ""}
                            </span>
                          </span>
                          <span className="flex flex-wrap gap-2">
                            <span className="rounded border px-2 py-1 text-xs">
                              <span dir="ltr">{itemSpecs.length}</span> <Trans>specifications</Trans>
                            </span>
                            <Badge value={profile.status} />
                          </span>
                        </span>
                      </summary>
                      <div className="mt-4 grid gap-4 border-t pt-4">
                        <FeedItemProfileForm items={items} initial={profile} />
                        <div className="rounded-lg border p-3">
                          <div className="mb-3 font-medium"><Trans>Feed specification</Trans></div>
                          {itemSpecs.length > 0 ? (
                            <div className="mb-4 overflow-x-auto rounded-md border">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs">
                                  <tr>
                                    <th className="p-2 text-start"><Trans>Seq</Trans></th>
                                    <th className="p-2 text-start"><Trans>Parameter</Trans></th>
                                    <th className="p-2 text-start"><Trans>Basis</Trans></th>
                                    <th className="p-2 text-start"><Trans>Target / range</Trans></th>
                                    <th className="p-2 text-start"><Trans>Status</Trans></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {itemSpecs.map((specification) => (
                                    <tr key={specification.id} className="border-t">
                                      <td className="p-2" dir="ltr">{specification.sequenceNo}</td>
                                      <td className="p-2">
                                        <TechnicalText>{specification.code}</TechnicalText>{" · "}{specification.name}
                                      </td>
                                      <td className="p-2">{specification.basis}</td>
                                      <td className="p-2" dir="ltr">
                                        {specification.targetValue ?? "—"}
                                        {specification.unit ? ` ${specification.unit}` : ""}
                                        {specification.minimumValue != null || specification.maximumValue != null
                                          ? ` [${specification.minimumValue ?? "—"}–${specification.maximumValue ?? "—"}]`
                                          : ""}
                                      </td>
                                      <td className="p-2"><Badge value={specification.status} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="mb-4 text-sm text-muted-foreground">
                              <Trans>No feed specifications defined for this item.</Trans>
                            </p>
                          )}
                          <FeedSpecificationParameterForm
                            itemId={profile.itemId}
                            nextSequence={
                              Math.max(
                                0,
                                ...itemSpecs.map((specification) => Number(specification.sequenceNo) || 0)
                              ) + 1
                            }
                          />
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader><CardTitle><Trans>Carbon tracked feed lots</Trans></CardTitle></CardHeader>
          <CardContent>
            {lots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <Trans>No Carbon tracked entities exist yet for configured feed items. Receive or produce batch-tracked stock through Carbon first.</Trans>
              </p>
            ) : (
              <div className="grid gap-3">
                {lots.map((lot) => {
                  const item = itemById[lot.itemId];
                  const profile = profileByItem[lot.itemId];
                  const lotProfile = lotProfileById[lot.id];
                  const lotAccessions = accessionsByLot[lot.id] ?? [];
                  return (
                    <details key={lot.id} className="rounded-lg border p-3 open:bg-muted/20">
                      <summary className="cursor-pointer list-none">
                        <span className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <span>
                            <span className="font-medium">
                              <TechnicalText>{item?.readableIdWithRevision ?? lot.itemId}</TechnicalText>{" · "}
                              {item?.name ?? ""}{" · "}<TechnicalText>{lot.readableId ?? lot.id}</TechnicalText>
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {profile?.feedClass ?? "Feed"} · <Trans>Carbon quantity</Trans>{" "}
                              <span dir="ltr">{String(lot.quantity ?? "—")}</span>
                              {lot.expirationDate ? <> · <Trans>Expiry</Trans>{" "}<span dir="ltr">{lot.expirationDate}</span></> : null}
                            </span>
                          </span>
                          <span className="flex flex-wrap gap-2">
                            <Badge value={lot.status ?? "Unknown"} />
                            {lotProfile ? <Badge value={lotProfile.coaStatus} /> : null}
                            {lotProfile ? <Badge value={lotProfile.samplingStatus} /> : null}
                          </span>
                        </span>
                      </summary>
                      <div className="mt-4 grid gap-4 border-t pt-4">
                        <div className="rounded-lg border p-3">
                          <div className="mb-3 font-medium"><Trans>AVIOS lot QA metadata</Trans></div>
                          <FeedTrackedLotProfileForm lot={lot} initial={lotProfile} />
                        </div>

                        {lotProfile ? (
                          <div className="rounded-lg border p-3">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="font-medium"><Trans>Feed laboratory trace</Trans></div>
                              <span className="text-xs text-muted-foreground">
                                <span dir="ltr">{lotAccessions.length}</span> <Trans>accessions</Trans>
                              </span>
                            </div>
                            {lotAccessions.length > 0 ? (
                              <div className="mb-4 grid gap-2">
                                {lotAccessions.map((accession) => (
                                  <div key={accession.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <div className="font-medium"><TechnicalText>{accession.accessionNumber}</TechnicalText></div>
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        {accession.status} · {accession.priority} · <span dir="ltr">{accession.collectedAt}</span>
                                      </div>
                                    </div>
                                    <Button asChild size="sm" variant="secondary">
                                      <Link to={`/x/poultry/laboratories/${accession.id}`}><Trans>Open LIMS</Trans></Link>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mb-4 text-sm text-muted-foreground">
                                <Trans>No laboratory accession is linked to this feed lot yet.</Trans>
                              </p>
                            )}
                            <FeedLabAccessionForm
                              lot={lot}
                              laboratories={laboratories}
                              flocks={flocks}
                              defaultDateTime={defaultDateTime}
                            />
                          </div>
                        ) : (
                          <p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                            <Trans>Register AVIOS lot metadata before opening a feed laboratory accession.</Trans>
                          </p>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader><CardTitle><Trans>Traceability boundary</Trans></CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-pretty">
              <Trans>
                AVIOS does not create feed inventory movements here. Carbon item, trackedEntity,
                receipt, production, picking and itemLedger workflows remain authoritative. This
                layer records feed semantics, QA evidence and biological flock exposure while
                preserving Carbon genealogy.
              </Trans>
            </p>
          </CardContent>
        </Card>
      </VStack>
    </div>
  );
}
