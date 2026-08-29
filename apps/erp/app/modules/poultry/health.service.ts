import type { Database } from "@carbon/database";
import { now } from "@internationalized/date";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitize } from "~/utils/supabase";
import type {
  ClinicalEventInput,
  ClinicalEventResolutionInput,
  TreatmentAdministrationInput,
  TreatmentCourseInput,
  TreatmentStatusInput
} from "./health.models";
import { farmLocalDateTimeToUtc } from "./health.time";

function healthDb(client: SupabaseClient<Database>): SupabaseClient<any> {
  return client as unknown as SupabaseClient<any>;
}

function updatedAt() {
  return now("UTC").toAbsoluteString();
}

export function getFlockClinicalEvents(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId: string
) {
  return healthDb(client)
    .from("flockClinicalEvent")
    .select("*")
    .eq("companyId", companyId)
    .eq("flockId", flockId)
    .order("observedAt", { ascending: false });
}

export function getFlockClinicalEventDiseases(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId?: string
) {
  let query = healthDb(client)
    .from("flockClinicalEventDisease")
    .select("*, flockClinicalEvent!inner(flockId)")
    .eq("companyId", companyId);
  if (flockId) query = query.eq("flockClinicalEvent.flockId", flockId);
  return query;
}

export async function createFlockClinicalEvent(
  client: SupabaseClient<Database>,
  flockId: string,
  input: ClinicalEventInput,
  context: { companyId: string; userId: string; timeZone: string }
) {
  const { diseaseId, diagnosisRole, observedAtLocal, ...values } = input;
  const db = healthDb(client);
  const created = await db
    .from("flockClinicalEvent")
    .insert(
      sanitize({
        ...values,
        companyId: context.companyId,
        flockId,
        observedAt: farmLocalDateTimeToUtc(observedAtLocal, context.timeZone),
        createdBy: context.userId
      })
    )
    .select("*")
    .single();

  if (created.error || !created.data || !diseaseId) return created;

  const diseaseLink = await db.from("flockClinicalEventDisease").insert({
    companyId: context.companyId,
    clinicalEventId: created.data.id,
    diseaseId,
    diagnosisRole: diagnosisRole ?? "Suspected",
    createdBy: context.userId
  });

  if (diseaseLink.error) {
    await db
      .from("flockClinicalEvent")
      .delete()
      .eq("companyId", context.companyId)
      .eq("id", created.data.id);
    return { data: null, error: diseaseLink.error };
  }

  return created;
}

export function resolveFlockClinicalEvent(
  client: SupabaseClient<Database>,
  input: ClinicalEventResolutionInput,
  context: { companyId: string; userId: string; timeZone: string }
) {
  const { eventId, resolvedAtLocal, ...values } = input;
  return healthDb(client)
    .from("flockClinicalEvent")
    .update(
      sanitize({
        ...values,
        resolvedAt:
          values.status === "Resolved"
            ? farmLocalDateTimeToUtc(resolvedAtLocal, context.timeZone) ?? updatedAt()
            : undefined,
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", eventId)
    .select("*")
    .single();
}

export function getFlockTreatmentCourses(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId: string
) {
  return healthDb(client)
    .from("flockTreatmentCourse")
    .select("*")
    .eq("companyId", companyId)
    .eq("flockId", flockId)
    .order("prescribedAt", { ascending: false });
}

export function getFlockTreatmentAdministrations(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId: string
) {
  return healthDb(client)
    .from("flockTreatmentAdministration")
    .select("*")
    .eq("companyId", companyId)
    .eq("flockId", flockId)
    .order("administeredAt", { ascending: false });
}

export function createFlockTreatmentCourse(
  client: SupabaseClient<Database>,
  flockId: string,
  input: TreatmentCourseInput,
  context: { companyId: string; userId: string; timeZone: string }
) {
  const {
    prescribedAtLocal,
    plannedStartAtLocal,
    plannedEndAtLocal,
    ...values
  } = input;
  return healthDb(client)
    .from("flockTreatmentCourse")
    .insert(
      sanitize({
        ...values,
        companyId: context.companyId,
        flockId,
        prescribedAt: farmLocalDateTimeToUtc(prescribedAtLocal, context.timeZone),
        plannedStartAt: farmLocalDateTimeToUtc(plannedStartAtLocal, context.timeZone),
        plannedEndAt: farmLocalDateTimeToUtc(plannedEndAtLocal, context.timeZone),
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function recordFlockTreatmentAdministration(
  client: SupabaseClient<Database>,
  flockId: string,
  input: TreatmentAdministrationInput,
  context: { companyId: string; userId: string; timeZone: string }
) {
  const { administeredAtLocal, ...values } = input;
  return healthDb(client)
    .from("flockTreatmentAdministration")
    .insert(
      sanitize({
        ...values,
        companyId: context.companyId,
        flockId,
        administeredAt: farmLocalDateTimeToUtc(administeredAtLocal, context.timeZone),
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function updateFlockTreatmentStatus(
  client: SupabaseClient<Database>,
  input: TreatmentStatusInput,
  context: { companyId: string; userId: string }
) {
  const { courseId, ...values } = input;
  return healthDb(client)
    .from("flockTreatmentCourse")
    .update(
      sanitize({
        ...values,
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", courseId)
    .select("*")
    .single();
}