import { ValidatedForm } from "@carbon/form";
import { Button } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import {
  diseaseCatalogValidator,
  drugCatalogValidator,
  vaccinationAssignmentValidator,
  vaccinationEventCompletionValidator,
  vaccinationEventSkipValidator,
  vaccinationProgramStepDiseaseValidator,
  vaccinationProgramStepValidator,
  vaccinationProgramValidator,
  vaccineCatalogValidator,
  vaccineDiseaseTargetValidator
} from "../vaccination.models";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textAreaClass =
  "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type DiseaseOption = { id: string; code: string; name: string };
type VaccineOption = { id: string; code: string; tradeName: string; defaultRoute?: string | null };
type ProgramOption = { id: string; code: string; name: string; flockType: string; status: string };

export function DiseaseCatalogForm() {
  return (
    <ValidatedForm validator={diseaseCatalogValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm"><span><Trans>Disease code</Trans></span><input name="code" required dir="ltr" className={inputClass} placeholder="ND" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Disease name</Trans></span><input name="name" required className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Scientific name</Trans></span><input name="scientificName" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Pathogen type</Trans></span><select name="pathogenType" defaultValue="Viral" className={inputClass}><option value="Viral">Viral</option><option value="Bacterial">Bacterial</option><option value="Parasitic">Parasitic</option><option value="Fungal">Fungal</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue="Active" className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createDisease"><Trans>Create disease</Trans></Button></div>
    </ValidatedForm>
  );
}

export function VaccineCatalogForm({ diseases }: { diseases: DiseaseOption[] }) {
  return (
    <ValidatedForm validator={vaccineCatalogValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm"><span><Trans>Vaccine code</Trans></span><input name="code" required dir="ltr" className={inputClass} placeholder="VAC-ND-001" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Trade name</Trans></span><input name="tradeName" required className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Manufacturer</Trans></span><input name="manufacturer" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Vaccine type</Trans></span><select name="vaccineType" defaultValue="Live" className={inputClass}><option value="Live">Live</option><option value="Inactivated">Inactivated</option><option value="Recombinant">Recombinant</option><option value="Vector">Vector</option><option value="Subunit">Subunit</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Default route</Trans></span><select name="defaultRoute" defaultValue="" className={inputClass}><option value=""><Trans>Not specified</Trans></option><option value="Spray">Spray</option><option value="Drinking Water">Drinking Water</option><option value="Eye Drop">Eye Drop</option><option value="Injection SC">Injection SC</option><option value="Injection IM">Injection IM</option><option value="Wing Web">Wing Web</option><option value="In Ovo">In Ovo</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Primary target disease</Trans></span><select name="diseaseId" required defaultValue="" className={inputClass}><option value=""><Trans>Select disease</Trans></option>{diseases.map((disease) => <option key={disease.id} value={disease.id}>{disease.code} — {disease.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue="Active" className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createVaccine" disabled={diseases.length === 0}><Trans>Create vaccine</Trans></Button></div>
    </ValidatedForm>
  );
}

export function AddVaccineDiseaseTargetForm({ vaccineId, diseases }: { vaccineId: string; diseases: DiseaseOption[] }) {
  return (
    <ValidatedForm validator={vaccineDiseaseTargetValidator} method="post" className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="vaccineId" value={vaccineId} />
      <select name="diseaseId" required defaultValue="" className={inputClass}><option value=""><Trans>Add target disease</Trans></option>{diseases.map((disease) => <option key={disease.id} value={disease.id}>{disease.code} — {disease.name}</option>)}</select>
      <Button type="submit" name="_intent" value="addVaccineDisease" variant="secondary"><Trans>Add</Trans></Button>
    </ValidatedForm>
  );
}

export function DrugCatalogForm() {
  return (
    <ValidatedForm validator={drugCatalogValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm"><span><Trans>Drug code</Trans></span><input name="code" required dir="ltr" className={inputClass} placeholder="DRUG-001" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Trade name</Trans></span><input name="tradeName" required className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Active ingredient</Trans></span><input name="activeIngredient" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Drug class</Trans></span><input name="drugClass" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Default route</Trans></span><input name="defaultRoute" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Meat withdrawal (days)</Trans></span><input name="meatWithdrawalDays" type="number" min="0" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Egg withdrawal (days)</Trans></span><input name="eggWithdrawalDays" type="number" min="0" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue="Active" className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createDrug"><Trans>Create drug</Trans></Button></div>
    </ValidatedForm>
  );
}

export function VaccinationProgramForm({ initial }: { initial?: Record<string, any> }) {
  return (
    <ValidatedForm validator={vaccinationProgramValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <label className="grid gap-1 text-sm"><span><Trans>Program code</Trans></span><input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="BR-STD-01" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Program name</Trans></span><input name="name" required defaultValue={initial?.name ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Flock type</Trans></span><select name="flockType" defaultValue={initial?.flockType ?? "Broiler"} className={inputClass}><option value="Broiler">Broiler</option><option value="Breeder">Breeder</option><option value="Layer">Layer</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Strain</Trans></span><input name="strain" dir="ltr" defaultValue={initial?.strain ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue={initial?.status ?? "Draft"} className={inputClass}><option value="Draft">Draft</option><option value="Active">Active</option><option value="Archived">Archived</option></select></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Description</Trans></span><textarea name="description" defaultValue={initial?.description ?? ""} className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value={initial?.id ? "updateProgram" : "createProgram"}>{initial?.id ? <Trans>Save program</Trans> : <Trans>Create program</Trans>}</Button></div>
    </ValidatedForm>
  );
}

export function VaccinationProgramStepForm({ programId, diseases, vaccines, nextSequence }: { programId: string; diseases: DiseaseOption[]; vaccines: VaccineOption[]; nextSequence: number }) {
  return (
    <ValidatedForm validator={vaccinationProgramStepValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="programId" value={programId} />
      <label className="grid gap-1 text-sm"><span><Trans>Sequence</Trans></span><input name="sequenceNo" type="number" min="1" required dir="ltr" defaultValue={nextSequence} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Target age (days)</Trans></span><input name="targetAgeDays" type="number" min="0" required dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Target disease</Trans></span><select name="diseaseId" required defaultValue="" className={inputClass}><option value=""><Trans>Select disease</Trans></option>{diseases.map((disease) => <option key={disease.id} value={disease.id}>{disease.code} — {disease.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Preferred vaccine</Trans></span><select name="vaccineId" defaultValue="" className={inputClass}><option value=""><Trans>Choose at administration</Trans></option>{vaccines.map((vaccine) => <option key={vaccine.id} value={vaccine.id}>{vaccine.code} — {vaccine.tradeName}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Route</Trans></span><select name="route" required defaultValue="Drinking Water" className={inputClass}><option value="Spray">Spray</option><option value="Drinking Water">Drinking Water</option><option value="Eye Drop">Eye Drop</option><option value="Injection SC">Injection SC</option><option value="Injection IM">Injection IM</option><option value="Wing Web">Wing Web</option><option value="In Ovo">In Ovo</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Dose value</Trans></span><input name="doseValue" type="number" min="0" step="0.001" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Dose unit</Trans></span><input name="doseUnit" dir="ltr" className={inputClass} placeholder="dose/bird" /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createProgramStep" disabled={diseases.length === 0}><Trans>Add schedule step</Trans></Button></div>
    </ValidatedForm>
  );
}

export function AddProgramStepDiseaseForm({ programStepId, diseases }: { programStepId: string; diseases: DiseaseOption[] }) {
  return (
    <ValidatedForm validator={vaccinationProgramStepDiseaseValidator} method="post" className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="programStepId" value={programStepId} />
      <select name="diseaseId" required defaultValue="" className={inputClass}><option value=""><Trans>Add combined target</Trans></option>{diseases.map((disease) => <option key={disease.id} value={disease.id}>{disease.code} — {disease.name}</option>)}</select>
      <Button type="submit" name="_intent" value="addProgramStepDisease" variant="secondary"><Trans>Add</Trans></Button>
    </ValidatedForm>
  );
}

export function VaccinationAssignmentForm({ programs }: { programs: ProgramOption[] }) {
  return (
    <ValidatedForm validator={vaccinationAssignmentValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
      <label className="grid gap-1 text-sm"><span><Trans>Vaccination program</Trans></span><select name="programId" required defaultValue="" className={inputClass}><option value=""><Trans>Select active program</Trans></option>{programs.filter((program) => program.status === "Active").map((program) => <option key={program.id} value={program.id}>{program.code} — {program.name}</option>)}</select></label>
      <div className="flex items-end"><Button type="submit" name="_intent" value="assignVaccinationProgram"><Trans>Assign program</Trans></Button></div>
    </ValidatedForm>
  );
}

export function VaccinationEventCompletionForm({ event, vaccines }: { event: Record<string, any>; vaccines: VaccineOption[] }) {
  return (
    <ValidatedForm validator={vaccinationEventCompletionValidator} method="post" className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="eventId" value={event.id} />
      <label className="grid gap-1 text-sm"><span><Trans>Actual vaccine</Trans></span><select name="vaccineId" required defaultValue={event.vaccineId ?? ""} className={inputClass}><option value=""><Trans>Select vaccine</Trans></option>{vaccines.map((vaccine) => <option key={vaccine.id} value={vaccine.id}>{vaccine.code} — {vaccine.tradeName}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Administered at</Trans></span><input name="administeredAt" type="datetime-local" required dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Route</Trans></span><input name="route" required defaultValue={event.route} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Dose</Trans></span><div className="grid grid-cols-2 gap-2"><input name="doseValue" type="number" min="0" step="0.001" dir="ltr" defaultValue={event.doseValue ?? ""} className={inputClass} /><input name="doseUnit" dir="ltr" defaultValue={event.doseUnit ?? ""} className={inputClass} /></div></label>
      <label className="grid gap-1 text-sm"><span><Trans>Product batch / lot</Trans></span><input name="productBatch" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Expiry date</Trans></span><input name="expiryDate" type="date" dir="ltr" className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Performed by</Trans></span><input name="performedBy" className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Administration notes</Trans></span><textarea name="notes" className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="completeVaccinationEvent"><Trans>Record administration</Trans></Button></div>
    </ValidatedForm>
  );
}

export function VaccinationEventSkipForm({ eventId }: { eventId: string }) {
  return (
    <ValidatedForm validator={vaccinationEventSkipValidator} method="post" className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="eventId" value={eventId} />
      <input name="notes" className={inputClass} placeholder="Reason / note" />
      <Button type="submit" name="_intent" value="skipVaccinationEvent" variant="secondary"><Trans>Mark skipped</Trans></Button>
    </ValidatedForm>
  );
}
