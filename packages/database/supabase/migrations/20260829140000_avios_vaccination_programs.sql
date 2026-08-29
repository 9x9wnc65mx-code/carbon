-- AVIOS poultry health foundation: disease/vaccine/drug catalogs,
-- reusable vaccination programs, flock assignments and planned-vs-actual events.

CREATE TABLE "diseaseCatalog" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scientificName" TEXT,
  "pathogenType" TEXT NOT NULL DEFAULT 'Viral',
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "diseaseCatalog_pathogenType_check" CHECK ("pathogenType" IN ('Viral', 'Bacterial', 'Parasitic', 'Fungal', 'Other')),
  CONSTRAINT "diseaseCatalog_status_check" CHECK ("status" IN ('Active', 'Inactive')),
  CONSTRAINT "diseaseCatalog_companyId_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX "diseaseCatalog_companyId_idx" ON "diseaseCatalog" ("companyId");
CREATE INDEX "diseaseCatalog_createdBy_idx" ON "diseaseCatalog" ("createdBy");
CREATE INDEX "diseaseCatalog_updatedBy_idx" ON "diseaseCatalog" ("updatedBy");

CREATE TABLE "vaccineCatalog" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "tradeName" TEXT NOT NULL,
  "manufacturer" TEXT,
  "vaccineType" TEXT NOT NULL DEFAULT 'Live',
  "defaultRoute" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "vaccineCatalog_type_check" CHECK ("vaccineType" IN ('Live', 'Inactivated', 'Recombinant', 'Vector', 'Subunit', 'Other')),
  CONSTRAINT "vaccineCatalog_status_check" CHECK ("status" IN ('Active', 'Inactive')),
  CONSTRAINT "vaccineCatalog_companyId_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX "vaccineCatalog_companyId_idx" ON "vaccineCatalog" ("companyId");
CREATE INDEX "vaccineCatalog_createdBy_idx" ON "vaccineCatalog" ("createdBy");
CREATE INDEX "vaccineCatalog_updatedBy_idx" ON "vaccineCatalog" ("updatedBy");

CREATE TABLE "vaccineDiseaseTarget" (
  "companyId" TEXT NOT NULL,
  "vaccineId" TEXT NOT NULL,
  "diseaseId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("vaccineId", "diseaseId", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("vaccineId", "companyId") REFERENCES "vaccineCatalog"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("diseaseId", "companyId") REFERENCES "diseaseCatalog"("id", "companyId") ON DELETE CASCADE
);
CREATE INDEX "vaccineDiseaseTarget_companyId_idx" ON "vaccineDiseaseTarget" ("companyId");
CREATE INDEX "vaccineDiseaseTarget_diseaseId_idx" ON "vaccineDiseaseTarget" ("diseaseId");

CREATE TABLE "drugCatalog" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "tradeName" TEXT NOT NULL,
  "activeIngredient" TEXT,
  "drugClass" TEXT,
  "defaultRoute" TEXT,
  "meatWithdrawalDays" INTEGER,
  "eggWithdrawalDays" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "drugCatalog_meatWithdrawal_check" CHECK ("meatWithdrawalDays" IS NULL OR "meatWithdrawalDays" >= 0),
  CONSTRAINT "drugCatalog_eggWithdrawal_check" CHECK ("eggWithdrawalDays" IS NULL OR "eggWithdrawalDays" >= 0),
  CONSTRAINT "drugCatalog_status_check" CHECK ("status" IN ('Active', 'Inactive')),
  CONSTRAINT "drugCatalog_companyId_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX "drugCatalog_companyId_idx" ON "drugCatalog" ("companyId");
CREATE INDEX "drugCatalog_createdBy_idx" ON "drugCatalog" ("createdBy");
CREATE INDEX "drugCatalog_updatedBy_idx" ON "drugCatalog" ("updatedBy");

CREATE TABLE "vaccinationProgram" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "flockType" TEXT NOT NULL DEFAULT 'Broiler',
  "strain" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "description" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "vaccinationProgram_flockType_check" CHECK ("flockType" IN ('Broiler', 'Breeder', 'Layer', 'Other')),
  CONSTRAINT "vaccinationProgram_status_check" CHECK ("status" IN ('Draft', 'Active', 'Archived')),
  CONSTRAINT "vaccinationProgram_companyId_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX "vaccinationProgram_companyId_idx" ON "vaccinationProgram" ("companyId");
CREATE INDEX "vaccinationProgram_createdBy_idx" ON "vaccinationProgram" ("createdBy");
CREATE INDEX "vaccinationProgram_updatedBy_idx" ON "vaccinationProgram" ("updatedBy");

CREATE TABLE "vaccinationProgramStep" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "sequenceNo" INTEGER NOT NULL,
  "targetAgeDays" INTEGER NOT NULL,
  "vaccineId" TEXT,
  "route" TEXT NOT NULL,
  "doseValue" NUMERIC,
  "doseUnit" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("programId", "companyId") REFERENCES "vaccinationProgram"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("vaccineId", "companyId") REFERENCES "vaccineCatalog"("id", "companyId") ON DELETE SET NULL,
  CONSTRAINT "vaccinationProgramStep_sequence_check" CHECK ("sequenceNo" > 0),
  CONSTRAINT "vaccinationProgramStep_age_check" CHECK ("targetAgeDays" >= 0),
  CONSTRAINT "vaccinationProgramStep_dose_check" CHECK ("doseValue" IS NULL OR "doseValue" > 0),
  CONSTRAINT "vaccinationProgramStep_program_sequence_key" UNIQUE ("companyId", "programId", "sequenceNo")
);
CREATE INDEX "vaccinationProgramStep_companyId_idx" ON "vaccinationProgramStep" ("companyId");
CREATE INDEX "vaccinationProgramStep_programId_idx" ON "vaccinationProgramStep" ("programId");
CREATE INDEX "vaccinationProgramStep_vaccineId_idx" ON "vaccinationProgramStep" ("vaccineId");

CREATE TABLE "vaccinationProgramStepDisease" (
  "companyId" TEXT NOT NULL,
  "programStepId" TEXT NOT NULL,
  "diseaseId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("programStepId", "diseaseId", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("programStepId", "companyId") REFERENCES "vaccinationProgramStep"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("diseaseId", "companyId") REFERENCES "diseaseCatalog"("id", "companyId") ON DELETE CASCADE
);
CREATE INDEX "vaccinationProgramStepDisease_companyId_idx" ON "vaccinationProgramStepDisease" ("companyId");
CREATE INDEX "vaccinationProgramStepDisease_diseaseId_idx" ON "vaccinationProgramStepDisease" ("diseaseId");

CREATE TABLE "flockVaccinationAssignment" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "flockId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "assignedDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("programId", "companyId") REFERENCES "vaccinationProgram"("id", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "flockVaccinationAssignment_status_check" CHECK ("status" IN ('Active', 'Completed', 'Cancelled')),
  CONSTRAINT "flockVaccinationAssignment_flock_program_key" UNIQUE ("companyId", "flockId", "programId")
);
CREATE INDEX "flockVaccinationAssignment_companyId_idx" ON "flockVaccinationAssignment" ("companyId");
CREATE INDEX "flockVaccinationAssignment_flockId_idx" ON "flockVaccinationAssignment" ("flockId");
CREATE INDEX "flockVaccinationAssignment_programId_idx" ON "flockVaccinationAssignment" ("programId");

CREATE TABLE "flockVaccinationEvent" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "flockId" TEXT NOT NULL,
  "programStepId" TEXT NOT NULL,
  "scheduledDate" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Planned',
  "vaccineId" TEXT,
  "route" TEXT NOT NULL,
  "doseValue" NUMERIC,
  "doseUnit" TEXT,
  "administeredAt" TIMESTAMP WITH TIME ZONE,
  "productBatch" TEXT,
  "expiryDate" DATE,
  "performedBy" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("assignmentId", "companyId") REFERENCES "flockVaccinationAssignment"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("programStepId", "companyId") REFERENCES "vaccinationProgramStep"("id", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("vaccineId", "companyId") REFERENCES "vaccineCatalog"("id", "companyId") ON DELETE SET NULL,
  CONSTRAINT "flockVaccinationEvent_status_check" CHECK ("status" IN ('Planned', 'Completed', 'Skipped', 'Cancelled')),
  CONSTRAINT "flockVaccinationEvent_dose_check" CHECK ("doseValue" IS NULL OR "doseValue" > 0),
  CONSTRAINT "flockVaccinationEvent_completed_check" CHECK ("status" <> 'Completed' OR "administeredAt" IS NOT NULL),
  CONSTRAINT "flockVaccinationEvent_assignment_step_key" UNIQUE ("companyId", "assignmentId", "programStepId")
);
CREATE INDEX "flockVaccinationEvent_companyId_idx" ON "flockVaccinationEvent" ("companyId");
CREATE INDEX "flockVaccinationEvent_flockId_idx" ON "flockVaccinationEvent" ("flockId");
CREATE INDEX "flockVaccinationEvent_scheduledDate_idx" ON "flockVaccinationEvent" ("companyId", "scheduledDate");
CREATE INDEX "flockVaccinationEvent_status_idx" ON "flockVaccinationEvent" ("companyId", "status");

CREATE TABLE "flockVaccinationEventDisease" (
  "companyId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "diseaseId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("eventId", "diseaseId", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("eventId", "companyId") REFERENCES "flockVaccinationEvent"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("diseaseId", "companyId") REFERENCES "diseaseCatalog"("id", "companyId") ON DELETE RESTRICT
);
CREATE INDEX "flockVaccinationEventDisease_companyId_idx" ON "flockVaccinationEventDisease" ("companyId");
CREATE INDEX "flockVaccinationEventDisease_diseaseId_idx" ON "flockVaccinationEventDisease" ("diseaseId");

-- Assigning a program snapshots its current steps into flock events atomically.
-- Later edits to the reusable program do not rewrite the flock's historical plan.
CREATE OR REPLACE FUNCTION "generateFlockVaccinationSchedule"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  placement_date DATE;
BEGIN
  SELECT "placementDate"
    INTO placement_date
  FROM "flockCycle"
  WHERE "id" = NEW."flockId"
    AND "companyId" = NEW."companyId";

  IF placement_date IS NULL THEN
    RAISE EXCEPTION 'Flock placement date is required to generate vaccination schedule';
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

CREATE TRIGGER "flockVaccinationAssignment_generate_schedule"
AFTER INSERT ON "flockVaccinationAssignment"
FOR EACH ROW EXECUTE FUNCTION "generateFlockVaccinationSchedule"();

-- RLS: reuse Carbon production permissions until dedicated poultry RBAC lands.
ALTER TABLE "public"."diseaseCatalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vaccineCatalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vaccineDiseaseTarget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drugCatalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vaccinationProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vaccinationProgramStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vaccinationProgramStepDisease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockVaccinationAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockVaccinationEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flockVaccinationEventDisease" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SELECT" ON "public"."diseaseCatalog" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."diseaseCatalog" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."diseaseCatalog" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."diseaseCatalog" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."vaccineCatalog" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."vaccineCatalog" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."vaccineCatalog" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."vaccineCatalog" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."vaccineDiseaseTarget" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."vaccineDiseaseTarget" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "DELETE" ON "public"."vaccineDiseaseTarget" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."drugCatalog" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."drugCatalog" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."drugCatalog" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."drugCatalog" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."vaccinationProgram" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."vaccinationProgram" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."vaccinationProgram" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."vaccinationProgram" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."vaccinationProgramStep" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."vaccinationProgramStep" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."vaccinationProgramStep" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."vaccinationProgramStep" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."vaccinationProgramStepDisease" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."vaccinationProgramStepDisease" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "DELETE" ON "public"."vaccinationProgramStepDisease" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."flockVaccinationAssignment" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockVaccinationAssignment" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."flockVaccinationAssignment" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockVaccinationAssignment" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."flockVaccinationEvent" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockVaccinationEvent" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."flockVaccinationEvent" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockVaccinationEvent" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."flockVaccinationEventDisease" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."flockVaccinationEventDisease" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "DELETE" ON "public"."flockVaccinationEventDisease" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

COMMENT ON TABLE "vaccinationProgram" IS 'Reusable poultry vaccination program template.';
COMMENT ON TABLE "flockVaccinationAssignment" IS 'Assignment of a reusable vaccination program to a specific flock.';
COMMENT ON TABLE "flockVaccinationEvent" IS 'Snapshot schedule and actual administration record for planned-vs-actual vaccination traceability.';
