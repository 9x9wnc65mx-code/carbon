import type { Database } from "@carbon/database";
import { now } from "@internationalized/date";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitize } from "~/utils/supabase";
import type {
  FarmInput,
  FlockCycleInput,
  PoultryHouseInput
} from "./poultry.models";

/**
 * These tables enter the generated Database type after the migration is applied
 * and `pnpm run generate:types` is run. Do not hand-edit generated DB types.
 */
function poultryDb(client: SupabaseClient<Database>): SupabaseClient<any> {
  return client as unknown as SupabaseClient<any>;
}

function updatedAt() {
  return now("UTC").toAbsoluteString();
}

function withoutId<T extends { id?: string }>(input: T) {
  const { id: _id, ...values } = input;
  return values;
}

export async function getFarms(
  client: SupabaseClient<Database>,
  companyId: string
) {
  return poultryDb(client)
    .from("farm")
    .select("*")
    .eq("companyId", companyId)
    .order("name", { ascending: true });
}

export async function getFarm(
  client: SupabaseClient<Database>,
  companyId: string,
  farmId: string
) {
  return poultryDb(client)
    .from("farm")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", farmId)
    .maybeSingle();
}

export async function createFarm(
  client: SupabaseClient<Database>,
  input: FarmInput,
  context: { companyId: string; userId: string }
) {
  return poultryDb(client)
    .from("farm")
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

export async function updateFarm(
  client: SupabaseClient<Database>,
  farmId: string,
  input: FarmInput,
  context: { companyId: string; userId: string }
) {
  return poultryDb(client)
    .from("farm")
    .update(
      sanitize({
        ...withoutId(input),
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("id", farmId)
    .eq("companyId", context.companyId)
    .select("*")
    .single();
}

export async function getPoultryHouses(
  client: SupabaseClient<Database>,
  companyId: string,
  farmId?: string
) {
  let query = poultryDb(client)
    .from("poultryHouse")
    .select("*")
    .eq("companyId", companyId)
    .order("name", { ascending: true });

  if (farmId) query = query.eq("farmId", farmId);
  return query;
}

export async function getPoultryHouse(
  client: SupabaseClient<Database>,
  companyId: string,
  houseId: string
) {
  return poultryDb(client)
    .from("poultryHouse")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", houseId)
    .maybeSingle();
}

export async function createPoultryHouse(
  client: SupabaseClient<Database>,
  input: PoultryHouseInput,
  context: { companyId: string; userId: string }
) {
  return poultryDb(client)
    .from("poultryHouse")
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

export async function updatePoultryHouse(
  client: SupabaseClient<Database>,
  houseId: string,
  input: PoultryHouseInput,
  context: { companyId: string; userId: string }
) {
  return poultryDb(client)
    .from("poultryHouse")
    .update(
      sanitize({
        ...withoutId(input),
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("id", houseId)
    .eq("companyId", context.companyId)
    .select("*")
    .single();
}

export async function getFlockCycles(
  client: SupabaseClient<Database>,
  companyId: string
) {
  return poultryDb(client)
    .from("flockCycle")
    .select("*")
    .eq("companyId", companyId)
    .order("placementDate", { ascending: false });
}

export async function getFlockCycle(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId: string
) {
  return poultryDb(client)
    .from("flockCycle")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", flockId)
    .maybeSingle();
}

export async function createFlockCycle(
  client: SupabaseClient<Database>,
  input: FlockCycleInput,
  context: { companyId: string; userId: string }
) {
  return poultryDb(client)
    .from("flockCycle")
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

export async function updateFlockCycle(
  client: SupabaseClient<Database>,
  flockId: string,
  input: FlockCycleInput,
  context: { companyId: string; userId: string }
) {
  return poultryDb(client)
    .from("flockCycle")
    .update(
      sanitize({
        ...withoutId(input),
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("id", flockId)
    .eq("companyId", context.companyId)
    .select("*")
    .single();
}
