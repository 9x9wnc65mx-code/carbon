-- AVIOS flock health: clinical cases, diagnoses, treatment courses,
-- actual administrations and withdrawal-period safety.

CREATE TABLE "flockClinicalEvent" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "flockId" TEXT NOT NULL,
  "caseReference" TEXT NOT NULL,
  "observedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "eventType" TEXT NOT NULL DEFAULT 'Clinical Observation',
  "bodySystem" TEXT NOT NULL DEFAULT 'Mixed',
  "severity" TEXT NOT NULL DEFAULT 'Moderate',
  "title" TEXT NOT NULL,
  "clinicalSigns" TEXT,
  "affectedBirdCount" INTEGER,
  "mortalityCount" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE CASCADE,
  CONSTRAINT "flockClinicalEvent_eventType_check" CHECK ("eventType" IN ('Clinical Observation', 'Diagnosis', 'Necropsy', 'Mortality Investigation', 'Follow-up', 'Other')),
  CONSTRAINT "flockClinicalEvent_bodySystem_check" CHECK ("bodySystem" IN ('Respiratory', 'Enteric', 'Locomotor', 'Nervous', 'Systemic', 'Reproductive', 'Mixed', 'Other')),
  CONSTRAINT "flockClinicalEvent_severity_check" CHECK ("severity" IN ('Mild', 'Moderate', 'Severe', 'Critical')),
  CONSTRAINT "flockClinicalEvent_status_check" CHECK ("status" IN ('Open', 'Monitoring', 'Resolved', 'Closed')),
  CONSTRAINT "flockClinicalEvent_affected_check" CHECK ("affectedBirdCount" IS NULL OR "affectedBirdCount" >= 0),
  CONSTRAINT "flockClinicalEvent_mortality_check" CHECK ("mortalityCount" IS NULL OR "mortalityCount" >= 0),
  CONSTRAINT "flockClinicalEvent_resolution_check" CHECK ("status" <> 'Resolved' OR "resolvedAt" IS NOT NULL),
  CONSTRAINT "flockClinicalEvent_company_case_key" UNIQUE ("companyId", "caseReference")
);
CREATE INDEX "flockClinicalEvent_companyId_idx" ON "flockClinicalEvent" ("companyId");
CREATE INDEX "flockClinicalEvent_flockId_idx" ON "flockClinicalEvent" ("flockId");
CREATE INDEX "flockClinicalEvent_status_idx" ON "flockClinicalEvent" ("companyId", "status");
CREATE INDEX "flockClinicalEvent_observedAt_idx" ON "flockClinicalEvent" ("companyId", "observedAt");
CREATE INDEX "flockClinicalEvent_createdBy_idx" ON "flockClinicalEvent" ("createdBy");
CREATE INDEX "flockClinicalEvent_updatedBy_idx" ON "flockClinicalEvent" ("updatedBy");

CREATE TABLE "flockClinicalEventDisease" (
  "companyId" TEXT NOT NULL,
  "clinicalEventId" TEXT NOT NULL,
  "diseaseId" TEXT NOT NULL,
  "diagnosisRole" TEXT NOT NULL DEFAULT 'Suspected',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("clinicalEventId", "diseaseId", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("clinicalEventId", "companyId") REFERENCES "flockClinicalEvent"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("diseaseId", "companyId") REFERENCES "diseaseCatalog"("id", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "flockClinicalEventDisease_role_check" CHECK ("diagnosisRole" IN ('Suspected', 'Confirmed', 'Differential', 'Ruled Out'))
);
CREATE INDEX "flockClinicalEventDisease_companyId_idx" ON "flockClinicalEventDisease" ("companyId");
CREATE INDEX "flockClinicalEventDisease_diseaseId_idx" ON "flockClinicalEventDisease" ("diseaseId");

CREATE TABLE "flockTreatmentCourse" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "flockId" TEXT NOT NULL,
  "clinicalEventId" TEXT,
  "drugId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Planned',
  "indication" TEXT NOT NULL,
  "prescribedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "plannedStartAt" TIMESTAMP WITH TIME ZONE,
  "plannedEndAt" TIMESTAMP WITH TIME ZONE,
  "route" TEXT NOT NULL,
  "doseValue" NUMERIC,
  "doseUnit" TEXT,
  "frequency" TEXT,
  "drugTradeNameSnapshot" TEXT NOT NULL,
  "activeIngredientSnapshot" TEXT,
  "meatWithdrawalDaysSnapshot" INTEGER,
  "eggWithdrawalDaysSnapshot" INTEGER,
  "lastAdministrationAt" TIMESTAMP WITH TIME ZONE,
  "meatWithdrawalUntil" TIMESTAMP WITH TIME ZONE,
  "eggWithdrawalUntil" TIMESTAMP WITH TIME ZONE,
  "prescribedBy" TEXT,
  "outcome" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("clinicalEventId", "companyId") REFERENCES "flockClinicalEvent"("id", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("drugId", "companyId") REFERENCES "drugCatalog"("id", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "flockTreatmentCourse_status_check" CHECK ("status" IN ('Planned', 'Active', 'Completed', 'Stopped', 'Cancelled')),
  CONSTRAINT "flockTreatmentCourse_dose_check" CHECK ("doseValue" IS NULL OR "doseValue" > 0),
  CONSTRAINT "flockTreatmentCourse_dates_check" CHECK ("plannedEndAt" IS NULL OR "plannedStartAt" IS NULL OR "plannedEndAt" >= "plannedStartAt"),
  CONSTRAINT "flockTreatmentCourse_meatWithdrawal_check" CHECK ("meatWithdrawalDaysSnapshot" IS NULL OR "meatWithdrawalDaysSnapshot" >= 0),
  CONSTRAINT "flockTreatmentCourse_eggWithdrawal_check" CHECK ("eggWithdrawalDaysSnapshot" IS NULL OR "eggWithdrawalDaysSnapshot" >= 0),
  CONSTRAINT "flockTreatmentCourse_id_flock_company_key" UNIQUE ("id", "flockId", "companyId")
);
CREATE INDEX "flockTreatmentCourse_companyId_idx" ON "flockTreatmentCourse" ("companyId");
CREATE INDEX "flockTreatmentCourse_flockId_idx" ON "flockTreatmentCourse" ("flockId");
CREATE INDEX "flockTreatmentCourse_clinicalEventId_idx" ON "flockTreatmentCourse" ("clinicalEventId");
CREATE INDEX "flockTreatmentCourse_drugId_idx" ON "flockTreatmentCourse" ("drugId");
CREATE INDEX "flockTreatmentCourse_status_idx" ON "flockTreatmentCourse" ("companyId", "status");
CREATE INDEX "flockTreatmentCourse_meatWithdrawalUntil_idx" ON "flockTreatmentCourse" ("companyId", "meatWithdrawalUntil");
CREATE INDEX "flockTreatmentCourse_eggWithdrawalUntil_idx" ON "flockTreatmentCourse" ("companyId", "eggWithdrawalUntil");
CREATE INDEX "flockTreatmentCourse_createdBy_idx" ON "flockTreatmentCourse" ("createdBy");
CREATE INDEX "flockTreatmentCourse_updatedBy_idx" ON "flockTreatmentCourse" ("updatedBy");

CREATE TABLE "flockTreatmentAdministration" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "flockId" TEXT NOT NULL,
  "administeredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "route" TEXT NOT NULL,
  "doseValue" NUMERIC,
  "doseUnit" TEXT,
  "productBatch" TEXT,
  "expiryDate" DATE,
  "performedBy" TEXT,
  "birdsTreated" INTEGER,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("courseId", "flockId", "companyId") REFERENCES "flockTreatmentCourse"("id", "flockId", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE CASCADE,
  CONSTRAINT "flockTreatmentAdministration_dose_check" CHECK ("doseValue" IS NULL OR "doseValue" > 0),
  CONSTRAINT "flockTreatmentAdministration_birds_check" CHECK ("birdsTreated" IS NULL OR "birdsTreated" > 0)
);
CREATE INDEX "flockTreatmentAdministration_companyId_idx" ON "flockTreatmentAdministration" ("companyId");
CREATE INDEX "flockTreatmentAdministration_courseId_idx" ON "flockTreatmentAdministration" ("courseId");
CREATE INDEX "flockTreatmentAdministration_flockId_idx" ON "flockTreatmentAdministration" ("flockId");
CREATE INDEX "flockTreatmentAdministration_administeredAt_idx" ON "flockTreatmentAdministration" ("companyId", "administeredAt");
CREATE INDEX "flockTreatmentAdministration_createdBy_idx" ON "flockTreatmentAdministration" ("createdBy");
CREATE INDEX "flockTreatmentAdministration_updatedBy_idx" ON "flockTreatmentAdministration" ("updatedBy");

-- Snapshot drug/withdrawal metadata so historical treatment safety does not
-- change when the product catalog is edited later.
CREATE OR REPLACE FUNCTION "snapshotTreatmentDrugMetadata"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  drug_record RECORD;
BEGIN
  SELECT "tradeName", "activeIngredient", "meatWithdrawalDays", "eggWithdrawalDays", "status"
    INTO drug_record
  FROM "drugCatalog"
  WHERE "id" = NEW."drugId"
    AND "companyId" = NEW."companyId";

  IF drug_record."tradeName" IS NULL THEN
    RAISE EXCEPTION 'Drug product was not found';
  END IF;

  IF drug_record."status" <> 'Active' THEN
    RAISE EXCEPTION 'Only active drug products can be used for a new treatment course';
  END IF;

  NEW."drugTradeNameSnapshot" := drug_record."tradeName";
  NEW."activeIngredientSnapshot" := drug_record."activeIngredient";
  NEW."meatWithdrawalDaysSnapshot" := drug_record."meatWithdrawalDays";
  NEW."eggWithdrawalDaysSnapshot" := drug_record."eggWithdrawalDays";

  RETURN NEW;
END;
$$;

CREATE TRIGGER "flockTreatmentCourse_snapshot_drug"
BEFORE INSERT OR UPDATE OF "drugId" ON "flockTreatmentCourse"
FOR EACH ROW EXECUTE FUNCTION "snapshotTreatmentDrugMetadata"();

-- Recalculate withdrawal holds from the ACTUAL final administration, never
-- from the planned course end date.
CREATE OR REPLACE FUNCTION "refreshTreatmentWithdrawal"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  affected_course_id TEXT;
  affected_company_id TEXT;
  latest_administration TIMESTAMP WITH TIME ZONE;
  meat_days INTEGER;
  egg_days INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_course_id := OLD."courseId";
    affected_company_id := OLD."companyId";
  ELSE
    affected_course_id := NEW."courseId";
    affected_company_id := NEW."companyId";
  END IF;

  SELECT MAX("administeredAt")
    INTO latest_administration
  FROM "flockTreatmentAdministration"
  WHERE "courseId" = affected_course_id
    AND "companyId" = affected_company_id;

  SELECT "meatWithdrawalDaysSnapshot", "eggWithdrawalDaysSnapshot"
    INTO meat_days, egg_days
  FROM "flockTreatmentCourse"
  WHERE "id" = affected_course_id
    AND "companyId" = affected_company_id;

  UPDATE "flockTreatmentCourse"
  SET
    "lastAdministrationAt" = latest_administration,
    "meatWithdrawalUntil" = CASE
      WHEN latest_administration IS NULL OR meat_days IS NULL THEN NULL
      ELSE latest_administration + make_interval(days => meat_days)
    END,
    "eggWithdrawalUntil" = CASE
      WHEN latest_administration IS NULL OR egg_days IS NULL THEN NULL
      ELSE latest_administration + make_interval(days => egg_days)
    END,
    "status" = CASE
      WHEN latest_administration IS NOT NULL AND "status" = 'Planned' THEN 'Active'
      ELSE "status"
    END,
    "updatedAt" = NOW()
  WHERE "id" = affected_course_id
    AND "companyId" = affected_company_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "flockTreatmentAdministration_refresh_withdrawal"
AFTER INSERT OR UPDATE OR DELETE ON "flockTreatmentAdministration"
FOR EACH ROW EXECUTE FUNCTION "refreshTreatmentWithdrawal"();

CREATE OR REPLACE FUNCTION "validateTreatmentCourseCompletion"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."status" = 'Completed' AND OLD."status" <> 'Completed' AND NOT EXISTS (
    SELECT 1
    FROM "flockTreatmentAdministration"
    WHERE "companyId" = NEW."companyId"
      AND "courseId" = NEW."id"
  ) THEN
    RAISE EXCEPTION 'A treatment course cannot be completed before an actual administration is recorded';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "flockTreatmentCourse_validate_completion"
BEFORE UPDATE OF "status" ON "flockTreatmentCourse"
FOR EACH ROW EXECUTE FUNCTION "validateTreatmentCourseCompletion"();

ALTER TABLE "public"."flockClinicalEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockClinicalEventDisease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockTreatmentCourse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockTreatmentAdministration" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SELECT" ON "public"."flockClinicalEvent" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockClinicalEvent" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."flockClinicalEvent" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockClinicalEvent" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."flockClinicalEventDisease" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockClinicalEventDisease" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."flockClinicalEventDisease" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockClinicalEventDisease" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."flockTreatmentCourse" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockTreatmentCourse" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."flockTreatmentCourse" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockTreatmentCourse" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."flockTreatmentAdministration" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockTreatmentAdministration" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."flockTreatmentAdministration" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockTreatmentAdministration" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

COMMENT ON TABLE "flockClinicalEvent" IS 'Flock-level clinical case/observation record linked to the AVIOS digital passport.';
COMMENT ON TABLE "flockTreatmentCourse" IS 'Prescribed flock treatment regimen with drug and withdrawal metadata snapshotted for audit safety.';
COMMENT ON TABLE "flockTreatmentAdministration" IS 'Actual treatment administration. Withdrawal holds are calculated from the latest actual administration.';
