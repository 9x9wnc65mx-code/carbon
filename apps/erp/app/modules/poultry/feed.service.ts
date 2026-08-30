import type { Database } from "@carbon/database";
import { now } from "@internationalized/date";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitize } from "~/utils/supabase";
import { farmLocalDateTimeToUtc } from "./health.time";
import type {
  FeedItemProfileInput,
  FeedSpecificationParameterInput,
  FeedTrackedLotProfileInput,
  FlockFeedExposureInput
} from "./feed.models";

function feedDb(client: SupabaseClient<Database>): SupabaseClient<any> {
  return client as unknown as SupabaseClient<any>;
}

function updatedAt() {
  return now("UTC").toAbsoluteString();
}

export function getFeedCandidateItems(
  client: SupabaseClient<Database>,
  companyId: string
) {
  return feedDb(client)
    .from("item")
    .select("id,companyId,name,readableIdWithRevision,itemTrackingType,active")
    .eq("companyId", companyId)
    .eq("active", true)
    .order("name", { ascending: true });
}

export function getFeedItemProfiles(
  client: SupabaseClient<Database>,
  companyId: string
) {
  return feedDb(client)
    .from("feedItemProfile")
    .select("*")
    .eq("companyId", companyId)
    .order("feedClass", { ascending: true });
}

export function createFeedItemProfile(
  client: SupabaseClient<Database>,
  input: FeedItemProfileInput,
  context: { companyId: string; userId: string }
) {
  return feedDb(client)
    .from("feedItemProfile")
    .insert(
      sanitize({
        ...input,
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function updateFeedItemProfile(
  client: SupabaseClient<Database>,
  itemId: string,
  input: FeedItemProfileInput,
  context: { companyId: string; userId: string }
) {
  const { itemId: _itemId, ...values } = input;
  return feedDb(client)
    .from("feedItemProfile")
    .update(
      sanitize({
        ...values,
        updatedBy: context.userId,
        updatedAt: updatedAt()
      })
    )
    .eq("companyId", context.companyId)
    .eq("itemId", itemId)
    .select("*")
    .single();
}

export function getFeedSpecificationParameters(
  client: SupabaseClient<Database>,
  companyId: string,
  itemId?: string
) {
  let query = feedDb(client)
    .from("feedSpecificationParameter")
    .select("*")
    .eq("companyId", companyId)
    .order("sequenceNo", { ascending: true });

  if (itemId) query = query.eq("itemId", itemId);
  return query;
}

export function createFeedSpecificationParameter(
  client: SupabaseClient<Database>,
  input: FeedSpecificationParameterInput,
  context: { companyId: string; userId: string }
) {
  return feedDb(client)
    .from("feedSpecificationParameter")
    .insert(
      sanitize({
        ...input,
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function getFeedTrackedLotProfiles(
  client: SupabaseClient<Database>,
  companyId: string,
  itemId?: string
) {
  let query = feedDb(client)
    .from("feedTrackedLotProfile")
    .select("*")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: false });

  if (itemId) query = query.eq("itemId", itemId);
  return query;
}

export function getFeedTrackedEntities(
  client: SupabaseClient<Database>,
  companyId: string,
  itemIds?: string[]
) {
  let query = feedDb(client)
    .from("trackedEntity")
    .select(
      "id,itemId,readableId,quantity,status,expirationDate,createdAt,attributes"
    )
    .eq("companyId", companyId)
    .order("createdAt", { ascending: false });

  if (itemIds) {
    query = query.in(
      "itemId",
      itemIds.length > 0 ? itemIds : ["__avios_no_feed_items__"]
    );
  }
  return query;
}

export async function saveFeedTrackedLotProfile(
  client: SupabaseClient<Database>,
  input: FeedTrackedLotProfileInput,
  context: { companyId: string; userId: string }
) {
  const db = feedDb(client);
  const existing = await db
    .from("feedTrackedLotProfile")
    .select("trackedEntityId")
    .eq("companyId", context.companyId)
    .eq("trackedEntityId", input.trackedEntityId)
    .maybeSingle();

  if (existing.error) return existing;

  if (existing.data) {
    return db
      .from("feedTrackedLotProfile")
      .update(
        sanitize({
          ...input,
          updatedBy: context.userId,
          updatedAt: updatedAt()
        })
      )
      .eq("companyId", context.companyId)
      .eq("trackedEntityId", input.trackedEntityId)
      .select("*")
      .single();
  }

  return db
    .from("feedTrackedLotProfile")
    .insert(
      sanitize({
        ...input,
        companyId: context.companyId,
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export function getFlockFeedExposures(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId?: string
) {
  let query = feedDb(client)
    .from("flockFeedExposure")
    .select("*")
    .eq("companyId", companyId)
    .order("startedAt", { ascending: false });

  if (flockId) query = query.eq("flockId", flockId);
  return query;
}

export function createFlockFeedExposure(
  client: SupabaseClient<Database>,
  flockId: string,
  input: FlockFeedExposureInput,
  context: { companyId: string; userId: string; timeZone: string }
) {
  const { startedAtLocal, endedAtLocal, ...values } = input;
  return feedDb(client)
    .from("flockFeedExposure")
    .insert(
      sanitize({
        ...values,
        flockId,
        companyId: context.companyId,
        startedAt: farmLocalDateTimeToUtc(startedAtLocal, context.timeZone),
        endedAt: farmLocalDateTimeToUtc(endedAtLocal, context.timeZone),
        createdBy: context.userId
      })
    )
    .select("*")
    .single();
}

export async function getFeedTraceabilitySnapshot(
  client: SupabaseClient<Database>,
  companyId: string,
  flockId?: string
) {
  const profiles = await getFeedItemProfiles(client, companyId);
  const itemIds = (profiles.data ?? []).map((profile) => profile.itemId);

  const [items, lots, lotProfiles, specifications, exposures] = await Promise.all([
    getFeedCandidateItems(client, companyId),
    getFeedTrackedEntities(client, companyId, itemIds),
    getFeedTrackedLotProfiles(client, companyId),
    getFeedSpecificationParameters(client, companyId),
    getFlockFeedExposures(client, companyId, flockId)
  ]);

  return {
    profiles: profiles.data ?? [],
    items: items.data ?? [],
    lots: lots.data ?? [],
    lotProfiles: lotProfiles.data ?? [],
    specifications: specifications.data ?? [],
    exposures: exposures.data ?? [],
    error:
      profiles.error ??
      items.error ??
      lots.error ??
      lotProfiles.error ??
      specifications.error ??
      exposures.error ??
      null
  };
}
