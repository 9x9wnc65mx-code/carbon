import { ValidatedForm } from "@carbon/form";
import { Button } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import type { FarmInput, FlockCycleInput, PoultryHouseInput } from "../poultry.models";
import { farmValidator, flockCycleValidator, poultryHouseValidator } from "../poultry.models";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textAreaClass =
  "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type FarmOption = { id: string; code: string; name: string };
type HouseOption = { id: string; code: string; name: string; farmName?: string };

type FormChrome<T> = {
  initial?: Partial<T>;
  submitLabel: ReactNode;
};

export function FarmForm({
  initial,
  intent,
  submitLabel
}: FormChrome<FarmInput> & { intent: "createFarm" | "updateFarm" }) {
  return (
    <ValidatedForm validator={farmValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <label className="grid gap-1 text-sm"><span><Trans>Farm code</Trans></span><input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="FARM-001" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Farm name</Trans></span><input name="name" required defaultValue={initial?.name ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Farm type</Trans></span><select name="farmType" defaultValue={initial?.farmType ?? "Broiler"} className={inputClass}><option value="Broiler">Broiler</option><option value="Breeder">Breeder</option><option value="Layer">Layer</option><option value="Hatchery">Hatchery</option><option value="Mixed">Mixed</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue={initial?.status ?? "Active"} className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Region</Trans></span><input name="region" defaultValue={initial?.region ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Address</Trans></span><input name="address" defaultValue={initial?.address ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Farm timezone</Trans></span><input name="timezone" required dir="ltr" defaultValue={initial?.timezone ?? "UTC"} className={inputClass} placeholder="Asia/Amman" list="avios-timezones" /><datalist id="avios-timezones"><option value="Asia/Amman" /><option value="UTC" /><option value="Asia/Riyadh" /><option value="Asia/Dubai" /><option value="Europe/Istanbul" /></datalist><span className="text-xs text-muted-foreground"><Trans>Use an IANA timezone such as Asia/Amman.</Trans></span></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" defaultValue={initial?.notes ?? ""} className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value={intent}>{submitLabel}</Button></div>
    </ValidatedForm>
  );
}

export function HouseForm({
  farms,
  initial,
  intent,
  submitLabel
}: FormChrome<PoultryHouseInput> & {
  farms: FarmOption[];
  intent: "createHouse" | "updateHouse";
}) {
  return (
    <ValidatedForm validator={poultryHouseValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Farm</Trans></span><select name="farmId" required defaultValue={initial?.farmId ?? ""} className={inputClass}><option value=""><Trans>Select farm</Trans></option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.code} — {farm.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>House code</Trans></span><input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="H-01" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>House name</Trans></span><input name="name" required defaultValue={initial?.name ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>House type</Trans></span><select name="houseType" defaultValue={initial?.houseType ?? "Broiler"} className={inputClass}><option value="Broiler">Broiler</option><option value="Breeder">Breeder</option><option value="Layer">Layer</option><option value="Rearing">Rearing</option><option value="Hatchery">Hatchery</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue={initial?.status ?? "Active"} className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Capacity (birds)</Trans></span><input name="capacityBirds" type="number" min="1" required dir="ltr" defaultValue={initial?.capacityBirds ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Floor area (m²)</Trans></span><input name="floorAreaM2" type="number" min="0" step="0.01" dir="ltr" defaultValue={initial?.floorAreaM2 ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" defaultValue={initial?.notes ?? ""} className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value={intent}>{submitLabel}</Button></div>
    </ValidatedForm>
  );
}

export function FlockForm({
  houses,
  initial,
  intent,
  submitLabel
}: FormChrome<FlockCycleInput> & {
  houses: HouseOption[];
  intent: "createFlock" | "updateFlock";
}) {
  return (
    <ValidatedForm validator={flockCycleValidator} method="post" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>House</Trans></span><select name="houseId" required defaultValue={initial?.houseId ?? ""} className={inputClass}><option value=""><Trans>Select house</Trans></option>{houses.map((house) => <option key={house.id} value={house.id}>{house.farmName ? `${house.farmName} / ` : ""}{house.code} — {house.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Flock code</Trans></span><input name="code" required dir="ltr" defaultValue={initial?.code ?? ""} className={inputClass} placeholder="BR-2026-001" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Flock type</Trans></span><select name="flockType" defaultValue={initial?.flockType ?? "Broiler"} className={inputClass}><option value="Broiler">Broiler</option><option value="Breeder">Breeder</option><option value="Layer">Layer</option><option value="Other">Other</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Strain</Trans></span><input name="strain" dir="ltr" defaultValue={initial?.strain ?? ""} className={inputClass} placeholder="Ross 308" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Sex</Trans></span><select name="sex" defaultValue={initial?.sex ?? "Mixed"} className={inputClass}><option value="Mixed">Mixed</option><option value="Male">Male</option><option value="Female">Female</option><option value="Unknown">Unknown</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Hatch date</Trans></span><input name="hatchDate" type="date" dir="ltr" defaultValue={initial?.hatchDate ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Placement date</Trans></span><input name="placementDate" type="date" required dir="ltr" defaultValue={initial?.placementDate ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Initial birds</Trans></span><input name="initialBirdCount" type="number" min="1" required dir="ltr" defaultValue={initial?.initialBirdCount ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Status</Trans></span><select name="status" defaultValue={initial?.status ?? "Active"} className={inputClass}><option value="Planned">Planned</option><option value="Active">Active</option><option value="Closed">Closed</option><option value="Cancelled">Cancelled</option></select></label>
      <label className="grid gap-1 text-sm"><span><Trans>Source reference</Trans></span><input name="sourceReference" dir="ltr" defaultValue={initial?.sourceReference ?? ""} className={inputClass} placeholder="HATCH-LOT-001" /></label>
      <label className="grid gap-1 text-sm"><span><Trans>Closure date</Trans></span><input name="closureDate" type="date" dir="ltr" defaultValue={initial?.closureDate ?? ""} className={inputClass} /></label>
      <label className="grid gap-1 text-sm md:col-span-2"><span><Trans>Notes</Trans></span><textarea name="notes" defaultValue={initial?.notes ?? ""} className={textAreaClass} /></label>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" name="_intent" value={intent}>{submitLabel}</Button></div>
    </ValidatedForm>
  );
}
