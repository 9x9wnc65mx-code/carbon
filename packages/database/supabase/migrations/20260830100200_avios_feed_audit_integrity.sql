-- Feed traceability audit integrity.
-- Lot identity on a LIMS accession and the biological identity of a flock feed
-- exposure are historical facts and must not be silently rewritten.

CREATE OR REPLACE FUNCTION "protectLabAccessionTrackedEntityIdentity"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW."trackedEntityId" IS DISTINCT FROM OLD."trackedEntityId" THEN
    RAISE EXCEPTION 'Laboratory tracked lot identity cannot be changed after accession creation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "labAccession_protect_tracked_entity_identity"
BEFORE UPDATE OF "trackedEntityId" ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "protectLabAccessionTrackedEntityIdentity"();

CREATE OR REPLACE FUNCTION "protectFlockFeedExposureIdentity"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW."companyId" IS DISTINCT FROM OLD."companyId"
     OR NEW."flockId" IS DISTINCT FROM OLD."flockId"
     OR NEW."trackedEntityId" IS DISTINCT FROM OLD."trackedEntityId"
     OR NEW."itemId" IS DISTINCT FROM OLD."itemId"
     OR NEW."startedAt" IS DISTINCT FROM OLD."startedAt"
  THEN
    RAISE EXCEPTION 'Flock feed exposure identity cannot be rewritten after creation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "flockFeedExposure_protect_identity"
BEFORE UPDATE ON "flockFeedExposure"
FOR EACH ROW EXECUTE FUNCTION "protectFlockFeedExposureIdentity"();

COMMENT ON FUNCTION "protectLabAccessionTrackedEntityIdentity"() IS
'Locks the sampled Carbon tracked lot identity on an existing LIMS accession.';
COMMENT ON FUNCTION "protectFlockFeedExposureIdentity"() IS
'Locks flock, Carbon lot, item and exposure start identity while permitting follow-up fields such as end time and notes.';
