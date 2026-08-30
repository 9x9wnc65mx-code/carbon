-- Keep feed lot sampling metadata derived from the linked LIMS accession lifecycle.
-- This does not alter Carbon trackedEntity inventory status or quantity.
-- The status is aggregated across every accession for a lot, so opening a second
-- accession cannot incorrectly downgrade an already testing/completed lot.

CREATE OR REPLACE FUNCTION "syncFeedLotSamplingFromAccession"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  next_status TEXT;
BEGIN
  IF NEW."sourceType" <> 'Feed' OR NEW."trackedEntityId" IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "labAccession"
    WHERE "companyId" = NEW."companyId"
      AND "trackedEntityId" = NEW."trackedEntityId"
      AND "sourceType" = 'Feed'
      AND "status" IN ('Received', 'In Progress')
  ) THEN
    next_status := 'Testing';
  ELSIF EXISTS (
    SELECT 1
    FROM "labAccession"
    WHERE "companyId" = NEW."companyId"
      AND "trackedEntityId" = NEW."trackedEntityId"
      AND "sourceType" = 'Feed'
      AND "status" IN ('Collected', 'In Transit')
  ) THEN
    next_status := 'Sampled';
  ELSIF EXISTS (
    SELECT 1
    FROM "labAccession"
    WHERE "companyId" = NEW."companyId"
      AND "trackedEntityId" = NEW."trackedEntityId"
      AND "sourceType" = 'Feed'
      AND "status" = 'Completed'
  ) THEN
    next_status := 'Completed';
  ELSE
    -- Rejected/cancelled accessions still prove that the lot was sampled/handled.
    next_status := 'Sampled';
  END IF;

  UPDATE "feedTrackedLotProfile"
  SET "samplingStatus" = next_status,
      "updatedAt" = NOW()
  WHERE "trackedEntityId" = NEW."trackedEntityId"
    AND "companyId" = NEW."companyId";

  RETURN NEW;
END;
$$;

CREATE TRIGGER "labAccession_sync_feed_sampling_insert"
AFTER INSERT ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "syncFeedLotSamplingFromAccession"();

CREATE TRIGGER "labAccession_sync_feed_sampling_update"
AFTER UPDATE OF "status", "trackedEntityId", "sourceType" ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "syncFeedLotSamplingFromAccession"();

COMMENT ON FUNCTION "syncFeedLotSamplingFromAccession"() IS
'Derives aggregate AVIOS feed lot sampling state from all linked LIMS accessions without mutating Carbon inventory disposition.';
