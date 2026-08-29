-- Treatment traceability must remain complete even when writes bypass the ERP UI.
-- Require the core regimen and actual-administration dose fields at database level.
ALTER TABLE "flockTreatmentCourse"
  ALTER COLUMN "doseValue" SET NOT NULL,
  ALTER COLUMN "doseUnit" SET NOT NULL,
  ALTER COLUMN "frequency" SET NOT NULL;

ALTER TABLE "flockTreatmentAdministration"
  ALTER COLUMN "doseValue" SET NOT NULL,
  ALTER COLUMN "doseUnit" SET NOT NULL;
