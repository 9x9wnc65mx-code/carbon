import { ValidatedForm } from "@carbon/form";
import { Button } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import {
  feedClasses,
  feedCoaStatuses,
  feedExposureTypes,
  feedItemProfileValidator,
  feedLabAccessionValidator,
  feedPhysicalForms,
  feedProductionStages,
  feedSamplingStatuses,
  feedSpecificationBases,
  feedSpecificationParameterValidator,
  feedTrackedLotProfileValidator,
  flockFeedExposureValidator
} from "../feed.models";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textAreaClass =
  "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type CarbonItemOption = {
  id: string;
  name: string;
  readableIdWithRevision?: string | null;
  itemTrackingType?: string | null;
};

type FeedProfileRecord = {
  itemId: string;
  feedClass: string;
  productionStage?: string | null;
  physicalForm?: string | null;
  species: string;
  requiresLotTraceability: boolean;
  status: string;
  notes?: string | null;
};

type FeedSpecificationRecord = {
  itemId: string;
  sequenceNo: number;
  code: string;
  name: string;
  basis: string;
  unit?: string | null;
  targetValue?: number | null;
  minimumValue?: number | null;
  maximumValue?: number | null;
  referenceText?: string | null;
  status: string;
  notes?: string | null;
};

type FeedLotOption = {
  id: string;
  itemId: string;
  readableId?: string | null;
  quantity?: number | string | null;
  status?: string | null;
  expirationDate?: string | null;
};

type FeedLotProfileRecord = {
  trackedEntityId: string;
  itemId: string;
  supplierLotNumber?: string | null;
  millBatchNumber?: string | null;
  manufactureDate?: string | null;
  originCountry?: string | null;
  coaReference?: string | null;
  coaStatus: string;
  samplingStatus: string;
  qualityNotes?: string | null;
};

type LaboratoryOption = {
  id: string;
  code: string;
  name: string;
  laboratoryType?: string;
  status?: string;
};

type FlockOption = {
  id: string;
  code: string;
  flockType?: string;
  status?: string;
};

function Field({
  label,
  children,
  className = ""
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function FeedItemProfileForm({
  items,
  initial
}: {
  items: CarbonItemOption[];
  initial?: FeedProfileRecord;
}) {
  const selectedItem = initial
    ? items.find((item) => item.id === initial.itemId)
    : undefined;

  return (
    <ValidatedForm
      validator={feedItemProfileValidator}
      method="post"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      {initial ? (
        <>
          <input type="hidden" name="itemId" value={initial.itemId} />
          <Field label={<Trans>Carbon item</Trans>} className="md:col-span-2">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span dir="ltr">
                {selectedItem?.readableIdWithRevision ?? initial.itemId}
              </span>{" "}
              · {selectedItem?.name ?? ""}
            </div>
          </Field>
        </>
      ) : (
        <Field label={<Trans>Carbon item</Trans>} className="md:col-span-2">
          <select name="itemId" required defaultValue="" className={inputClass}>
            <option value=""><Trans>Select Carbon item</Trans></option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.readableIdWithRevision ?? item.id} — {item.name} — {item.itemTrackingType}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={<Trans>Feed class</Trans>}>
        <select name="feedClass" defaultValue={initial?.feedClass ?? "Raw Material"} className={inputClass}>
          {feedClasses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Production stage</Trans>}>
        <select name="productionStage" defaultValue={initial?.productionStage ?? ""} className={inputClass}>
          <option value=""><Trans>Not specified</Trans></option>
          {feedProductionStages.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Physical form</Trans>}>
        <select name="physicalForm" defaultValue={initial?.physicalForm ?? ""} className={inputClass}>
          <option value=""><Trans>Not specified</Trans></option>
          {feedPhysicalForms.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Species</Trans>}>
        <input name="species" required defaultValue={initial?.species ?? "Poultry"} className={inputClass} />
      </Field>
      <Field label={<Trans>Status</Trans>}>
        <select name="status" defaultValue={initial?.status ?? "Active"} className={inputClass}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
        <input
          type="checkbox"
          name="requiresLotTraceability"
          defaultChecked={initial?.requiresLotTraceability ?? true}
        />
        <span><Trans>Require Carbon batch/lot traceability</Trans></span>
      </label>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2">
        <textarea name="notes" defaultValue={initial?.notes ?? ""} className={textAreaClass} />
      </Field>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" name="_intent" value={initial ? "updateFeedItem" : "createFeedItem"}>
          {initial ? <Trans>Save feed profile</Trans> : <Trans>Create feed profile</Trans>}
        </Button>
      </div>
    </ValidatedForm>
  );
}

export function FeedSpecificationParameterForm({
  itemId,
  nextSequence,
  initial
}: {
  itemId: string;
  nextSequence: number;
  initial?: FeedSpecificationRecord;
}) {
  return (
    <ValidatedForm
      validator={feedSpecificationParameterValidator}
      method="post"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <Field label={<Trans>Sequence</Trans>}>
        <input name="sequenceNo" type="number" min="1" required dir="ltr" defaultValue={initial?.sequenceNo ?? nextSequence} className={inputClass} />
      </Field>
      <Field label={<Trans>Specification code</Trans>}>
        <input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="CP / ME / Ca / AFB1" />
      </Field>
      <Field label={<Trans>Specification name</Trans>}>
        <input name="name" required defaultValue={initial?.name ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Basis</Trans>}>
        <select name="basis" defaultValue={initial?.basis ?? "As Fed"} className={inputClass}>
          {feedSpecificationBases.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Unit</Trans>}>
        <input name="unit" dir="ltr" defaultValue={initial?.unit ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Target</Trans>}>
        <input name="targetValue" type="number" step="any" dir="ltr" defaultValue={initial?.targetValue ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Minimum</Trans>}>
        <input name="minimumValue" type="number" step="any" dir="ltr" defaultValue={initial?.minimumValue ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Maximum</Trans>}>
        <input name="maximumValue" type="number" step="any" dir="ltr" defaultValue={initial?.maximumValue ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Reference text</Trans>} className="md:col-span-2">
        <input name="referenceText" defaultValue={initial?.referenceText ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Status</Trans>}>
        <select name="status" defaultValue={initial?.status ?? "Active"} className={inputClass}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </Field>
      <div />
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2">
        <textarea name="notes" defaultValue={initial?.notes ?? ""} className={textAreaClass} />
      </Field>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" name="_intent" value="createFeedSpecification">
          <Trans>Add specification</Trans>
        </Button>
      </div>
    </ValidatedForm>
  );
}

export function FeedTrackedLotProfileForm({
  lot,
  initial
}: {
  lot: FeedLotOption;
  initial?: FeedLotProfileRecord;
}) {
  return (
    <ValidatedForm
      validator={feedTrackedLotProfileValidator}
      method="post"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="trackedEntityId" value={lot.id} />
      <input type="hidden" name="itemId" value={lot.itemId} />
      <Field label={<Trans>Supplier lot</Trans>}>
        <input name="supplierLotNumber" dir="ltr" defaultValue={initial?.supplierLotNumber ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Mill batch</Trans>}>
        <input name="millBatchNumber" dir="ltr" defaultValue={initial?.millBatchNumber ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Manufacture date</Trans>}>
        <input name="manufactureDate" type="date" dir="ltr" defaultValue={initial?.manufactureDate ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Origin country</Trans>}>
        <input name="originCountry" defaultValue={initial?.originCountry ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>COA reference</Trans>}>
        <input name="coaReference" dir="ltr" defaultValue={initial?.coaReference ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>COA status</Trans>}>
        <select name="coaStatus" defaultValue={initial?.coaStatus ?? "Pending"} className={inputClass}>
          {feedCoaStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Sampling status</Trans>}>
        <select name="samplingStatus" defaultValue={initial?.samplingStatus ?? "Not Sampled"} className={inputClass}>
          {feedSamplingStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <div />
      <Field label={<Trans>Quality notes</Trans>} className="md:col-span-2">
        <textarea name="qualityNotes" defaultValue={initial?.qualityNotes ?? ""} className={textAreaClass} />
      </Field>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" name="_intent" value={initial ? "updateFeedLot" : "createFeedLot"}>
          {initial ? <Trans>Save lot metadata</Trans> : <Trans>Register feed lot metadata</Trans>}
        </Button>
      </div>
    </ValidatedForm>
  );
}

export function FeedLabAccessionForm({
  lot,
  laboratories,
  flocks,
  defaultDateTime
}: {
  lot: FeedLotOption;
  laboratories: LaboratoryOption[];
  flocks: FlockOption[];
  defaultDateTime: string;
}) {
  const feedLabs = laboratories.filter(
    (lab) => lab.status !== "Inactive" && ["Feed", "External", "Other"].includes(lab.laboratoryType ?? "")
  );

  return (
    <ValidatedForm
      validator={feedLabAccessionValidator}
      method="post"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="sourceType" value="Feed" />
      <input type="hidden" name="trackedEntityId" value={lot.id} />
      <input type="hidden" name="clinicalEventId" value="" />
      <Field label={<Trans>Laboratory</Trans>}>
        <select name="laboratoryId" required defaultValue="" className={inputClass}>
          <option value=""><Trans>Select feed laboratory</Trans></option>
          {feedLabs.map((lab) => <option key={lab.id} value={lab.id}>{lab.code} — {lab.name}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Accession number</Trans>}>
        <input name="accessionNumber" dir="ltr" className={inputClass} placeholder="Auto-generated when blank" />
      </Field>
      <Field label={<Trans>Flock linkage</Trans>}>
        <select name="flockId" defaultValue="" className={inputClass}>
          <option value=""><Trans>No flock linkage</Trans></option>
          {flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.code} — {flock.flockType ?? ""}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Source reference</Trans>}>
        <input name="sourceReference" dir="ltr" defaultValue={lot.readableId ?? ""} className={inputClass} />
      </Field>
      <Field label={<Trans>Source location</Trans>}>
        <input name="sourceLocation" className={inputClass} />
      </Field>
      <Field label={<Trans>Collected at</Trans>}>
        <input name="collectedAtLocal" type="datetime-local" required dir="ltr" defaultValue={defaultDateTime} className={inputClass} />
      </Field>
      <Field label={<Trans>Received at</Trans>}>
        <input name="receivedAtLocal" type="datetime-local" dir="ltr" className={inputClass} />
      </Field>
      <Field label={<Trans>Priority</Trans>}>
        <select name="priority" defaultValue="Routine" className={inputClass}>
          <option value="Routine">Routine</option>
          <option value="Urgent">Urgent</option>
          <option value="STAT">STAT</option>
        </select>
      </Field>
      <Field label={<Trans>Requested by</Trans>}>
        <input name="requestedBy" className={inputClass} />
      </Field>
      <Field label={<Trans>External reference</Trans>}>
        <input name="externalReference" dir="ltr" className={inputClass} />
      </Field>
      <Field label={<Trans>Collection notes</Trans>} className="md:col-span-2">
        <textarea name="collectionNotes" className={textAreaClass} />
      </Field>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" name="_intent" value="createFeedAccession" disabled={feedLabs.length === 0}>
          <Trans>Open feed accession</Trans>
        </Button>
      </div>
    </ValidatedForm>
  );
}

export function FlockFeedExposureForm({
  lots,
  lotProfiles,
  items,
  defaultDateTime
}: {
  lots: FeedLotOption[];
  lotProfiles: FeedLotProfileRecord[];
  items: CarbonItemOption[];
  defaultDateTime: string;
}) {
  const profileIds = new Set(lotProfiles.map((profile) => profile.trackedEntityId));
  const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
  const selectableLots = lots.filter((lot) => profileIds.has(lot.id));

  return (
    <ValidatedForm
      validator={flockFeedExposureValidator}
      method="post"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <Field label={<Trans>Feed lot</Trans>} className="md:col-span-2">
        <select name="trackedEntityId" required defaultValue="" className={inputClass}>
          <option value=""><Trans>Select registered feed lot</Trans></option>
          {selectableLots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {itemById[lot.itemId]?.readableIdWithRevision ?? lot.itemId} — {itemById[lot.itemId]?.name ?? ""} — {lot.readableId ?? lot.id} — {lot.status}
            </option>
          ))}
        </select>
      </Field>
      <Field label={<Trans>Exposure type</Trans>}>
        <select name="exposureType" defaultValue="Delivery" className={inputClass}>
          {feedExposureTypes.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>
      <Field label={<Trans>Started at</Trans>}>
        <input name="startedAtLocal" type="datetime-local" required dir="ltr" defaultValue={defaultDateTime} className={inputClass} />
      </Field>
      <Field label={<Trans>Ended at</Trans>}>
        <input name="endedAtLocal" type="datetime-local" dir="ltr" className={inputClass} />
      </Field>
      <Field label={<Trans>Quantity</Trans>}>
        <input name="quantity" type="number" min="0" step="any" dir="ltr" className={inputClass} />
      </Field>
      <Field label={<Trans>Quantity unit</Trans>}>
        <input name="quantityUnit" dir="ltr" className={inputClass} placeholder="kg / ton" />
      </Field>
      <Field label={<Trans>Document reference</Trans>}>
        <input name="documentReference" dir="ltr" className={inputClass} />
      </Field>
      <Field label={<Trans>Source location</Trans>}>
        <input name="sourceLocation" className={inputClass} />
      </Field>
      <Field label={<Trans>Notes</Trans>} className="md:col-span-2">
        <textarea name="notes" className={textAreaClass} />
      </Field>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" name="_intent" value="createFeedExposure" disabled={selectableLots.length === 0}>
          <Trans>Record feed exposure</Trans>
        </Button>
      </div>
    </ValidatedForm>
  );
}
