import type { Database } from "@carbon/database";
import { now } from "@internationalized/date";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitize } from "~/utils/supabase";
import type {
  DiseaseCatalogInput,
  DrugCatalogInput,
  VaccinationEventCompletionInput,
  VaccinationProgramInput,
  VaccinationProgramStepInput,
  VaccineCatalogInput
} from "./vaccination.models";

function vaccinationDb(client: SupabaseClient<Database>): SupabaseClient<any> {
  return client as unknown as SupabaseClient<any>;
}

function updatedAt() {
  return now("UTC").toAbsoluteString();
}

function withoutId<T extends { id?: string }>(input: T) {
  const { id: _id, ...values } = input;
  return values;
}

export function getDiseaseCatalog(client: SupabaseClient<Database>, companyId: string) {
  return vaccinationDb(client)
    .from("diseaseCatalog")
    .select("*")
    .eq("companyId", companyId)
    .order("name", { ascending: true });
}

export function createDisease(
  client: SupabaseClient<Database>,
  input: DiseaseCatalogInput,
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client)
    .from("diseaseCatalog")
    .insert(sanitize({ ...input, companyId: context.companyId, createdBy: context.userId }))
    .select("*")
    .single();
}

export function getVaccineCatalog(client: SupabaseClient<Database>, companyId: string) {
  return vaccinationDb(client)
    .from("vaccineCatalog")
    .select("*")
    .eq("companyId", companyId)
    .order("tradeName", { ascending: true });
}

export function getVaccineDiseaseTargets(client: SupabaseClient<Database>, companyId: string) {
  return vaccinationDb(client)
    .from("vaccineDiseaseTarget")
    .select("*")
    .eq("companyId", companyId);
}

export async function createVaccine(
  client: SupabaseClient<Database>,
  input: VaccineCatalogInput,
  context: { companyId: string; userId: string }
) {
  const { diseaseId, ...vaccineValues } = input;
  const db = vaccinationDb(client);
  const created = await db
    .from("vaccineCatalog")
    .insert(sanitize({ ...vaccineValues, companyId: context.companyId, createdBy: context.userId }))
    .select("*")
    .single();

  if (created.error || !created.data) return created;

  const target = await db.from("vaccineDiseaseTarget").insert({
    companyId: context.companyId,
    vaccineId: created.data.id,
    diseaseId,
    createdBy: context.userId
  });

  if (target.error) {
    await db
      .from("vaccineCatalog")
      .delete()
      .eq("companyId", context.companyId)
      .eq("id", created.data.id);
    return { data: null, error: target.error };
  }

  return created;
}

export function addVaccineDiseaseTarget(
  client: SupabaseClient<Database>,
  input: { vaccineId: string; diseaseId: string },
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client).from("vaccineDiseaseTarget").insert({
    companyId: context.companyId,
    vaccineId: input.vaccineId,
    diseaseId: input.diseaseId,
    createdBy: context.userId
  });
}

export function getDrugCatalog(client: SupabaseClient<Database>, companyId: string) {
  return vaccinationDb(client)
    .from("drugCatalog")
    .select("*")
    .eq("companyId", companyId)
    .order("tradeName", { ascending: true });
}

export function createDrug(
  client: SupabaseClient<Database>,
  input: DrugCatalogInput,
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client)
    .from("drugCatalog")
    .insert(sanitize({ ...input, companyId: context.companyId, createdBy: context.userId }))
    .select("*")
    .single();
}

export function getVaccinationPrograms(client: SupabaseClient<Database>, companyId: string) {
  return vaccinationDb(client)
    .from("vaccinationProgram")
    .select("*")
    .eq("companyId", companyId)
    .order("name", { ascending: true });
}

export function getVaccinationProgram(
  client: SupabaseClient<Database>,
  companyId: string,
  programId: string
) {
  return vaccinationDb(client)
    .from("vaccinationProgram")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", programId)
    .maybeSingle();
}

export function createVaccinationProgram(
  client: SupabaseClient<Database>,
  input: VaccinationProgramInput,
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client)
    .from("vaccinationProgram")
    .insert(
      sanitize({
        ...withoutId(input),
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function updateVaccinationProgram(
  client: SupabaseClient<Database>,
  programId: string,
  input: VaccinationProgramInput,
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client)
    .from("vaccinationProgram")
    .update(
      sanitize({
        ...withoutId(input),
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", programId)
    .select("*")
    .single();
}

export function getVaccinationProgramSteps(
  client: SupabaseClient<Database>,
  companyId: string,
  programId?: string
) {
  let query = vaccinationDb(client)
    .from("vaccinationProgramStep")
    .select("*")
    .eq("companyId", companyId)
    .order("sequenceNo", { ascending: true });

  if (programId) query = query.eq("programId", programId);
  return query;
}

export function getVaccinationProgramStepDiseases(
  client: SupabaseClient<Database>,
  companyId: string
) {
  return vaccinationDb(client)
    .from("vaccinationProgramStepDisease")
    .select("*")
    .eq("companyId", companyId);
}

export async function createVaccinationProgramStep(
  client: SupabaseClient<Database>,
  input: VaccinationProgramStepInput,
  context: { companyId: string; userId: string }
) {
  const { diseaseId, ...stepValues } = input;
  const db = vaccinationDb(client);
  const created = await db
    .from("vaccinationProgramStep")
    .insert(
      sanitize({
        ...withoutId(stepValues),
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();

  if (created.error || !created.data) return created;

  const target = await db.from("vaccinationProgramStepDisease").insert({
    companyId: context.companyId,
    programStepId: created.data.id,
    diseaseId,
    createdBy: context.userId
  });

  if (target.error) {
    await db
      .from("vaccinationProgramStep")
      .delete()
      .eq("companyId", context.companyId)
      .eq("id", created.data.id);
    return { data: null, error: target.error };
  }

  return created;
}

export function addVaccinationProgramStepDisease(
  client: SupabaseClient<Database>,
  input: { programStepId: string; diseaseId: string },
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client).from("vaccinationProgramStepDisease").insert({
    companyId: context.companyId,
    programStepId: input.programStepId,
    diseaseId: input.diseaseId,
    createdBy: context.userId
  });
}

export function assignVaccinationProgram(
  client: SupabaseClient<Database>,
  input: { flockId: string; programId: string; notes?: string },
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client)
    .from("flockVaccinationAssignment")
    .insert(
      sanitize({
        companyId: context.companyId,
        flockId: input.flockId,
        programId: input.programId,
        notes: input.notes,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function getFlockVaccinationAssignments(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId: string
) {
  return vaccinationDb(client)
    .from("flockVaccinationAssignment")
    .select("*")
    .eq("companyId", companyId)
    .eq("flockId", flockId)
    .order("assignedDate", { ascending: false });
}

export function getFlockVaccinationEvents(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId: string
) {
  return vaccinationDb(client)
    .from("flockVaccinationEvent")
    .select("*")
    .eq("companyId", companyId)
    .eq("flockId", flockId)
    .order("scheduledDate", { ascending: true });
}

export function getFlockVaccinationEventDiseases(
  client: SupabaseClient<Database>,
  companyId: string
) {
  return vaccinationDb(client)
    .from("flockVaccinationEventDisease")
    .select("*")
    .eq("companyId", companyId);
}

export function completeFlockVaccinationEvent(
  client: SupabaseClient<Database>,
  input: VaccinationEventCompletionInput,
  context: { companyId: string; userId: string }
) {
  const { eventId, ...values } = input;
  return vaccinationDb(client)
    .from("flockVaccinationEvent")
    .update(
      sanitize({
        ...values,
        status: "Completed",
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", eventId)
    .select("*")
    .single();
}

export function skipFlockVaccinationEvent(
  client: SupabaseClient<Database>,
  input: { eventId: string; notes?: string },
  context: { companyId: string; userId: string }
) {
  return vaccinationDb(client)
    .from("flockVaccinationEvent")
    .update(
      sanitize({
        status: "Skipped",
        notes: input.notes,
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", input.eventId)
    .select("*")
    .single();
}
