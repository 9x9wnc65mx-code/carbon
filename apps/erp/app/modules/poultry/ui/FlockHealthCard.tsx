import { Card, CardContent, CardHeader, CardTitle } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import { formatFarmDateTime } from "../health.time";
import TechnicalText from "./TechnicalText";
import {
  ClinicalEventForm,
  ClinicalEventResolutionForm,
  TreatmentAdministrationForm,
  TreatmentCourseForm,
  TreatmentStatusForm
} from "./HealthForms";

type FlockHealthCardProps = {
  timeZone: string;
  defaultDateTime: string;
  clinicalEvents: Record<string, any>[];
  clinicalEventDiseases: Record<string, any>[];
  diseases: Record<string, any>[];
  treatments: Record<string, any>[];
  administrations: Record<string, any>[];
  drugs: Record<string, any>[];
};

function WithdrawalBadge({
  label,
  until,
  unknown,
  notStarted,
  timeZone
}: {
  label: ReactNode;
  until?: string | null;
  unknown?: boolean;
  notStarted?: boolean;
  timeZone: string;
}) {
  const active = Boolean(until && new Date(until).getTime() > Date.now());
  const warning = Boolean(unknown || active);
  return (
    <span className={`rounded-md border px-2 py-1 text-xs ${warning ? "border-amber-500/50 bg-amber-500/10 text-amber-700" : "text-muted-foreground"}`}>
      {label}: {unknown ? <Trans>Unknown</Trans> : active ? formatFarmDateTime(until, timeZone) : notStarted ? <Trans>Not started</Trans> : <Trans>Clear</Trans>}
    </span>
  );
}

export default function FlockHealthCard({
  timeZone,
  defaultDateTime,
  clinicalEvents,
  clinicalEventDiseases,
  diseases,
  treatments,
  administrations,
  drugs
}: FlockHealthCardProps) {
  const diseaseById = Object.fromEntries(diseases.map((item) => [item.id, item]));
  const diseaseLinksByEvent = clinicalEventDiseases.reduce<Record<string, Record<string, any>[]>>((map, item) => {
    (map[item.clinicalEventId] ??= []).push(item);
    return map;
  }, {});
  const administrationsByCourse = administrations.reduce<Record<string, Record<string, any>[]>>((map, item) => {
    (map[item.courseId] ??= []).push(item);
    return map;
  }, {});

  const activeMeatHold = treatments.map((course) => course.meatWithdrawalUntil).filter(Boolean).sort().at(-1);
  const activeEggHold = treatments.map((course) => course.eggWithdrawalUntil).filter(Boolean).sort().at(-1);
  const unknownMeatWithdrawal = treatments.some((course) => course.lastAdministrationAt && course.meatWithdrawalDaysSnapshot == null);
  const unknownEggWithdrawal = treatments.some((course) => course.lastAdministrationAt && course.eggWithdrawalDaysSnapshot == null);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle><Trans>Clinical health & treatments</Trans></CardTitle>
          <div className="flex flex-wrap gap-2">
            <WithdrawalBadge label={<Trans>Meat withdrawal</Trans>} until={activeMeatHold} unknown={unknownMeatWithdrawal} timeZone={timeZone} />
            <WithdrawalBadge label={<Trans>Egg withdrawal</Trans>} until={activeEggHold} unknown={unknownEggWithdrawal} timeZone={timeZone} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground"><Trans>All operational times are interpreted using the farm timezone and persisted as UTC.</Trans> <TechnicalText>{timeZone}</TechnicalText></p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium"><Trans>Record clinical event</Trans></summary>
            <div className="mt-4"><ClinicalEventForm diseases={diseases} defaultDateTime={defaultDateTime} /></div>
          </details>

          <section className="grid gap-3">
            <div className="flex items-center justify-between"><h3 className="font-medium"><Trans>Clinical cases</Trans></h3><span className="text-xs text-muted-foreground">{clinicalEvents.length}</span></div>
            {clinicalEvents.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No clinical events recorded for this flock.</Trans></p> : clinicalEvents.map((event) => {
              const links = diseaseLinksByEvent[event.id] ?? [];
              return (
                <details key={event.id} className="rounded-lg border p-3 open:bg-muted/20">
                  <summary className="cursor-pointer list-none">
                    <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <span>
                        <span className="font-medium"><TechnicalText>{event.caseReference}</TechnicalText> · {event.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{formatFarmDateTime(event.observedAt, timeZone)} · {event.bodySystem} · {event.severity}</span>
                      </span>
                      <span className="rounded border px-2 py-1 text-xs">{event.status}</span>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-2 text-sm">
                    {event.clinicalSigns ? <p>{event.clinicalSigns}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      {links.map((link) => <span key={`${event.id}-${link.diseaseId}`} className="rounded border px-2 py-1 text-xs"><TechnicalText>{diseaseById[link.diseaseId]?.code ?? link.diseaseId}</TechnicalText> · {link.diagnosisRole}</span>)}
                      {event.affectedBirdCount != null ? <span className="rounded border px-2 py-1 text-xs"><Trans>Affected birds</Trans>: {event.affectedBirdCount}</span> : null}
                      {event.mortalityCount != null ? <span className="rounded border px-2 py-1 text-xs"><Trans>Mortality</Trans>: {event.mortalityCount}</span> : null}
                    </div>
                    {event.resolution ? <p className="rounded-md border bg-background p-2 text-muted-foreground">{event.resolution}</p> : null}
                    {event.status === "Open" || event.status === "Monitoring" ? <ClinicalEventResolutionForm eventId={event.id} defaultDateTime={defaultDateTime} /> : null}
                  </div>
                </details>
              );
            })}
          </section>

          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium"><Trans>Create treatment course</Trans></summary>
            <div className="mt-4"><TreatmentCourseForm drugs={drugs} clinicalEvents={clinicalEvents} defaultDateTime={defaultDateTime} /></div>
          </details>

          <section className="grid gap-3">
            <div className="flex items-center justify-between"><h3 className="font-medium"><Trans>Treatment courses</Trans></h3><span className="text-xs text-muted-foreground">{treatments.length}</span></div>
            {treatments.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No treatment courses recorded for this flock.</Trans></p> : treatments.map((course) => {
              const courseAdministrations = administrationsByCourse[course.id] ?? [];
              const hasAdministration = courseAdministrations.length > 0;
              return (
                <details key={course.id} className="rounded-lg border p-3 open:bg-muted/20">
                  <summary className="cursor-pointer list-none">
                    <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <span>
                        <span className="font-medium">{course.drugTradeNameSnapshot}</span>
                        {course.activeIngredientSnapshot ? <span className="ms-2 text-sm text-muted-foreground"><TechnicalText>{course.activeIngredientSnapshot}</TechnicalText></span> : null}
                        <span className="mt-1 block text-xs text-muted-foreground">{course.indication} · {course.route}{course.frequency ? ` · ${course.frequency}` : ""}</span>
                      </span>
                      <span className="rounded border px-2 py-1 text-xs">{course.status}</span>
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-3">
                    <div className="flex flex-wrap gap-2">
                      <WithdrawalBadge label={<Trans>Meat</Trans>} until={course.meatWithdrawalUntil} unknown={hasAdministration && course.meatWithdrawalDaysSnapshot == null} notStarted={!hasAdministration} timeZone={timeZone} />
                      <WithdrawalBadge label={<Trans>Egg</Trans>} until={course.eggWithdrawalUntil} unknown={hasAdministration && course.eggWithdrawalDaysSnapshot == null} notStarted={!hasAdministration} timeZone={timeZone} />
                      <span className="rounded border px-2 py-1 text-xs"><Trans>Administrations</Trans>: {courseAdministrations.length}</span>
                      {course.lastAdministrationAt ? <span className="rounded border px-2 py-1 text-xs"><Trans>Last administration</Trans>: {formatFarmDateTime(course.lastAdministrationAt, timeZone)}</span> : null}
                    </div>
                    {courseAdministrations.length > 0 ? (
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-start text-xs"><tr><th className="p-2 text-start"><Trans>Date</Trans></th><th className="p-2 text-start"><Trans>Dose</Trans></th><th className="p-2 text-start"><Trans>Batch</Trans></th><th className="p-2 text-start"><Trans>Performed by</Trans></th></tr></thead>
                          <tbody>{courseAdministrations.map((administration) => <tr key={administration.id} className="border-t"><td className="p-2 whitespace-nowrap">{formatFarmDateTime(administration.administeredAt, timeZone)}</td><td className="p-2"><span dir="ltr">{administration.doseValue ?? "—"} {administration.doseUnit ?? ""}</span></td><td className="p-2"><TechnicalText>{administration.productBatch ?? "—"}</TechnicalText></td><td className="p-2">{administration.performedBy ?? "—"}</td></tr>)}</tbody>
                        </table>
                      </div>
                    ) : null}
                    {course.status === "Planned" || course.status === "Active" ? <TreatmentAdministrationForm course={course} defaultDateTime={defaultDateTime} /> : null}
                    {course.status === "Active" || (course.status === "Planned" && courseAdministrations.length > 0) ? <TreatmentStatusForm courseId={course.id} /> : null}
                  </div>
                </details>
              );
            })}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
