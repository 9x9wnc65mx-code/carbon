import { Button, Card, CardContent, CardHeader, CardTitle } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import { Link } from "react-router";
import TechnicalText from "./TechnicalText";

type Laboratory = {
  id: string;
  code: string;
  name: string;
};

type Accession = {
  id: string;
  accessionNumber: string;
  laboratoryId: string;
  sourceType: string;
  priority: string;
  status: string;
  collectedAt: string;
  sourceTimeZone: string;
};

function StatusBadge({ value }: { value: string }) {
  const completed = ["Completed", "Received"].includes(value);
  const attention = ["Urgent", "STAT", "In Progress", "Collected", "In Transit"].includes(value);
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs ${
        completed
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          : attention
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
            : "text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}

export default function FlockLaboratoryCard({
  laboratories,
  accessions
}: {
  laboratories: Laboratory[];
  accessions: Accession[];
}) {
  const laboratoryById = Object.fromEntries(
    laboratories.map((laboratory) => [laboratory.id, laboratory])
  );
  const openCount = accessions.filter(
    (accession) =>
      !["Completed", "Rejected", "Cancelled"].includes(accession.status)
  ).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <Trans>Laboratory trace</Trans>
            <span className="text-xs font-normal text-muted-foreground">
              <span dir="ltr" className="tabular-nums">
                {accessions.length}
              </span>{" "}
              <Trans>accessions</Trans>
              {openCount > 0 ? (
                <>
                  {" · "}
                  <span dir="ltr" className="tabular-nums">
                    {openCount}
                  </span>{" "}
                  <Trans>open</Trans>
                </>
              ) : null}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accessions.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              <Trans>
                No laboratory accessions are linked to this flock yet. Samples
                created from the Laboratory Center will appear here as part of
                the flock digital thread.
              </Trans>
            </p>
            <div>
              <Button asChild variant="secondary" size="sm">
                <Link to="/x/poultry/laboratories">
                  <Trans>Open Laboratory Center</Trans>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {accessions.map((accession) => {
              const laboratory = laboratoryById[accession.laboratoryId];
              return (
                <div
                  key={accession.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        <TechnicalText>
                          {accession.accessionNumber}
                        </TechnicalText>
                      </span>
                      <StatusBadge value={accession.status} />
                      <StatusBadge value={accession.priority} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {laboratory ? (
                        <>
                          <TechnicalText>{laboratory.code}</TechnicalText>
                          {" · "}
                          {laboratory.name}
                        </>
                      ) : (
                        <TechnicalText>{accession.laboratoryId}</TechnicalText>
                      )}
                      {" · "}
                      {accession.sourceType}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span dir="ltr" className="tabular-nums">
                        {accession.collectedAt}
                      </span>
                      {" · "}
                      <TechnicalText>{accession.sourceTimeZone}</TechnicalText>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/x/poultry/laboratories/${accession.id}`}>
                      <Trans>Open results</Trans>
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
