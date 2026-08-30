ALTER TABLE "laboratory"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "labAccession"
ADD COLUMN "sourceTimeZone" TEXT NOT NULL DEFAULT 'UTC';

CREATE OR REPLACE FUNCTION "validateLaboratoryTimezone"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW."timezone") THEN
    RAISE EXCEPTION 'Invalid IANA laboratory timezone: %', NEW."timezone";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "laboratory_validate_timezone"
BEFORE INSERT OR UPDATE OF "timezone" ON "laboratory"
FOR EACH ROW EXECUTE FUNCTION "validateLaboratoryTimezone"();

CREATE OR REPLACE FUNCTION "validateAccessionSourceTimezone"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW."sourceTimeZone") THEN
    RAISE EXCEPTION 'Invalid IANA accession source timezone: %', NEW."sourceTimeZone";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "labAccession_validate_source_timezone"
BEFORE INSERT OR UPDATE OF "sourceTimeZone" ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "validateAccessionSourceTimezone"();

COMMENT ON COLUMN "laboratory"."timezone" IS 'IANA timezone for laboratory-local operations and non-flock sample defaults.';
COMMENT ON COLUMN "labAccession"."sourceTimeZone" IS 'IANA timezone snapshot used to interpret the collection timestamp.';
