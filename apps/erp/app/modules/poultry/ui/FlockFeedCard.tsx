import { Button, Card, CardContent, CardHeader, CardTitle } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import { Link } from "react-router";
import { FlockFeedExposureForm } from "./FeedForms";
import TechnicalText from "./TechnicalText";

type CarbonItem = {
  id: string;
  name: string;
  readableIdWithRevision?: string | null;
  itemTrackingType?: string | null;
};

type CarbonLot = {
  id: string;
  itemId: string;
  readableId?: string | null;
  quantity?: number | string | null;
  status?: string | null;
  expirationDate?: string | null;
};

type FeedLotProfile = {
  trackedEntityId: string;
  itemId: string;
  supplierLotNumber?: string | null;
  millBatchNumber?: string | null;
  coaReference?: string | null;
  coaStatus: string;
  samplingStatus: string;
};

type FeedExposure = {
  id: string;
  trackedEntityId: string;
  itemId: string;
  exposureType: string;
  startedAt: string;
  endedAt?: string | null;
  quantity?: number | string | null;
  quantityUnit?: string | null;
  documentReference?: string | null;
  sourceLocation?: string | null;
};

type LabAccession = {
  id: string;
  trackedEntityId?: string | null;
  accessionNumber: string;
  status: string;
};

function Badge({ value }: { value: string }) {
  const positive = ["Available", "Accepted", "Completed"].includes(value);
  const warning = ["On Hold", "Pending", "Sampled", "Testing"].includes(value);
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

export default function FlockFeedCard({
  items,
  lots,
  lotProfiles,
  exposures,
  accessions,
  defaultDateTime
}: {
  items: CarbonItem[];
  lots: CarbonLot[];
  lotProfiles: FeedLotProfile[];
  exposures: FeedExposure[];
  accessions: LabAccession[];
  defaultDateTime: string;
}) {
  const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
  const lotById = Object.fromEntries(lots.map((lot) => [lot.id, lot]));
  const profileByLot = Object.fromEntries(
    lotProfiles.map((profile) => [profile.trackedEntityId, profile])
  );
  const accessionCountByLot = accessions.reduce<Record<string, number>>(
    (map, accession) => {
      if (accession.trackedEntityId) {
        map[accession.trackedEntityId] =
          (map[accession.trackedEntityId] ?? 0) + 1;
      }
      return map;
    },
    {}
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle><Trans>Feed exposure & lot genealogy</Trans></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-3xl text-sm text-muted-foreground text-pretty">
            <Trans>
              Record which Carbon batch-tracked feed lots reached this flock. AVIOS stores the
              biological exposure only; Carbon remains authoritative for inventory quantity,
              lot status, expiry and upstream/downstream genealogy.
            </Trans>
          </p>
          <Button asChild size="sm" variant="secondary">
            <Link to="/x/poultry/feed"><Trans>Open Feed Center</Trans></Link>
          </Button>
        </div>

        {exposures.length === 0 ? (
          <p className="mt-4 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
            <Trans>No feed lot exposure has been recorded for this flock yet.</Trans>
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {exposures.map((exposure) => {
              const lot = lotById[exposure.trackedEntityId];
              const item = itemById[exposure.itemId];
              const profile = profileByLot[exposure.trackedEntityId];
              return (
                <div key={exposure.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-medium">
                        <TechnicalText>
                          {item?.readableIdWithRevision ?? exposure.itemId}
                        </TechnicalText>{" · "}
                        {item?.name ?? ""}{" · "}
                        <TechnicalText>
                          {lot?.readableId ?? exposure.trackedEntityId}
                        </TechnicalText>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {exposure.exposureType}{" · "}
                        <span dir="ltr">{exposure.startedAt}</span>
                        {exposure.endedAt ? <>{" → "}<span dir="ltr">{exposure.endedAt}</span></> : null}
                        {exposure.quantity != null ? (
                          <>{" · "}<span dir="ltr">{String(exposure.quantity)} {exposure.quantityUnit ?? ""}</span></>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {profile?.supplierLotNumber ? <><Trans>Supplier lot</Trans>{" "}<TechnicalText>{profile.supplierLotNumber}</TechnicalText>{" · "}</> : null}
                        {profile?.millBatchNumber ? <><Trans>Mill batch</Trans>{" "}<TechnicalText>{profile.millBatchNumber}</TechnicalText>{" · "}</> : null}
                        <Trans>Linked LIMS accessions</Trans>{": "}
                        <span dir="ltr">{accessionCountByLot[exposure.trackedEntityId] ?? 0}</span>
                      </div>
                      {exposure.documentReference || exposure.sourceLocation ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {exposure.documentReference ? <TechnicalText>{exposure.documentReference}</TechnicalText> : null}
                          {exposure.documentReference && exposure.sourceLocation ? " · " : ""}
                          {exposure.sourceLocation ?? ""}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lot?.status ? <Badge value={lot.status} /> : null}
                      {profile ? <Badge value={profile.coaStatus} /> : null}
                      {profile ? <Badge value={profile.samplingStatus} /> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span><Trans>Carbon quantity</Trans>{": "}<span dir="ltr">{String(lot?.quantity ?? "—")}</span></span>
                    <span><Trans>Expiry</Trans>{": "}<span dir="ltr">{lot?.expirationDate ?? "—"}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <details className="mt-4 rounded-lg border p-3">
          <summary className="cursor-pointer font-medium">
            <Trans>Record feed lot exposure</Trans>
          </summary>
          <div className="mt-4">
            <FlockFeedExposureForm
              lots={lots}
              lotProfiles={lotProfiles}
              items={items}
              defaultDateTime={defaultDateTime}
            />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
