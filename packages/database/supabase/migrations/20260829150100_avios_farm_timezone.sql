-- Operational timestamps are entered in farm-local time and persisted as UTC.
-- Store an IANA timezone on the physical farm/site so health, lab, hatchery and
-- slaughter workflows can convert consistently without browser/server guesses.

ALTER TABLE "farm"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

CREATE OR REPLACE FUNCTION "validateFarmTimezone"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_timezone_names
    WHERE name = NEW."timezone"
  ) THEN
    RAISE EXCEPTION 'Invalid IANA timezone: %', NEW."timezone";
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "farm_validate_timezone"
BEFORE INSERT OR UPDATE OF "timezone" ON "farm"
FOR EACH ROW EXECUTE FUNCTION "validateFarmTimezone"();

COMMENT ON COLUMN "farm"."timezone" IS 'IANA timezone used to convert farm-local operational timestamps to UTC.';
