-- Keep preferred vaccines and disease targets clinically coherent at the DB boundary.
-- A program step may have no preferred product, but if a product is selected it
-- must be cataloged as targeting every disease attached to that step.

CREATE OR REPLACE FUNCTION "validateVaccinationStepDiseaseTarget"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  preferred_vaccine_id TEXT;
BEGIN
  SELECT "vaccineId"
    INTO preferred_vaccine_id
  FROM "vaccinationProgramStep"
  WHERE "id" = NEW."programStepId"
    AND "companyId" = NEW."companyId";

  IF preferred_vaccine_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "vaccineDiseaseTarget"
    WHERE "companyId" = NEW."companyId"
      AND "vaccineId" = preferred_vaccine_id
      AND "diseaseId" = NEW."diseaseId"
  ) THEN
    RAISE EXCEPTION 'Preferred vaccine does not target the selected disease';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "vaccinationProgramStepDisease_validate_target"
BEFORE INSERT OR UPDATE ON "vaccinationProgramStepDisease"
FOR EACH ROW EXECUTE FUNCTION "validateVaccinationStepDiseaseTarget"();

CREATE OR REPLACE FUNCTION "validateVaccinationStepPreferredVaccine"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."vaccineId" IS NOT NULL AND EXISTS (
    SELECT 1
    FROM "vaccinationProgramStepDisease" step_disease
    WHERE step_disease."companyId" = NEW."companyId"
      AND step_disease."programStepId" = NEW."id"
      AND NOT EXISTS (
        SELECT 1
        FROM "vaccineDiseaseTarget" vaccine_target
        WHERE vaccine_target."companyId" = NEW."companyId"
          AND vaccine_target."vaccineId" = NEW."vaccineId"
          AND vaccine_target."diseaseId" = step_disease."diseaseId"
      )
  ) THEN
    RAISE EXCEPTION 'Preferred vaccine does not cover all diseases targeted by this program step';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "vaccinationProgramStep_validate_preferred_vaccine"
BEFORE UPDATE OF "vaccineId" ON "vaccinationProgramStep"
FOR EACH ROW EXECUTE FUNCTION "validateVaccinationStepPreferredVaccine"();

CREATE OR REPLACE FUNCTION "protectVaccinationTargetInUse"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "vaccinationProgramStep" step
    JOIN "vaccinationProgramStepDisease" step_disease
      ON step_disease."companyId" = step."companyId"
     AND step_disease."programStepId" = step."id"
    WHERE step."companyId" = OLD."companyId"
      AND step."vaccineId" = OLD."vaccineId"
      AND step_disease."diseaseId" = OLD."diseaseId"
  ) THEN
    RAISE EXCEPTION 'Vaccine disease target is used by a vaccination program step';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER "vaccineDiseaseTarget_protect_in_use"
BEFORE DELETE ON "vaccineDiseaseTarget"
FOR EACH ROW EXECUTE FUNCTION "protectVaccinationTargetInUse"();
