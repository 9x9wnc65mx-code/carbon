import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { now } from "@internationalized/date";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, redirect, useLoaderData } from "react-router";
import {
  assignVaccinationProgram,
  clinicalEventResolutionValidator,
  clinicalEventValidator,
  completeFlockVaccinationEvent,
  createFlockClinicalEvent,
  createFlockTreatmentCourse,
  flockCycleValidator,
  getDiseaseCatalog,
  getDrugCatalog,
  getFarm,
  getFarms,
  getFlockClinicalEventDiseases,
  getFlockClinicalEvents,
  getFlockCycle,
  getFlockTreatmentAdministrations,
  getFlockTreatmentCourses,
  getFlockVaccinationAssignments,
  getFlockVaccinationEventDiseases,
  getFlockVaccinationEvents,
  getLaboratories,
  getLabAccessions,
  getPoultryHouse,
  getPoultryHouses,
  getVaccinationPrograms,
  getVaccineCatalog,
  recordFlockTreatmentAdministration,
  resolveFlockClinicalEvent,
  skipFlockVaccinationEvent,
  treatmentAdministrationValidator,
  treatmentCourseValidator,
  treatmentStatusValidator,
  updateFlockCycle,
  updateFlockTreatmentStatus,
  utcDateTimeToFarmLocal,
  vaccinationAssignmentValidator,
  vaccinationEventCompletionValidator,
  vaccinationEventSkipValidator
} from "~/modules/poultry";
import FlockHealthCard from "~/modules/poultry/ui/FlockHealthCard";
import FlockLaboratoryCard from "~/modules/poultry/ui/FlockLaboratoryCard";
import FlockVaccinationCard from "~/modules/poultry/ui/FlockVaccinationCard";
import { FlockForm } from "~/modules/poultry/ui/PoultryRegistryForm";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";

async function getFlockTimeZone(client: any, companyId: string, flockId: string) {
  const flock = await getFlockCycle(client, companyId, flockId);
  if (!flock.data) return "UTC";
  const house = await getPoultryHouse(client, companyId, flock.data.houseId);
  if (!house.data) return "UTC";
  const farm = await getFarm(client, companyId, house.data.farmId);
  return farm.data?.timezone ?? "UTC";
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  if (!params.flockId) throw new Response("Flock not found", { status: 404 });

  const flock = await getFlockCycle(client, companyId, params.flockId);
  if (flock.error || !flock.data) throw new Response("Flock not found", { status: 404 });

  const [
    house,
    farms,
    houses,
    vaccinationPrograms,
    vaccinationAssignments,
    vaccinationEvents,
    vaccinationEventDiseases,
    diseases,
    vaccines,
    drugs,
    clinicalEvents,
    clinicalEventDiseases,
    treatmentCourses,
    treatmentAdministrations,
    laboratories,
    labAccessions
  ] = await Promise.all([
    getPoultryHouse(client, companyId, flock.data.houseId),
    getFarms(client, companyId),
    getPoultryHouses(client, companyId),
    getVaccinationPrograms(client, companyId),
    getFlockVaccinationAssignments(client, companyId, flock.data.id),
    getFlockVaccinationEvents(client, companyId, flock.data.id),
    getFlockVaccinationEventDiseases(client, companyId),
    getDiseaseCatalog(client, companyId),
    getVaccineCatalog(client, companyId),
    getDrugCatalog(client, companyId),
    getFlockClinicalEvents(client, companyId, flock.data.id),
    getFlockClinicalEventDiseases(client, companyId, flock.data.id),
    getFlockTreatmentCourses(client, companyId, flock.data.id),
    getFlockTreatmentAdministrations(client, companyId, flock.data.id),
    getLaboratories(client, companyId),
    getLabAccessions(client, companyId, { flockId: flock.data.id })
  ]);
  const farm = house.data
    ? await getFarm(client, companyId, house.data.farmId)
    : { data: null };
  const timeZone = farm.data?.timezone ?? "UTC";

  return {
    flock: flock.data,
    house: house.data,
    farm: farm.data,
    farms: farms.data ?? [],
    houses: houses.data ?? [],
    vaccinationPrograms: vaccinationPrograms.data ?? [],
    vaccinationAssignments: vaccinationAssignments.data ?? [],
    vaccinationEvents: vaccinationEvents.data ?? [],
    vaccinationEventDiseases: vaccinationEventDiseases.data ?? [],
    diseases: diseases.data ?? [],
    vaccines: vaccines.data ?? [],
    drugs: drugs.data ?? [],
    clinicalEvents: clinicalEvents.data ?? [],
    clinicalEventDiseases: clinicalEventDiseases.data ?? [],
    treatmentCourses: treatmentCourses.data ?? [],
    treatmentAdministrations: treatmentAdministrations.data ?? [],
    laboratories: laboratories.data ?? [],
    labAccessions: labAccessions.data ?? [],
    timeZone,
    defaultDateTime: utcDateTimeToFarmLocal(
      now("UTC").toAbsoluteString(),
      timeZone
    )
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  if (!params.flockId) throw new Response("Flock not found", { status: 404 });
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "updateFlock") {
    const { client, companyId, userId } = await requirePermissions(request, {
      update: "production"
    });
    const validation = await validator(flockCycleValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await updateFlockCycle(client, params.flockId, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to update flock")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Flock passport updated")));
  }

  if (intent === "assignVaccinationProgram") {
    const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
    const validation = await validator(vaccinationAssignmentValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await assignVaccinationProgram(client, { flockId: params.flockId, ...validation.data }, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to assign vaccination program")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Vaccination program assigned and schedule generated")));
  }

  if (intent === "completeVaccinationEvent") {
    const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
    const validation = await validator(vaccinationEventCompletionValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await completeFlockVaccinationEvent(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to record vaccination administration")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Vaccination administration recorded")));
  }

  if (intent === "skipVaccinationEvent") {
    const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
    const validation = await validator(vaccinationEventSkipValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await skipFlockVaccinationEvent(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to skip vaccination event")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Vaccination event marked as skipped")));
  }

  if (intent === "createClinicalEvent") {
    const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
    const validation = await validator(clinicalEventValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const timeZone = await getFlockTimeZone(client, companyId, params.flockId);
    const result = await createFlockClinicalEvent(client, params.flockId, validation.data, { companyId, userId, timeZone });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to record clinical event")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Clinical event recorded")));
  }

  if (intent === "resolveClinicalEvent") {
    const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
    const validation = await validator(clinicalEventResolutionValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const timeZone = await getFlockTimeZone(client, companyId, params.flockId);
    const result = await resolveFlockClinicalEvent(client, validation.data, { companyId, userId, timeZone });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to update clinical case")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Clinical case updated")));
  }

  if (intent === "createTreatmentCourse") {
    const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
    const validation = await validator(treatmentCourseValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const timeZone = await getFlockTimeZone(client, companyId, params.flockId);
    const result = await createFlockTreatmentCourse(client, params.flockId, validation.data, { companyId, userId, timeZone });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to create treatment course")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Treatment course created")));
  }

  if (intent === "recordTreatmentAdministration") {
    const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
    const validation = await validator(treatmentAdministrationValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const timeZone = await getFlockTimeZone(client, companyId, params.flockId);
    const result = await recordFlockTreatmentAdministration(client, params.flockId, validation.data, { companyId, userId, timeZone });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to record treatment administration")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Treatment administration recorded and withdrawal recalculated")));
  }

  if (intent === "updateTreatmentStatus") {
    const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
    const validation = await validator(treatmentStatusValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await updateFlockTreatmentStatus(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to update treatment course")));
    throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Treatment course updated")));
  }

  return data({}, await flash(request, error(null, "Unsupported flock action")));
}

function PassportItem({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

export default function FlockDigitalPassportRoute() {
  const {
    flock,
    house,
    farm,
    farms,
    houses,
    vaccinationPrograms,
    vaccinationAssignments,
    vaccinationEvents,
    vaccinationEventDiseases,
    diseases,
    vaccines,
    drugs,
    clinicalEvents,
    clinicalEventDiseases,
    treatmentCourses,
    treatmentAdministrations,
    laboratories,
    labAccessions,
    timeZone,
    defaultDateTime
  } = useLoaderData<typeof loader>();
  const farmById = Object.fromEntries(farms.map((item) => [item.id, item]));
  const houseOptions = houses.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    farmName: farmById[item.farmId]?.name
  }));

  return (
    <>
      <Link to="/x/poultry/flocks" aria-label="Close flock passport" className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px]" />
      <aside className="fixed inset-y-0 end-0 z-50 w-full max-w-4xl overflow-y-auto border-s bg-background p-4 shadow-xl md:p-6">
        <VStack spacing={4}>
          <div className="flex w-full items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground"><Trans>Flock Digital Passport</Trans></p>
              <h2 className="mt-1 text-xl font-semibold"><TechnicalText>{flock.code}</TechnicalText></h2>
              <p className="mt-1 text-sm text-muted-foreground">{flock.status} · {flock.flockType}{flock.strain ? <>{" · "}<TechnicalText>{flock.strain}</TechnicalText></> : null}</p>
            </div>
            <Button asChild variant="secondary" size="sm"><Link to="/x/poultry/flocks"><Trans>Close</Trans></Link></Button>
          </div>

          <Card className="w-full">
            <CardHeader><CardTitle><Trans>Identity & provenance</Trans></CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PassportItem label={<Trans>Farm</Trans>}>{farm ? <>{farm.name} · <TechnicalText>{farm.code}</TechnicalText></> : "—"}</PassportItem>
                <PassportItem label={<Trans>House</Trans>}>{house ? <>{house.name} · <TechnicalText>{house.code}</TechnicalText></> : "—"}</PassportItem>
                <PassportItem label={<Trans>Placement date</Trans>}><span dir="ltr" className="tabular-nums">{flock.placementDate}</span></PassportItem>
                <PassportItem label={<Trans>Initial birds</Trans>}><span dir="ltr" className="tabular-nums">{flock.initialBirdCount.toLocaleString()}</span></PassportItem>
                <PassportItem label={<Trans>Hatch date</Trans>}><span dir="ltr" className="tabular-nums">{flock.hatchDate || "—"}</span></PassportItem>
                <PassportItem label={<Trans>Sex</Trans>}>{flock.sex}</PassportItem>
                <PassportItem label={<Trans>Farm timezone</Trans>}><TechnicalText>{timeZone}</TechnicalText></PassportItem>
                <PassportItem label={<Trans>Source reference</Trans>}>{flock.sourceReference ? <TechnicalText>{flock.sourceReference}</TechnicalText> : "—"}</PassportItem>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader><CardTitle><Trans>Digital thread</Trans></CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PassportItem label={<Trans>Chick / hatchery origin</Trans>}><span className="text-muted-foreground"><Trans>Ready for origin lot linkage</Trans></span></PassportItem>
                <PassportItem label={<Trans>Feed exposure</Trans>}><span className="text-muted-foreground"><Trans>Ready for feed lot genealogy</Trans></span></PassportItem>
                <PassportItem label={<Trans>Health & vaccination</Trans>}><span className="text-emerald-600"><Trans>Clinical, treatment and vaccination workflows active</Trans></span></PassportItem>
                <PassportItem label={<Trans>Laboratory</Trans>}><span className="text-emerald-600"><Trans>Sample accession and verified-result traceability active</Trans></span></PassportItem>
                <PassportItem label={<Trans>Slaughter & quality</Trans>}><span className="text-muted-foreground"><Trans>Ready for downstream outcome linkage</Trans></span></PassportItem>
              </div>
              <p className="mt-3 text-xs text-muted-foreground"><Trans>The passport is a read model over the flock identity and linked domains; it does not duplicate genealogy data.</Trans></p>
            </CardContent>
          </Card>

          <FlockVaccinationCard flockType={flock.flockType} programs={vaccinationPrograms} assignments={vaccinationAssignments} events={vaccinationEvents} eventDiseases={vaccinationEventDiseases} diseases={diseases} vaccines={vaccines} />

          <FlockHealthCard timeZone={timeZone} defaultDateTime={defaultDateTime} clinicalEvents={clinicalEvents} clinicalEventDiseases={clinicalEventDiseases} diseases={diseases} treatments={treatmentCourses} administrations={treatmentAdministrations} drugs={drugs} />

          <FlockLaboratoryCard laboratories={laboratories} accessions={labAccessions} />

          <Card className="w-full">
            <CardHeader><CardTitle><Trans>Edit flock identity</Trans></CardTitle></CardHeader>
            <CardContent><FlockForm houses={houseOptions} initial={flock} intent="updateFlock" submitLabel={<Trans>Save flock</Trans>} /></CardContent>
          </Card>
        </VStack>
      </aside>
    </>
  );
}
