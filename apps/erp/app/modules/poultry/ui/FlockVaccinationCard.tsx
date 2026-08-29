import { Card, CardContent, CardHeader, CardTitle } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import TechnicalText from "./TechnicalText";
import {
  VaccinationAssignmentForm,
  VaccinationEventCompletionForm,
  VaccinationEventSkipForm
} from "./VaccinationForms";

type FlockVaccinationCardProps = {
  flockType: string;
  programs: Record<string, any>[];
  assignments: Record<string, any>[];
  events: Record<string, any>[];
  eventDiseases: Record<string, any>[];
  diseases: Record<string, any>[];
  vaccines: Record<string, any>[];
};

export default function FlockVaccinationCard({
  flockType,
  programs,
  assignments,
  events,
  eventDiseases,
  diseases,
  vaccines
}: FlockVaccinationCardProps) {
  const programById = Object.fromEntries(programs.map((item) => [item.id, item]));
  const diseaseById = Object.fromEntries(diseases.map((item) => [item.id, item]));
  const vaccineById = Object.fromEntries(vaccines.map((item) => [item.id, item]));
  const diseaseIdsByEvent = eventDiseases.reduce<Record<string, string[]>>((map, item) => {
    (map[item.eventId] ??= []).push(item.diseaseId);
    return map;
  }, {});
  const eligiblePrograms = programs.filter(
    (program) => program.flockType === flockType || program.flockType === "Other"
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle><Trans>Vaccination schedule</Trans></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <p className="mb-3 text-sm text-muted-foreground"><Trans>Assign an active reusable program. AVIOS snapshots its current steps into this flock so future program edits do not rewrite flock history.</Trans></p>
            {eligiblePrograms.some((program) => program.status === "Active") ? (
              <VaccinationAssignmentForm programs={eligiblePrograms} />
            ) : (
              <p className="rounded-lg border p-3 text-sm text-muted-foreground"><Trans>No active vaccination program matches this flock type. Create and activate one from Vaccination Center.</Trans></p>
            )}
          </div>

          {assignments.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {assignments.map((assignment) => {
                const program = programById[assignment.programId];
                return (
                  <span key={assignment.id} className="rounded-md border px-2 py-1 text-xs">
                    {program ? <><TechnicalText>{program.code}</TechnicalText> · {program.name}</> : assignment.programId} · {assignment.status}
                  </span>
                );
              })}
            </div>
          ) : null}

          <div className="border-t pt-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground"><Trans>No vaccination schedule has been generated for this flock yet.</Trans></p>
            ) : (
              <div className="grid gap-3">
                {events.map((event) => {
                  const diseaseIds = diseaseIdsByEvent[event.id] ?? [];
                  const vaccine = event.vaccineId ? vaccineById[event.vaccineId] : null;
                  const overdue = event.status === "Planned" && event.scheduledDate < today;
                  return (
                    <details key={event.id} className="rounded-lg border p-3 open:bg-muted/20">
                      <summary className="cursor-pointer list-none">
                        <span className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <span>
                            <span className="font-medium"><span dir="ltr" className="tabular-nums">{event.scheduledDate}</span> · {event.route}</span>
                            <span className="mt-1 flex flex-wrap gap-1">
                              {diseaseIds.map((diseaseId) => (
                                <span key={diseaseId} className="rounded border px-1.5 py-0.5 text-xs">
                                  <TechnicalText>{diseaseById[diseaseId]?.code ?? diseaseId}</TechnicalText>
                                </span>
                              ))}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {overdue ? <Trans>Overdue</Trans> : event.status}
                            {vaccine ? <> · <TechnicalText>{vaccine.code}</TechnicalText></> : null}
                          </span>
                        </span>
                      </summary>

                      {event.status === "Completed" ? (
                        <div className="mt-3 grid grid-cols-1 gap-2 rounded-md border bg-background p-3 text-sm sm:grid-cols-2">
                          <div><span className="text-muted-foreground"><Trans>Actual vaccine</Trans>: </span>{vaccine ? <>{vaccine.tradeName} · <TechnicalText>{vaccine.code}</TechnicalText></> : "—"}</div>
                          <div><span className="text-muted-foreground"><Trans>Administered</Trans>: </span><span dir="ltr">{event.administeredAt ?? "—"}</span></div>
                          <div><span className="text-muted-foreground"><Trans>Batch</Trans>: </span><TechnicalText>{event.productBatch ?? "—"}</TechnicalText></div>
                          <div><span className="text-muted-foreground"><Trans>Performed by</Trans>: </span>{event.performedBy ?? "—"}</div>
                          {event.notes ? <div className="sm:col-span-2"><span className="text-muted-foreground"><Trans>Notes</Trans>: </span>{event.notes}</div> : null}
                        </div>
                      ) : event.status === "Planned" ? (
                        <div className="mt-3 border-t pt-3">
                          <VaccinationEventCompletionForm event={event} vaccines={vaccines} />
                          <VaccinationEventSkipForm eventId={event.id} />
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">{event.notes || event.status}</p>
                      )}
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
