import { ValidatedForm } from "@carbon/form";
import { Button } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import {
  labAccessionStatusValidator,
  labAccessionValidator,
  laboratoryTypes,
  laboratoryValidator,
  labResultEntryValidator,
  labResultFlags,
  labSourceTypes,
  labSpecimenStatuses,
  labSpecimenValidator,
  labTestCategories,
  labTestDefinitionValidator,
  labTestDiseaseTargetValidator,
  labTestOrderStatusValidator,
  labTestOrderValidator,
  labTestParameterValidator,
  labResultTypes
} from "../laboratory.models";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textAreaClass =
  "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type LaboratoryOption = {
  id: string;
  code: string;
  name: string;
  laboratoryType?: string;
  timezone?: string;
  status?: string;
};
type FlockOption = { id: string; code: string; status?: string; flockType?: string };
type DiseaseOption = { id: string; code: string; name: string };
type SpecimenOption = { id: string; specimenCode: string; specimenType: string; status?: string };
type TestOption = { id: string; code: string; name: string; laboratoryId: string; status?: string };

type InitialRecord = Record<string, any>;

function Field({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return <label className={`grid gap-1 text-sm ${className}`}><span>{label}</span>{children}</label>;
}

export function LaboratoryForm({ initial }: { initial?: InitialRecord }) {
  return (
    <ValidatedForm validator={laboratoryValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Field label={<Trans>Laboratory code</Trans>}><input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="LAB-DIAG-01" /></Field>
      <Field label={<Trans>Laboratory name</Trans>}><input name="name" required defaultValue={initial?.name ?? ""} className={inputClass} /></Field>
      <Field label={<Trans>Laboratory type</Trans>}><select name="laboratoryType" defaultValue={initial?.laboratoryType ?? "Diagnostic"} className={inputClass}>{laboratoryTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
      <Field label={<Trans>Timezone</Trans>}><input name="timezone" required dir="ltr" defaultValue={initial?.timezone ?? "Asia/Amman"} className={inputClass} placeholder="Asia/Amman" /></Field>
      <Field label={<Trans>Accreditation</Trans>}><input name="accreditation" defaultValue={initial?.accreditation ?? ""} className={inputClass} placeholder="ISO/IEC 17025" /></Field>
      <Field label={<Trans>Contact reference</Trans>}><input name="contactReference" defaultValue={initial?.contactReference ?? ""} className={inputClass} /></Field>
      <Field label={<Trans>Status</Trans>}><select name="status" defaultValue={initial?.status ?? "Active"} className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></Field>
      <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm"><input type="checkbox" name="isInternal" defaultChecked={initial?.isInternal ?? true} /><span><Trans>Internal laboratory</Trans></span></label>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2"><textarea name="notes" defaultValue={initial?.notes ?? ""} className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value={initial?.id ? "updateLaboratory" : "createLaboratory"}>{initial?.id ? <Trans>Save laboratory</Trans> : <Trans>Create laboratory</Trans>}</Button></div>
    </ValidatedForm>
  );
}

export function LabTestDefinitionForm({ laboratories, initial }: { laboratories: LaboratoryOption[]; initial?: InitialRecord }) {
  return (
    <ValidatedForm validator={labTestDefinitionValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Field label={<Trans>Laboratory</Trans>}><select name="laboratoryId" required defaultValue={initial?.laboratoryId ?? ""} className={inputClass}><option value=""><Trans>Select laboratory</Trans></option>{laboratories.filter((lab) => lab.status !== "Inactive").map((lab) => <option key={lab.id} value={lab.id}>{lab.code} — {lab.name}</option>)}</select></Field>
      <Field label={<Trans>Test code</Trans>}><input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="PCR-ND" /></Field>
      <Field label={<Trans>Test name</Trans>}><input name="name" required defaultValue={initial?.name ?? ""} className={inputClass} /></Field>
      <Field label={<Trans>Category</Trans>}><select name="category" defaultValue={initial?.category ?? "Microbiology"} className={inputClass}>{labTestCategories.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
      <Field label={<Trans>Method</Trans>}><input name="method" defaultValue={initial?.method ?? ""} className={inputClass} placeholder="RT-qPCR / ISO / SOP reference" /></Field>
      <Field label={<Trans>Turnaround hours</Trans>}><input name="turnaroundHours" type="number" min="1" dir="ltr" defaultValue={initial?.turnaroundHours ?? ""} className={inputClass} /></Field>
      <Field label={<Trans>Status</Trans>}><select name="status" defaultValue={initial?.status ?? "Draft"} className={inputClass}><option value="Draft">Draft</option><option value="Active">Active</option><option value="Archived">Archived</option></select></Field>
      <Field label={<Trans>Sample requirements</Trans>} className="md:col-span-2"><textarea name="sampleRequirements" defaultValue={initial?.sampleRequirements ?? ""} className={textAreaClass} /></Field>
      <Field label={<Trans>Description</Trans>} className="md:col-span-2"><textarea name="description" defaultValue={initial?.description ?? ""} className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value={initial?.id ? "updateTestDefinition" : "createTestDefinition"} disabled={laboratories.length === 0}>{initial?.id ? <Trans>Save test definition</Trans> : <Trans>Create test definition</Trans>}</Button></div>
    </ValidatedForm>
  );
}

export function LabTestParameterForm({ testDefinitionId, nextSequence }: { testDefinitionId: string; nextSequence: number }) {
  return (
    <ValidatedForm validator={labTestParameterValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="testDefinitionId" value={testDefinitionId} />
      <Field label={<Trans>Sequence</Trans>}><input name="sequenceNo" type="number" min="1" required dir="ltr" defaultValue={nextSequence} className={inputClass} /></Field>
      <Field label={<Trans>Parameter code</Trans>}><input name="code" required dir="ltr" className={inputClass} placeholder="CT / TITER / CFU" /></Field>
      <Field label={<Trans>Parameter name</Trans>}><input name="name" required className={inputClass} /></Field>
      <Field label={<Trans>Result type</Trans>}><select name="resultType" defaultValue="Numeric" className={inputClass}>{labResultTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
      <Field label={<Trans>Unit</Trans>}><input name="unit" dir="ltr" className={inputClass} placeholder="CFU/mL, log2, copies/mL" /></Field>
      <Field label={<Trans>Decimal places</Trans>}><input name="decimalPlaces" type="number" min="0" max="8" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Reference minimum</Trans>}><input name="referenceMin" type="number" step="any" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Reference maximum</Trans>}><input name="referenceMax" type="number" step="any" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Reference text</Trans>} className="md:col-span-2"><input name="referenceText" className={inputClass} placeholder="Expected / target / interpretation reference" /></Field>
      <Field label={<Trans>Qualitative options</Trans>} className="md:col-span-2"><input name="qualitativeOptionsText" className={inputClass} placeholder="Sensitive, Intermediate, Resistant" /><span className="text-xs text-muted-foreground"><Trans>Comma-separated. Required when Result type is Qualitative.</Trans></span></Field>
      <Field label={<Trans>Status</Trans>}><select name="status" defaultValue="Active" className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></Field>
      <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm"><input type="checkbox" name="isRequired" defaultChecked /><span><Trans>Required result</Trans></span></label>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2"><textarea name="notes" className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createTestParameter"><Trans>Add parameter</Trans></Button></div>
    </ValidatedForm>
  );
}

export function LabTestDiseaseTargetForm({ testDefinitionId, diseases }: { testDefinitionId: string; diseases: DiseaseOption[] }) {
  return (
    <ValidatedForm validator={labTestDiseaseTargetValidator} method="post" className="flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="testDefinitionId" value={testDefinitionId} />
      <select name="diseaseId" required defaultValue="" className={inputClass}><option value=""><Trans>Add disease target</Trans></option>{diseases.map((disease) => <option key={disease.id} value={disease.id}>{disease.code} — {disease.name}</option>)}</select>
      <Button type="submit" name="_intent" value="addTestDiseaseTarget" variant="secondary"><Trans>Add</Trans></Button>
    </ValidatedForm>
  );
}

export function LabAccessionForm({ laboratories, flocks, defaultDateTime }: { laboratories: LaboratoryOption[]; flocks: FlockOption[]; defaultDateTime: string }) {
  return (
    <ValidatedForm validator={labAccessionValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Field label={<Trans>Laboratory</Trans>}><select name="laboratoryId" required defaultValue="" className={inputClass}><option value=""><Trans>Select laboratory</Trans></option>{laboratories.filter((lab) => lab.status !== "Inactive").map((lab) => <option key={lab.id} value={lab.id}>{lab.code} — {lab.name}</option>)}</select></Field>
      <Field label={<Trans>Accession number</Trans>}><input name="accessionNumber" dir="ltr" className={inputClass} placeholder="Auto-generated when blank" /></Field>
      <Field label={<Trans>Source type</Trans>}><select name="sourceType" defaultValue="Flock" className={inputClass}>{labSourceTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
      <Field label={<Trans>Flock linkage</Trans>}><select name="flockId" defaultValue="" className={inputClass}><option value=""><Trans>No flock linkage</Trans></option>{flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.code} — {flock.flockType ?? ""} — {flock.status ?? ""}</option>)}</select></Field>
      <input type="hidden" name="clinicalEventId" value="" />
      <Field label={<Trans>Source reference</Trans>}><input name="sourceReference" className={inputClass} /></Field>
      <Field label={<Trans>Source location</Trans>}><input name="sourceLocation" className={inputClass} /></Field>
      <Field label={<Trans>Collected at</Trans>}><input name="collectedAtLocal" type="datetime-local" required dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></Field>
      <Field label={<Trans>Received at</Trans>}><input name="receivedAtLocal" type="datetime-local" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Priority</Trans>}><select name="priority" defaultValue="Routine" className={inputClass}><option value="Routine">Routine</option><option value="Urgent">Urgent</option><option value="STAT">STAT</option></select></Field>
      <Field label={<Trans>Requested by</Trans>}><input name="requestedBy" className={inputClass} /></Field>
      <Field label={<Trans>External reference</Trans>}><input name="externalReference" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Collection notes</Trans>} className="md:col-span-2"><textarea name="collectionNotes" className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createAccession" disabled={laboratories.length === 0}><Trans>Open accession</Trans></Button></div>
    </ValidatedForm>
  );
}

export function LabAccessionStatusForm({ accession, defaultDateTime }: { accession: InitialRecord; defaultDateTime: string }) {
  return (
    <ValidatedForm validator={labAccessionStatusValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="accessionId" value={accession.id} />
      <Field label={<Trans>Accession status</Trans>}><select name="status" defaultValue={accession.status === "Collected" ? "In Transit" : "Received"} className={inputClass}><option value="In Transit">In Transit</option><option value="Received">Received</option><option value="Rejected">Rejected</option><option value="Cancelled">Cancelled</option></select></Field>
      <Field label={<Trans>Received at</Trans>}><input name="receivedAtLocal" type="datetime-local" dir="ltr" defaultValue={defaultDateTime} className={inputClass} /></Field>
      <Field label={<Trans>Rejection reason</Trans>} className="md:col-span-2"><textarea name="rejectionReason" className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="updateAccessionStatus"><Trans>Update accession</Trans></Button></div>
    </ValidatedForm>
  );
}

export function LabSpecimenForm({ accessionId }: { accessionId: string }) {
  return (
    <ValidatedForm validator={labSpecimenValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="accessionId" value={accessionId} />
      <Field label={<Trans>Specimen code</Trans>}><input name="specimenCode" dir="ltr" className={inputClass} placeholder="Auto-generated when blank" /></Field>
      <Field label={<Trans>Specimen type</Trans>}><input name="specimenType" required className={inputClass} placeholder="Serum, liver, swab, feed, water..." /></Field>
      <Field label={<Trans>Anatomical site</Trans>}><input name="anatomicalSite" className={inputClass} /></Field>
      <Field label={<Trans>Pool size</Trans>}><input name="poolSize" type="number" min="1" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Quantity</Trans>}><input name="quantity" type="number" min="0" step="any" dir="ltr" className={inputClass} /></Field>
      <Field label={<Trans>Quantity unit</Trans>}><input name="quantityUnit" dir="ltr" className={inputClass} placeholder="mL, g, swab" /></Field>
      <Field label={<Trans>Container type</Trans>}><input name="containerType" className={inputClass} /></Field>
      <Field label={<Trans>Preservative / medium</Trans>}><input name="preservative" className={inputClass} /></Field>
      <Field label={<Trans>Condition on receipt</Trans>}><input name="conditionOnReceipt" className={inputClass} /></Field>
      <Field label={<Trans>Status</Trans>}><select name="status" defaultValue="Available" className={inputClass}>{labSpecimenStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2"><textarea name="notes" className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createSpecimen"><Trans>Add specimen</Trans></Button></div>
    </ValidatedForm>
  );
}

export function LabTestOrderForm({ accessionId, laboratoryId, specimens, tests }: { accessionId: string; laboratoryId: string; specimens: SpecimenOption[]; tests: TestOption[] }) {
  const availableSpecimens = specimens.filter((specimen) => !["Disposed", "Rejected", "Exhausted"].includes(specimen.status ?? ""));
  const availableTests = tests.filter((test) => test.laboratoryId === laboratoryId && test.status === "Active");
  return (
    <ValidatedForm validator={labTestOrderValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="accessionId" value={accessionId} />
      <Field label={<Trans>Specimen</Trans>}><select name="specimenId" required defaultValue="" className={inputClass}><option value=""><Trans>Select specimen</Trans></option>{availableSpecimens.map((specimen) => <option key={specimen.id} value={specimen.id}>{specimen.specimenCode} — {specimen.specimenType}</option>)}</select></Field>
      <Field label={<Trans>Test</Trans>}><select name="testDefinitionId" required defaultValue="" className={inputClass}><option value=""><Trans>Select active test</Trans></option>{availableTests.map((test) => <option key={test.id} value={test.id}>{test.code} — {test.name}</option>)}</select></Field>
      <Field label={<Trans>Analyst</Trans>}><input name="analyst" className={inputClass} /></Field>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2"><textarea name="notes" className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="createTestOrder" disabled={availableSpecimens.length === 0 || availableTests.length === 0}><Trans>Create test order</Trans></Button></div>
    </ValidatedForm>
  );
}

function resultValueInput(result: InitialRecord) {
  const type = result.resultTypeSnapshot;
  const options: string[] = Array.isArray(result.qualitativeOptionsSnapshot) ? result.qualitativeOptionsSnapshot : [];
  if (type === "Positive/Negative") return <select name="value" required defaultValue={result.qualitativeValue ?? ""} className={inputClass}><option value=""><Trans>Select result</Trans></option><option value="Positive">Positive</option><option value="Negative">Negative</option></select>;
  if (type === "Detected/Not Detected") return <select name="value" required defaultValue={result.qualitativeValue ?? ""} className={inputClass}><option value=""><Trans>Select result</Trans></option><option value="Detected">Detected</option><option value="Not Detected">Not Detected</option></select>;
  if (type === "Qualitative" && options.length > 0) return <select name="value" required defaultValue={result.qualitativeValue ?? ""} className={inputClass}><option value=""><Trans>Select result</Trans></option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (type === "Boolean") return <select name="value" required defaultValue={result.booleanValue == null ? "" : String(result.booleanValue)} className={inputClass}><option value=""><Trans>Select result</Trans></option><option value="true">True</option><option value="false">False</option></select>;
  if (["Numeric", "Titer", "Ct"].includes(type)) return <input name="value" required type="number" step="any" dir="ltr" defaultValue={result.numericValue ?? ""} className={inputClass} />;
  return <input name="value" required defaultValue={result.textValue ?? result.qualitativeValue ?? ""} className={inputClass} />;
}

export function LabResultEntryForm({ result }: { result: InitialRecord }) {
  return (
    <ValidatedForm validator={labResultEntryValidator} method="post" className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_170px_minmax(0,1fr)_auto] md:items-end">
      <input type="hidden" name="resultId" value={result.id} />
      <Field label={<Trans>Result value</Trans>}>{resultValueInput(result)}</Field>
      <Field label={<Trans>Flag</Trans>}><select name="resultFlag" defaultValue={result.resultFlag ?? ""} className={inputClass}><option value=""><Trans>No flag</Trans></option>{labResultFlags.map((flag) => <option key={flag} value={flag}>{flag}</option>)}</select></Field>
      <Field label={<Trans>Comment</Trans>}><input name="comment" defaultValue={result.comment ?? ""} className={inputClass} /></Field>
      <Button type="submit" name="_intent" value="enterResult"><Trans>Save result</Trans></Button>
    </ValidatedForm>
  );
}

export function LabResultVerificationForm({ resultId }: { resultId: string }) {
  return <ValidatedForm validator={{ validate: async () => ({ data: { resultId }, error: undefined }) } as any} method="post"><input type="hidden" name="resultId" value={resultId} /><Button type="submit" name="_intent" value="verifyResult" size="sm"><Trans>Verify</Trans></Button></ValidatedForm>;
}

export function LabTestOrderStatusForm({ order }: { order: InitialRecord }) {
  return (
    <ValidatedForm validator={labTestOrderStatusValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="orderId" value={order.id} />
      <Field label={<Trans>Status</Trans>}><select name="status" defaultValue={order.status === "Requested" ? "In Progress" : order.status} className={inputClass}><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Rejected">Rejected</option><option value="Cancelled">Cancelled</option></select></Field>
      <Field label={<Trans>Analyst</Trans>}><input name="analyst" defaultValue={order.analyst ?? ""} className={inputClass} /></Field>
      <Field label={<Trans>Overall interpretation</Trans>} className="md:col-span-2"><textarea name="overallInterpretation" defaultValue={order.overallInterpretation ?? ""} className={textAreaClass} /></Field>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2"><textarea name="notes" defaultValue={order.notes ?? ""} className={textAreaClass} /></Field>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value="updateTestOrderStatus"><Trans>Update test order</Trans></Button></div>
    </ValidatedForm>
  );
}
