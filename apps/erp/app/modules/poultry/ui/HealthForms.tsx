import { ValidatedForm } from "@carbon/form";
import { Button } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import {
  clinicalEventResolutionValidator,
  clinicalEventValidator,
  treatmentAdministrationValidator,
  treatmentCourseValidator,
  treatmentStatusValidator
} from "../health.models";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textAreaClass =
  "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type DiseaseOption = { id: string; code: string; name: string };
type DrugOption = {
  id: string;
  code: string;
  tradeName: string;
  activeIngredient?: string | null;
  defaultRoute?: string | null;
  status: string;
};
type ClinicalOption = { id: string; caseReference: string; title: string; status: string };

export function ClinicalEventForm({ diseases, defaultDateTime }: { diseases: DiseaseOption[]; defaultDateTime: string }) {
  return (
    <ValidatedForm validator={clinicalEventValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm"><span><Trans>Case reference</Trans></span><input name="caseReference" required dir="ltr" className={inputClass} placeholder="CASE-2026-001" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Observed at</Trans></span><input name="observedAtLocal" type="datetime-local" required dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Event type</Trans></span><select name="eventType" defaultValue="Clinical Observation" className={inputClass}><option value="Clinical Observation"><Trans>Clinical Observation</Trans></option><option value="Diagnosis"><Trans>Diagnosis</Trans></option><option value="Necropsy"><Trans>Necropsy</Trans></option><option value="Mortality Investigation"><Trans>Mortality Investigation</Trans></option><option value="Follow-up"><Trans>Follow-up</Trans></option><option value="Other"><Trans>Other</Trans></option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Body system</Trans></span><select name="bodySystem" defaultValue="Mixed" className={inputClass}><option value="Respiratory"><Trans>Respiratory</Trans></option><option value="Enteric"><Trans>Enteric</Trans></option><option value="Locomotor"><Trans>Locomotor</Trans></option><option value="Nervous"><Trans>Nervous</Trans></option><option value="Systemic"><Trans>Systemic</Trans></option><option value="Reproductive"><Trans>Reproductive</Trans></option><option value="Mixed"><Trans>Mixed</Trans></option><option value="Other"><Trans>Other</Trans></option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Severity</Trans></span><select name="severity" defaultValue="Moderate" className={inputClass}><option value="Mild"><Trans>Mild</Trans></option><option value="Moderate"><Trans>Moderate</Trans></option><option value="Severe"><Trans>Severe</Trans></option><option value="Critical"><Trans>Critical</Trans></option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Related disease</Trans></span><select name="diseaseId" defaultValue="" className={inputClass}><option value=""><Trans>Not assigned</Trans></option>{diseases.map((disease) => <option key={disease.id} value={disease.id}>{disease.code} — {disease.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Clinical title</Trans></span><input name="title" required className={inputClass} placeholder="Respiratory signs with increased mortality" /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Clinical signs</Trans></span><textarea name="clinicalSigns" className={textAreaClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Affected birds</Trans></span><input name="affectedBirdCount" type="number" min="0" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Mortality count</Trans></span><input name="mortalityCount" type="number" min="0" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Diagnosis role</Trans></span><select name="diagnosisRole" defaultValue="Suspected" className={inputClass}><option value="Suspected"><Trans>Suspected</Trans></option><option value="Confirmed"><Trans>Confirmed</Trans></option><option value="Differential"><Trans>Differential</Trans></option><option value="Ruled Out"><Trans>Ruled Out</Trans></option></select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createClinicalEvent"><Trans>Record clinical event</Trans></Button></div>
    </ValidatedForm>
  );
}

export function ClinicalEventResolutionForm({ eventId, defaultDateTime }: { eventId: string; defaultDateTime: string }) {
  return (
    <ValidatedForm validator={clinicalEventResolutionValidator} method="post" className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="grid gap-1 text-sm"><span><Trans>Case status</Trans></span><select name="status" defaultValue="Monitoring" className={inputClass}><option value="Monitoring"><Trans>Monitoring</Trans></option><option value="Resolved"><Trans>Resolved</Trans></option><option value="Closed"><Trans>Closed</Trans></option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Resolved at</Trans></span><input name="resolvedAtLocal" type="datetime-local" dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Resolution / follow-up</Trans></span><textarea name="resolution" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="resolveClinicalEvent" variant="secondary"><Trans>Update case</Trans></Button></div>
    </ValidatedForm>
  );
}

export function TreatmentCourseForm({ drugs, clinicalEvents, defaultDateTime }: { drugs: DrugOption[]; clinicalEvents: ClinicalOption[]; defaultDateTime: string }) {
  const activeDrugs = drugs.filter((drug) => drug.status === "Active");
  return (
    <ValidatedForm validator={treatmentCourseValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm"><span><Trans>Drug product</Trans></span><select name="drugId" required defaultValue="" className={inputClass}><option value=""><Trans>Select active drug</Trans></option>{activeDrugs.map((drug) => <option key={drug.id} value={drug.id}>{drug.code} — {drug.tradeName}{drug.activeIngredient ? ` (${drug.activeIngredient})` : ""}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Related clinical case</Trans></span><select name="clinicalEventId" defaultValue="" className={inputClass}><option value=""><Trans>No linked case</Trans></option>{clinicalEvents.map((event) => <option key={event.id} value={event.id}>{event.caseReference} — {event.title}</option>)}</select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Indication</Trans></span><input name="indication" required className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Prescribed at</Trans></span><input name="prescribedAtLocal" type="datetime-local" required dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Planned start</Trans></span><input name="plannedStartAtLocal" type="datetime-local" dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Planned end</Trans></span><input name="plannedEndAtLocal" type="datetime-local" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Route</Trans></span><input name="route" required className={inputClass} placeholder="Drinking Water" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Dose value</Trans></span><input name="doseValue" type="number" min="0.001" step="0.001" required dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Dose unit</Trans></span><input name="doseUnit" required dir="ltr" className={inputClass} placeholder="mg/kg BW" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Frequency</Trans></span><input name="frequency" required className={inputClass} placeholder="Once daily" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Prescribed by</Trans></span><input name="prescribedBy" className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createTreatmentCourse" disabled={activeDrugs.length === 0}><Trans>Create treatment course</Trans></Button></div>
    </ValidatedForm>
  );
}

export function TreatmentAdministrationForm({ course, defaultDateTime }: { course: Record<string, any>; defaultDateTime: string }) {
  return (
    <ValidatedForm validator={treatmentAdministrationValidator} method="post" className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
      <input type="hidden" name="courseId" value={course.id} />
      <label className="grid gap-1 text-sm"><span><Trans>Administered at</Trans></span><input name="administeredAtLocal" type="datetime-local" required dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Route</Trans></span><input name="route" required defaultValue={course.route} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Actual dose</Trans></span><input name="doseValue" type="number" min="0.001" step="0.001" required dir="ltr" defaultValue={course.doseValue ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Dose unit</Trans></span><input name="doseUnit" required dir="ltr" defaultValue={course.doseUnit ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Product batch</Trans></span><input name="productBatch" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Expiry date</Trans></span><input name="expiryDate" type="date" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Performed by</Trans></span><input name="performedBy" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Birds treated</Trans></span><input name="birdsTreated" type="number" min="1" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="recordTreatmentAdministration"><Trans>Record administration</Trans></Button></div>
    </ValidatedForm>
  );
}

export function TreatmentStatusForm({ courseId }: { courseId: string }) {
  return (
    <ValidatedForm validator={treatmentStatusValidator} method="post" className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr_auto]">
      <input type="hidden" name="courseId" value={courseId} />
      <select name="status" defaultValue="Completed" className={inputClass}><option value="Completed"><Trans>Completed</Trans></option><option value="Stopped"><Trans>Stopped</Trans></option><option value="Cancelled"><Trans>Cancelled</Trans></option></select>
      <input name="outcome" className={inputClass} placeholder="Outcome / response" />
      <Button type="submit" name="_intent" value="updateTreatmentStatus" variant="secondary"><Trans>Update course</Trans></Button>
    </ValidatedForm>
  );
}
