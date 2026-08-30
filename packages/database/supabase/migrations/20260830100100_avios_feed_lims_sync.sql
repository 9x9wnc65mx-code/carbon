-- Keep feed lot sampling metadata derived from the linked LIMS accession lifecycle.
-- This does not alter Carbon trackedEntity inventory status or quantity.

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

  next_status := CASE NEW."status"
    WHEN 'In Progress' THEN 'Testing'
    WHEN 'Completed' THEN 'Completed'
    ELSE 'Sampled'
  END;

  UPDATE "feedTrackedLotProfile"
  SET "samplingStatus" = next_status,
      "updatedAt" = NOW()
  WHERE "trackedEntityId" = NEW."trackedEntityId"
    AND "companyId" = NEW."companyId"
    AND (
      "samplingStatus" <> 'Completed'
      OR next_status = 'Completed'
    );

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
'Derives AVIOS feed lot sampling state from linked LIMS accessions without mutating Carbon inventory disposition.';
