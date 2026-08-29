-- AVIOS laboratory core (LIMS): configurable laboratories, test definitions,
-- parameter schemas, sample accessions/specimens, test orders and snapshotted results.

CREATE TABLE "laboratory" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "laboratoryType" TEXT NOT NULL DEFAULT 'Diagnostic',
  "isInternal" BOOLEAN NOT NULL DEFAULT TRUE,
  "accreditation" TEXT,
  "contactReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  CONSTRAINT "laboratory_type_check" CHECK ("laboratoryType" IN ('Diagnostic', 'Feed', 'Slaughterhouse', 'Hatchery', 'Water', 'External', 'Other')),
  CONSTRAINT "laboratory_status_check" CHECK ("status" IN ('Active', 'Inactive')),
  CONSTRAINT "laboratory_company_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX "laboratory_companyId_idx" ON "laboratory" ("companyId");
CREATE INDEX "laboratory_status_idx" ON "laboratory" ("companyId", "status");

CREATE TABLE "labTestDefinition" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "laboratoryId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "method" TEXT,
  "sampleRequirements" TEXT,
  "turnaroundHours" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "description" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("laboratoryId", "companyId") REFERENCES "laboratory"("id", "companyId") ON DELETE CASCADE,
  CONSTRAINT "labTestDefinition_category_check" CHECK ("category" IN ('Microbiology', 'Serology', 'Molecular', 'Mycology', 'Feed Chemistry', 'Mycotoxin', 'Water Quality', 'Physical', 'Pathology', 'Other')),
  CONSTRAINT "labTestDefinition_status_check" CHECK ("status" IN ('Draft', 'Active', 'Archived')),
  CONSTRAINT "labTestDefinition_turnaround_check" CHECK ("turnaroundHours" IS NULL OR "turnaroundHours" > 0),
  CONSTRAINT "labTestDefinition_lab_code_key" UNIQUE ("laboratoryId", "companyId", "code"),
  CONSTRAINT "labTestDefinition_id_lab_company_key" UNIQUE ("id", "laboratoryId", "companyId")
);
CREATE INDEX "labTestDefinition_companyId_idx" ON "labTestDefinition" ("companyId");
CREATE INDEX "labTestDefinition_laboratoryId_idx" ON "labTestDefinition" ("laboratoryId");
CREATE INDEX "labTestDefinition_status_idx" ON "labTestDefinition" ("companyId", "status");

CREATE TABLE "labTestDiseaseTarget" (
  "companyId" TEXT NOT NULL,
  "testDefinitionId" TEXT NOT NULL,
  "diseaseId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("testDefinitionId", "diseaseId", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("testDefinitionId", "companyId") REFERENCES "labTestDefinition"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("diseaseId", "companyId") REFERENCES "diseaseCatalog"("id", "companyId") ON DELETE RESTRICT
);
CREATE INDEX "labTestDiseaseTarget_companyId_idx" ON "labTestDiseaseTarget" ("companyId");
CREATE INDEX "labTestDiseaseTarget_diseaseId_idx" ON "labTestDiseaseTarget" ("diseaseId");

CREATE TABLE "labTestParameter" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "testDefinitionId" TEXT NOT NULL,
  "sequenceNo" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "resultType" TEXT NOT NULL,
  "unit" TEXT,
  "decimalPlaces" INTEGER,
  "referenceMin" NUMERIC,
  "referenceMax" NUMERIC,
  "referenceText" TEXT,
  "qualitativeOptions" JSONB,
  "isRequired" BOOLEAN NOT NULL DEFAULT TRUE,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("testDefinitionId", "companyId") REFERENCES "labTestDefinition"("id", "companyId") ON DELETE CASCADE,
  CONSTRAINT "labTestParameter_sequence_check" CHECK ("sequenceNo" > 0),
  CONSTRAINT "labTestParameter_resultType_check" CHECK ("resultType" IN ('Numeric', 'Text', 'Qualitative', 'Positive/Negative', 'Detected/Not Detected', 'Titer', 'Ct', 'Boolean')),
  CONSTRAINT "labTestParameter_decimal_check" CHECK ("decimalPlaces" IS NULL OR "decimalPlaces" BETWEEN 0 AND 8),
  CONSTRAINT "labTestParameter_reference_check" CHECK ("referenceMin" IS NULL OR "referenceMax" IS NULL OR "referenceMax" >= "referenceMin"),
  CONSTRAINT "labTestParameter_status_check" CHECK ("status" IN ('Active', 'Inactive')),
  CONSTRAINT "labTestParameter_test_code_key" UNIQUE ("testDefinitionId", "companyId", "code"),
  CONSTRAINT "labTestParameter_test_sequence_key" UNIQUE ("testDefinitionId", "companyId", "sequenceNo")
);
CREATE INDEX "labTestParameter_companyId_idx" ON "labTestParameter" ("companyId");
CREATE INDEX "labTestParameter_testDefinitionId_idx" ON "labTestParameter" ("testDefinitionId");

CREATE TABLE "labAccession" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "accessionNumber" TEXT NOT NULL,
  "laboratoryId" TEXT NOT NULL,
  "flockId" TEXT,
  "clinicalEventId" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'Flock',
  "sourceReference" TEXT,
  "sourceLocation" TEXT,
  "collectedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "receivedAt" TIMESTAMP WITH TIME ZONE,
  "priority" TEXT NOT NULL DEFAULT 'Routine',
  "status" TEXT NOT NULL DEFAULT 'Collected',
  "requestedBy" TEXT,
  "externalReference" TEXT,
  "collectionNotes" TEXT,
  "rejectionReason" TEXT,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("laboratoryId", "companyId") REFERENCES "laboratory"("id", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("flockId", "companyId") REFERENCES "flockCycle"("id", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("clinicalEventId", "flockId", "companyId") REFERENCES "flockClinicalEvent"("id", "flockId", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "labAccession_sourceType_check" CHECK ("sourceType" IN ('Flock', 'Farm', 'Hatchery', 'Slaughterhouse', 'Feed', 'Water', 'Environment', 'Product', 'Other')),
  CONSTRAINT "labAccession_priority_check" CHECK ("priority" IN ('Routine', 'Urgent', 'STAT')),
  CONSTRAINT "labAccession_status_check" CHECK ("status" IN ('Collected', 'In Transit', 'Received', 'In Progress', 'Completed', 'Rejected', 'Cancelled')),
  CONSTRAINT "labAccession_flock_source_check" CHECK ("sourceType" <> 'Flock' OR "flockId" IS NOT NULL),
  CONSTRAINT "labAccession_rejection_check" CHECK ("status" <> 'Rejected' OR "rejectionReason" IS NOT NULL),
  CONSTRAINT "labAccession_company_number_key" UNIQUE ("companyId", "accessionNumber"),
  CONSTRAINT "labAccession_id_lab_company_key" UNIQUE ("id", "laboratoryId", "companyId")
);
CREATE INDEX "labAccession_companyId_idx" ON "labAccession" ("companyId");
CREATE INDEX "labAccession_laboratoryId_idx" ON "labAccession" ("laboratoryId");
CREATE INDEX "labAccession_flockId_idx" ON "labAccession" ("flockId");
CREATE INDEX "labAccession_clinicalEventId_idx" ON "labAccession" ("clinicalEventId");
CREATE INDEX "labAccession_status_idx" ON "labAccession" ("companyId", "status");
CREATE INDEX "labAccession_collectedAt_idx" ON "labAccession" ("companyId", "collectedAt");

CREATE TABLE "labSpecimen" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "accessionId" TEXT NOT NULL,
  "specimenCode" TEXT NOT NULL,
  "specimenType" TEXT NOT NULL,
  "anatomicalSite" TEXT,
  "poolSize" INTEGER,
  "quantity" NUMERIC,
  "quantityUnit" TEXT,
  "containerType" TEXT,
  "preservative" TEXT,
  "conditionOnReceipt" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Available',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("accessionId", "companyId") REFERENCES "labAccession"("id", "companyId") ON DELETE CASCADE,
  CONSTRAINT "labSpecimen_pool_check" CHECK ("poolSize" IS NULL OR "poolSize" > 0),
  CONSTRAINT "labSpecimen_quantity_check" CHECK ("quantity" IS NULL OR "quantity" > 0),
  CONSTRAINT "labSpecimen_status_check" CHECK ("status" IN ('Available', 'In Testing', 'Exhausted', 'Stored', 'Disposed', 'Rejected')),
  CONSTRAINT "labSpecimen_company_code_key" UNIQUE ("companyId", "specimenCode"),
  CONSTRAINT "labSpecimen_id_accession_company_key" UNIQUE ("id", "accessionId", "companyId")
);
CREATE INDEX "labSpecimen_companyId_idx" ON "labSpecimen" ("companyId");
CREATE INDEX "labSpecimen_accessionId_idx" ON "labSpecimen" ("accessionId");

CREATE TABLE "labTestOrder" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "laboratoryId" TEXT NOT NULL,
  "accessionId" TEXT NOT NULL,
  "specimenId" TEXT NOT NULL,
  "testDefinitionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Requested',
  "testCodeSnapshot" TEXT NOT NULL,
  "testNameSnapshot" TEXT NOT NULL,
  "categorySnapshot" TEXT NOT NULL,
  "methodSnapshot" TEXT,
  "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "startedAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "analyst" TEXT,
  "overallInterpretation" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" TEXT REFERENCES "user"("id"),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("accessionId", "laboratoryId", "companyId") REFERENCES "labAccession"("id", "laboratoryId", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("specimenId", "accessionId", "companyId") REFERENCES "labSpecimen"("id", "accessionId", "companyId") ON DELETE RESTRICT,
  FOREIGN KEY ("testDefinitionId", "laboratoryId", "companyId") REFERENCES "labTestDefinition"("id", "laboratoryId", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "labTestOrder_status_check" CHECK ("status" IN ('Requested', 'In Progress', 'Completed', 'Rejected', 'Cancelled')),
  CONSTRAINT "labTestOrder_completion_check" CHECK ("status" <> 'Completed' OR "completedAt" IS NOT NULL),
  CONSTRAINT "labTestOrder_accession_specimen_test_key" UNIQUE ("accessionId", "specimenId", "testDefinitionId", "companyId")
);
CREATE INDEX "labTestOrder_companyId_idx" ON "labTestOrder" ("companyId");
CREATE INDEX "labTestOrder_accessionId_idx" ON "labTestOrder" ("accessionId");
CREATE INDEX "labTestOrder_specimenId_idx" ON "labTestOrder" ("specimenId");
CREATE INDEX "labTestOrder_testDefinitionId_idx" ON "labTestOrder" ("testDefinitionId");
CREATE INDEX "labTestOrder_status_idx" ON "labTestOrder" ("companyId", "status");

CREATE TABLE "labResult" (
  "id" TEXT NOT NULL DEFAULT id(),
  "companyId" TEXT NOT NULL,
  "testOrderId" TEXT NOT NULL,
  "parameterDefinitionId" TEXT NOT NULL,
  "sequenceNo" INTEGER NOT NULL,
  "parameterCodeSnapshot" TEXT NOT NULL,
  "parameterNameSnapshot" TEXT NOT NULL,
  "resultTypeSnapshot" TEXT NOT NULL,
  "unitSnapshot" TEXT,
  "referenceMinSnapshot" NUMERIC,
  "referenceMaxSnapshot" NUMERIC,
  "referenceTextSnapshot" TEXT,
  "isRequiredSnapshot" BOOLEAN NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "numericValue" NUMERIC,
  "textValue" TEXT,
  "qualitativeValue" TEXT,
  "booleanValue" BOOLEAN,
  "resultFlag" TEXT,
  "comment" TEXT,
  "enteredBy" TEXT REFERENCES "user"("id"),
  "enteredAt" TIMESTAMP WITH TIME ZONE,
  "verifiedBy" TEXT REFERENCES "user"("id"),
  "verifiedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id", "companyId"),
  FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE,
  FOREIGN KEY ("testOrderId", "companyId") REFERENCES "labTestOrder"("id", "companyId") ON DELETE CASCADE,
  FOREIGN KEY ("parameterDefinitionId", "companyId") REFERENCES "labTestParameter"("id", "companyId") ON DELETE RESTRICT,
  CONSTRAINT "labResult_status_check" CHECK ("status" IN ('Pending', 'Entered', 'Verified')),
  CONSTRAINT "labResult_flag_check" CHECK ("resultFlag" IS NULL OR "resultFlag" IN ('Normal', 'Abnormal', 'Critical', 'Positive', 'Negative', 'Detected', 'Not Detected', 'Not Applicable')),
  CONSTRAINT "labResult_test_parameter_key" UNIQUE ("testOrderId", "parameterDefinitionId", "companyId")
);
CREATE INDEX "labResult_companyId_idx" ON "labResult" ("companyId");
CREATE INDEX "labResult_testOrderId_idx" ON "labResult" ("testOrderId");
CREATE INDEX "labResult_parameterDefinitionId_idx" ON "labResult" ("parameterDefinitionId");
CREATE INDEX "labResult_status_idx" ON "labResult" ("companyId", "status");

CREATE OR REPLACE FUNCTION "generateLabAccessionNumber"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."accessionNumber" IS NULL OR btrim(NEW."accessionNumber") = '' THEN
    NEW."accessionNumber" := 'ACC-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substr(replace(id(), '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "labAccession_generate_number"
BEFORE INSERT ON "labAccession"
FOR EACH ROW EXECUTE FUNCTION "generateLabAccessionNumber"();

CREATE OR REPLACE FUNCTION "generateLabSpecimenCode"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."specimenCode" IS NULL OR btrim(NEW."specimenCode") = '' THEN
    NEW."specimenCode" := 'SP-' || upper(substr(replace(id(), '-', ''), 1, 10));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "labSpecimen_generate_code"
BEFORE INSERT ON "labSpecimen"
FOR EACH ROW EXECUTE FUNCTION "generateLabSpecimenCode"();

CREATE OR REPLACE FUNCTION "snapshotLabTestOrder"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  test_record RECORD;
BEGIN
  SELECT "code", "name", "category", "method", "status"
    INTO test_record
  FROM "labTestDefinition"
  WHERE "id" = NEW."testDefinitionId"
    AND "laboratoryId" = NEW."laboratoryId"
    AND "companyId" = NEW."companyId";

  IF test_record."code" IS NULL THEN
    RAISE EXCEPTION 'Laboratory test definition was not found';
  END IF;
  IF test_record."status" <> 'Active' THEN
    RAISE EXCEPTION 'Only active laboratory tests can be ordered';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "labTestParameter"
    WHERE "testDefinitionId" = NEW."testDefinitionId"
      AND "companyId" = NEW."companyId"
      AND "status" = 'Active'
  ) THEN
    RAISE EXCEPTION 'An active laboratory test requires at least one active parameter';
  END IF;

  NEW."testCodeSnapshot" := test_record."code";
  NEW."testNameSnapshot" := test_record."name";
  NEW."categorySnapshot" := test_record."category";
  NEW."methodSnapshot" := test_record."method";
  RETURN NEW;
END;
$$;
CREATE TRIGGER "labTestOrder_snapshot_definition"
BEFORE INSERT ON "labTestOrder"
FOR EACH ROW EXECUTE FUNCTION "snapshotLabTestOrder"();

CREATE OR REPLACE FUNCTION "generateLabResultRows"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "labResult" (
    "companyId", "testOrderId", "parameterDefinitionId", "sequenceNo",
    "parameterCodeSnapshot", "parameterNameSnapshot", "resultTypeSnapshot", "unitSnapshot",
    "referenceMinSnapshot", "referenceMaxSnapshot", "referenceTextSnapshot", "isRequiredSnapshot"
  )
  SELECT
    NEW."companyId", NEW."id", p."id", p."sequenceNo",
    p."code", p."name", p."resultType", p."unit",
    p."referenceMin", p."referenceMax", p."referenceText", p."isRequired"
  FROM "labTestParameter" p
  WHERE p."testDefinitionId" = NEW."testDefinitionId"
    AND p."companyId" = NEW."companyId"
    AND p."status" = 'Active'
  ORDER BY p."sequenceNo";

  UPDATE "labSpecimen"
  SET "status" = CASE WHEN "status" = 'Available' THEN 'In Testing' ELSE "status" END,
      "updatedAt" = NOW()
  WHERE "id" = NEW."specimenId" AND "companyId" = NEW."companyId";

  UPDATE "labAccession"
  SET "status" = CASE WHEN "status" IN ('Collected', 'In Transit', 'Received') THEN 'In Progress' ELSE "status" END,
      "updatedAt" = NOW()
  WHERE "id" = NEW."accessionId" AND "companyId" = NEW."companyId";

  RETURN NEW;
END;
$$;
CREATE TRIGGER "labTestOrder_generate_results"
AFTER INSERT ON "labTestOrder"
FOR EACH ROW EXECUTE FUNCTION "generateLabResultRows"();

CREATE OR REPLACE FUNCTION "validateLabResultEntry"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  populated_count INTEGER;
BEGIN
  IF NEW."status" IN ('Entered', 'Verified') THEN
    populated_count :=
      (CASE WHEN NEW."numericValue" IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN NEW."textValue" IS NOT NULL AND btrim(NEW."textValue") <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN NEW."qualitativeValue" IS NOT NULL AND btrim(NEW."qualitativeValue") <> '' THEN 1 ELSE 0 END) +
      (CASE WHEN NEW."booleanValue" IS NOT NULL THEN 1 ELSE 0 END);

    IF populated_count <> 1 THEN
      RAISE EXCEPTION 'An entered laboratory result must contain exactly one result value';
    END IF;

    IF NEW."resultTypeSnapshot" IN ('Numeric', 'Titer', 'Ct') AND NEW."numericValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a numeric result';
    ELSIF NEW."resultTypeSnapshot" = 'Text' AND NEW."textValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a text result';
    ELSIF NEW."resultTypeSnapshot" IN ('Qualitative', 'Positive/Negative', 'Detected/Not Detected') AND NEW."qualitativeValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a qualitative result';
    ELSIF NEW."resultTypeSnapshot" = 'Boolean' AND NEW."booleanValue" IS NULL THEN
      RAISE EXCEPTION 'This laboratory parameter requires a boolean result';
    END IF;

    IF NEW."enteredAt" IS NULL THEN NEW."enteredAt" := NOW(); END IF;
  END IF;

  IF NEW."status" = 'Verified' AND (NEW."verifiedAt" IS NULL OR NEW."verifiedBy" IS NULL) THEN
    RAISE EXCEPTION 'Verified laboratory results require verifier and verification time';
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER "labResult_validate_entry"
BEFORE INSERT OR UPDATE ON "labResult"
FOR EACH ROW EXECUTE FUNCTION "validateLabResultEntry"();

CREATE OR REPLACE FUNCTION "validateLabTestOrderCompletion"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW."status" = 'Completed' AND OLD."status" <> 'Completed' THEN
    IF EXISTS (
      SELECT 1 FROM "labResult"
      WHERE "testOrderId" = NEW."id"
        AND "companyId" = NEW."companyId"
        AND "isRequiredSnapshot" = TRUE
        AND "status" = 'Pending'
    ) THEN
      RAISE EXCEPTION 'All required laboratory parameters must be entered before test completion';
    END IF;
    IF NEW."completedAt" IS NULL THEN NEW."completedAt" := NOW(); END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "labTestOrder_validate_completion"
BEFORE UPDATE OF "status" ON "labTestOrder"
FOR EACH ROW EXECUTE FUNCTION "validateLabTestOrderCompletion"();

ALTER TABLE "public"."laboratory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labTestDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labTestDiseaseTarget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labTestParameter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labAccession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labSpecimen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labTestOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labResult" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SELECT" ON "public"."laboratory" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."laboratory" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."laboratory" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."laboratory" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labTestDefinition" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labTestDefinition" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labTestDefinition" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labTestDefinition" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labTestDiseaseTarget" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labTestDiseaseTarget" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labTestDiseaseTarget" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labTestDiseaseTarget" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labTestParameter" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labTestParameter" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labTestParameter" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labTestParameter" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labAccession" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labAccession" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labAccession" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labAccession" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labSpecimen" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labSpecimen" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labSpecimen" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labSpecimen" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labTestOrder" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labTestOrder" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labTestOrder" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labTestOrder" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

CREATE POLICY "SELECT" ON "public"."labResult" FOR SELECT USING ("companyId" = ANY ((SELECT get_companies_with_employee_role())::text[]));
CREATE POLICY "INSERT" ON "public"."labResult" FOR INSERT WITH CHECK ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_create'))::text[]));
CREATE POLICY "UPDATE" ON "public"."labResult" FOR UPDATE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_update'))::text[]));
CREATE POLICY "DELETE" ON "public"."labResult" FOR DELETE USING ("companyId" = ANY ((SELECT get_companies_with_employee_permission('production_delete'))::text[]));

COMMENT ON TABLE "laboratory" IS 'Configurable AVIOS laboratory registry covering diagnostic, feed, slaughterhouse, hatchery, water and external laboratories.';
COMMENT ON TABLE "labTestDefinition" IS 'Reusable laboratory test/assay definition assigned to a laboratory.';
COMMENT ON TABLE "labTestParameter" IS 'Configurable result schema for a laboratory test; active parameters are snapshotted when a test is ordered.';
COMMENT ON TABLE "labAccession" IS 'Sample submission/accession with traceability to flock or another operational source.';
COMMENT ON TABLE "labSpecimen" IS 'Physical specimen within an accession, including pooling and receipt condition.';
COMMENT ON TABLE "labTestOrder" IS 'Requested test against one specimen with test metadata snapshotted for historical integrity.';
COMMENT ON TABLE "labResult" IS 'Snapshotted parameter result row for a laboratory test order.';
