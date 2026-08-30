import type { Database } from "@carbon/database";
import { now } from "@internationalized/date";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitize } from "~/utils/supabase";
import { farmLocalDateTimeToUtc } from "./health.time";
import type {
  LabAccessionInput,
  LabAccessionStatusInput,
  LaboratoryInput,
  LabResultEntryInput,
  LabSpecimenInput,
  LabTestDefinitionInput,
  LabTestDiseaseTargetInput,
  LabTestOrderInput,
  LabTestOrderStatusInput,
  LabTestParameterInput
} from "./laboratory.models";

function labDb(client: SupabaseClient<Database>): SupabaseClient<any> {
  return client as unknown as SupabaseClient<any>;
}

function updatedAt() {
  return now("UTC").toAbsoluteString();
}

function withoutId<T extends { id?: string }>(input: T) {
  const values = { ...input };
  delete values.id;
  return values;
}

function qualitativeOptions(input: LabTestParameterInput) {
  if (input.resultType === "Positive/Negative") return ["Positive", "Negative"];
  if (input.resultType === "Detected/Not Detected") return ["Detected", "Not Detected"];
  if (input.resultType !== "Qualitative" || !input.qualitativeOptionsText) return undefined;
  return Array.from(
    new Set(
      input.qualitativeOptionsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function getLaboratories(client: SupabaseClient<Database>, companyId: string) {
  return labDb(client)
    .from("laboratory")
    .select("*")
    .eq("companyId", companyId)
    .order("name", { ascending: true });
}

export function getLaboratory(
  client: SupabaseClient<Database>,
  companyId: string,
  laboratoryId: string
) {
  return labDb(client)
    .from("laboratory")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", laboratoryId)
    .maybeSingle();
}

export function createLaboratory(
  client: SupabaseClient<Database>,
  input: LaboratoryInput,
  context: { companyId: string; userId: string }
) {
  return labDb(client)
    .from("laboratory")
    .insert(sanitize({ ...withoutId(input), companyId: context.companyId, createdBy: context.userId }))
    .select("*")
    .single();
}

export function updateLaboratory(
  client: SupabaseClient<Database>,
  laboratoryId: string,
  input: LaboratoryInput,
  context: { companyId: string; userId: string }
) {
  return labDb(client)
    .from("laboratory")
    .update(sanitize({ ...withoutId(input), updatedBy: context.userId, updatedAt: updatedAt() }))
    .eq("companyId", context.companyId)
    .eq("id", laboratoryId)
    .select("*")
    .single();
}

export function getLabTestDefinitions(
  client: SupabaseClient<Database>,
  companyId: string,
  laboratoryId?: string
) {
  let query = labDb(client)
    .from("labTestDefinition")
    .select("*")
    .eq("companyId", companyId)
    .order("name", { ascending: true });
  if (laboratoryId) query = query.eq("laboratoryId", laboratoryId);
  return query;
}

export function getLabTestDefinition(
  client: SupabaseClient<Database>,
  companyId: string,
  testDefinitionId: string
) {
  return labDb(client)
    .from("labTestDefinition")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", testDefinitionId)
    .maybeSingle();
}

export function createLabTestDefinition(
  client: SupabaseClient<Database>,
  input: LabTestDefinitionInput,
  context: { companyId: string; userId: string }
) {
  const values = withoutId(input);
  return labDb(client)
    .from("labTestDefinition")
    .insert(
      sanitize({
        ...values,
        status: "Draft",
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function updateLabTestDefinition(
  client: SupabaseClient<Database>,
  testDefinitionId: string,
  input: LabTestDefinitionInput,
  context: { companyId: string; userId: string }
) {
  return labDb(client)
    .from("labTestDefinition")
    .update(
      sanitize({
        ...withoutId(input),
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", testDefinitionId)
    .select("*")
    .single();
}

export function getLabTestParameters(
  client: SupabaseClient<Database>,
  companyId: string,
  testDefinitionId?: string
) {
  let query = labDb(client)
    .from("labTestParameter")
    .select("*")
    .eq("companyId", companyId)
    .order("sequenceNo", { ascending: true });
  if (testDefinitionId) query = query.eq("testDefinitionId", testDefinitionId);
  return query;
}

export function createLabTestParameter(
  client: SupabaseClient<Database>,
  input: LabTestParameterInput,
  context: { companyId: string; userId: string }
) {
  const { qualitativeOptionsText: _qualitativeOptionsText, ...values } = input;
  return labDb(client)
    .from("labTestParameter")
    .insert(
      sanitize({
        ...values,
        qualitativeOptions: qualitativeOptions(input),
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function getLabTestDiseaseTargets(
  client: SupabaseClient<Database>,
  companyId: string,
  testDefinitionId?: string
) {
  let query = labDb(client)
    .from("labTestDiseaseTarget")
    .select("*")
    .eq("companyId", companyId);
  if (testDefinitionId) query = query.eq("testDefinitionId", testDefinitionId);
  return query;
}

export function addLabTestDiseaseTarget(
  client: SupabaseClient<Database>,
  input: LabTestDiseaseTargetInput,
  context: { companyId: string; userId: string }
) {
  return labDb(client).from("labTestDiseaseTarget").insert({
    ...input,
    companyId: context.companyId,
    createdBy: context.userId
  });
}

export function getLabAccessions(
  client: SupabaseClient<Database>,
  companyId: string,
  filters?: {
    laboratoryId?: string;
    flockId?: string;
    trackedEntityId?: string;
  }
) {
  let query = labDb(client)
    .from("labAccession")
    .select("*")
    .eq("companyId", companyId)
    .order("collectedAt", { ascending: false });
  if (filters?.laboratoryId) query = query.eq("laboratoryId", filters.laboratoryId);
  if (filters?.flockId) query = query.eq("flockId", filters.flockId);
  if (filters?.trackedEntityId) query = query.eq("trackedEntityId", filters.trackedEntityId);
  return query;
}

export function getLabAccession(
  client: SupabaseClient<Database>,
  companyId: string,
  accessionId: string
) {
  return labDb(client)
    .from("labAccession")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", accessionId)
    .maybeSingle();
}

export function createLabAccession(
  client: SupabaseClient<Database>,
  input: LabAccessionInput,
  context: { companyId: string; userId: string; sourceTimeZone: string }
) {
  const { collectedAtLocal, receivedAtLocal, ...values } = input;
  return labDb(client)
    .from("labAccession")
    .insert(
      sanitize({
        ...values,
        companyId: context.companyId,
        sourceTimeZone: context.sourceTimeZone,
        collectedAt: farmLocalDateTimeToUtc(collectedAtLocal, context.sourceTimeZone),
        receivedAt: farmLocalDateTimeToUtc(receivedAtLocal, context.sourceTimeZone),
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function updateLabAccessionStatus(
  client: SupabaseClient<Database>,
  input: LabAccessionStatusInput,
  context: { companyId: string; userId: string; sourceTimeZone: string }
) {
  const { accessionId, receivedAtLocal, ...values } = input;
  return labDb(client)
    .from("labAccession")
    .update(
      sanitize({
        ...values,
        receivedAt:
          values.status === "Received"
            ? farmLocalDateTimeToUtc(receivedAtLocal, context.sourceTimeZone) ?? updatedAt()
            : undefined,
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", accessionId)
    .select("*")
    .single();
}

export function getLabSpecimens(
  client: SupabaseClient<Database>,
  companyId: string,
  accessionId?: string
) {
  let query = labDb(client)
    .from("labSpecimen")
    .select("*")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: true });
  if (accessionId) query = query.eq("accessionId", accessionId);
  return query;
}

export function createLabSpecimen(
  client: SupabaseClient<Database>,
  input: LabSpecimenInput,
  context: { companyId: string; userId: string }
) {
  return labDb(client)
    .from("labSpecimen")
    .insert(sanitize({ ...input, companyId: context.companyId, createdBy: context.userId }))
    .select("*")
    .single();
}

export function getLabTestOrders(
  client: SupabaseClient<Database>,
  companyId: string,
  accessionId?: string
) {
  let query = labDb(client)
    .from("labTestOrder")
    .select("*")
    .eq("companyId", companyId)
    .order("requestedAt", { ascending: true });
  if (accessionId) query = query.eq("accessionId", accessionId);
  return query;
}

export async function createLabTestOrder(
  client: SupabaseClient<Database>,
  input: LabTestOrderInput,
  context: { companyId: string; userId: string }
) {
  const db = labDb(client);
  const accession = await db
    .from("labAccession")
    .select("id, laboratoryId")
    .eq("companyId", context.companyId)
    .eq("id", input.accessionId)
    .maybeSingle();
  if (accession.error || !accession.data) return accession;

  return db
    .from("labTestOrder")
    .insert(
      sanitize({
        ...input,
        laboratoryId: accession.data.laboratoryId,
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function updateLabTestOrderStatus(
  client: SupabaseClient<Database>,
  input: LabTestOrderStatusInput,
  context: { companyId: string; userId: string }
) {
  const { orderId, ...values } = input;
  return labDb(client)
    .from("labTestOrder")
    .update(
      sanitize({
        ...values,
        startedAt: values.status === "In Progress" ? updatedAt() : undefined,
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("id", orderId)
    .select("*")
    .single();
}

export function getLabResults(
  client: SupabaseClient<Database>,
  companyId: string,
  testOrderIds?: string | string[]
) {
  let query = labDb(client)
    .from("labResult")
    .select("*")
    .eq("companyId", companyId)
    .order("sequenceNo", { ascending: true });

  if (Array.isArray(testOrderIds)) {
    query = query.in(
      "testOrderId",
      testOrderIds.length > 0 ? testOrderIds : ["__avios_no_test_orders__"]
    );
  } else if (testOrderIds) {
    query = query.eq("testOrderId", testOrderIds);
  }
  return query;
}

export async function enterLabResult(
  client: SupabaseClient<Database>,
  input: LabResultEntryInput,
  context: { companyId: string; userId: string }
) {
  const db = labDb(client);
  const result = await db
    .from("labResult")
    .select("*")
    .eq("companyId", context.companyId)
    .eq("id", input.resultId)
    .maybeSingle();
  if (result.error || !result.data) return result;

  const values: Record<string, unknown> = {
    numericValue: null,
    textValue: null,
    qualitativeValue: null,
    booleanValue: null,
    resultFlag: input.resultFlag,
    comment: input.comment,
    status: "Entered",
    enteredBy: context.userId,
    enteredAt: updatedAt(),
    verifiedBy: null,
    verifiedAt: null,
    updatedAt: updatedAt()
  };

  switch (result.data.resultTypeSnapshot) {
    case "Numeric":
    case "Titer":
    case "Ct": {
      const numericValue = Number(input.value);
      if (!Number.isFinite(numericValue)) {
        return { data: null, error: new Error("This laboratory parameter requires a numeric value") };
      }
      values.numericValue = numericValue;
      break;
    }
    case "Boolean":
      if (!["true", "false"].includes(input.value.toLowerCase())) {
        return { data: null, error: new Error("Boolean laboratory results must be true or false") };
      }
      values.booleanValue = input.value.toLowerCase() === "true";
      break;
    case "Text":
      values.textValue = input.value;
      break;
    default:
      values.qualitativeValue = input.value;
  }

  return db
    .from("labResult")
    .update(sanitize(values))
    .eq("companyId", context.companyId)
    .eq("id", input.resultId)
    .select("*")
    .single();
}

export async function verifyLabResult(
  client: SupabaseClient<Database>,
  resultId: string,
  context: { companyId: string; userId: string }
) {
  const db = labDb(client);
  const result = await db
    .from("labResult")
    .select("status")
    .eq("companyId", context.companyId)
    .eq("id", resultId)
    .maybeSingle();
  if (result.error || !result.data) return result;
  if (result.data.status !== "Entered") {
    return {
      data: null,
      error: new Error("Only entered laboratory results can be verified")
    };
  }

  return db
    .from("labResult")
    .update({
      status: "Verified",
      verifiedBy: context.userId,
      verifiedAt: updatedAt(),
      updatedAt: updatedAt()
    })
    .eq("companyId", context.companyId)
    .eq("id", resultId)
    .select("*")
    .single();
}
