-- Harden flock vaccination assignment at the database boundary.
-- This replaces the schedule trigger function created in the previous migration.

CREATE OR REPLACE FUNCTION "generateFlockVaccinationSchedule"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  placement_date DATE;
  flock_type TEXT;
  program_status TEXT;
  program_flock_type TEXT;
  program_step_count INTEGER;
BEGIN
  SELECT "placementDate", "flockType"
    INTO placement_date, flock_type
  FROM "flockCycle"
  WHERE "id" = NEW."flockId"
    AND "companyId" = NEW."companyId";

  IF placement_date IS NULL THEN
    RAISE EXCEPTION 'Flock placement date is required to generate vaccination schedule';
  END IF;

  SELECT "status", "flockType"
    INTO program_status, program_flock_type
  FROM "vaccinationProgram"
  WHERE "id" = NEW."programId"
    AND "companyId" = NEW."companyId";

  IF program_status IS NULL THEN
    RAISE EXCEPTION 'Vaccination program was not found';
  END IF;

  IF program_status <> 'Active' THEN
    RAISE EXCEPTION 'Only active vaccination programs can be assigned to a flock';
  END IF;

  IF program_flock_type <> 'Other' AND program_flock_type <> flock_type THEN
    RAISE EXCEPTION 'Vaccination program flock type does not match the selected flock';
  END IF;

  SELECT COUNT(*)
    INTO program_step_count
  FROM "vaccinationProgramStep"
  WHERE "companyId" = NEW."companyId"
    AND "programId" = NEW."programId";

  IF program_step_count = 0 THEN
    RAISE EXCEPTION 'Vaccination program must contain at least one schedule step before assignment';
  END IF;

  INSERT INTO "flockVaccinationEvent" (
    "companyId", "assignmentId", "flockId", "programStepId",
    "scheduledDate", "status", "vaccineId", "route", "doseValue",
    "doseUnit", "createdBy"
  )
  SELECT
    NEW."companyId",
    NEW."id",
    NEW."flockId",
    step."id",
    placement_date + step."targetAgeDays",
    'Planned',
    step."vaccineId",
    step."route",
    step."doseValue",
    step."doseUnit",
    NEW."createdBy"
  FROM "vaccinationProgramStep" step
  WHERE step."companyId" = NEW."companyId"
    AND step."programId" = NEW."programId"
  ORDER BY step."sequenceNo";

  INSERT INTO "flockVaccinationEventDisease" (
    "companyId", "eventId", "diseaseId", "createdBy"
  )
  SELECT
    NEW."companyId",
    event."id",
    target."diseaseId",
    NEW."createdBy"
  FROM "flockVaccinationEvent" event
  JOIN "vaccinationProgramStepDisease" target
    ON target."companyId" = event."companyId"
   AND target."programStepId" = event."programStepId"
  WHERE event."companyId" = NEW."companyId"
    AND event."assignmentId" = NEW."id";

  RETURN NEW;
END;
$$;
